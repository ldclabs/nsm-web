import {
  Channel,
  createAction,
  isWindow,
  useIsMounted,
  type ModalRef,
} from '@ldclabs/util'
import { client, utils } from '@passwordless-id/webauthn'
import {
  createContext,
  createElement,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  EMPTY,
  Observable,
  catchError,
  concatMap,
  finalize,
  from,
  tap,
  type Subscription,
} from 'rxjs'
import { type UserInfo } from './common'
import { useLogger } from './logger'
import { authStore } from './store'
import {
  createRequest,
  useFetcherConfig,
  type FetcherConfig,
} from './useFetcher'

interface AccessToken {
  sub: string
  access_token: string
  /**
   * 默认有效期为 1 小时 (3600s)
   */
  expires_in: number
}

export type IdentityProvider = 'Passkey' | 'Github'

interface ChallengeOutput {
  rp_id: string
  rp_name: string
  user_handle: string
  challenge: Uint8Array
}

interface Authentication {
  id: string
  authenticator_data: Uint8Array
  client_data: Uint8Array
  signature: Uint8Array
  ip: string
  device_id: string
  device_desc: string
}

interface CredentialUserEntity {
  id: string // credential id in base64url
  transports: AuthenticatorTransport[]
  display_name: string
  picture: string
}

const CredentialUserEntitiesKey = 'CredentialUserEntitys'

export function passKeyIsAvailable() {
  return client.isAvailable()
}

export async function passKeyIsExist() {
  const credentialUserEntities: CredentialUserEntity[] =
    (await authStore.getItem(CredentialUserEntitiesKey)) || []
  return client.isAvailable() && credentialUserEntities.length > 0
}

class AuthAPI {
  private request: ReturnType<typeof createRequest>

  constructor(
    private logger: ReturnType<typeof useLogger>,
    private config: FetcherConfig
  ) {
    this.request = createRequest(this.logger, this.config.AUTH_URL, {
      credentials: 'include',
    })
  }

  fetchUser(signal: AbortSignal | null) {
    return this.request.get<UserInfo>('/userinfo', undefined, signal)
  }

  fetchAccessToken(signal: AbortSignal | null) {
    return this.request.get<AccessToken>('/access_token', undefined, signal)
  }

  private authentication = createAction<{ status: number }>('__AUTH_CALLBACK__')

  private async passkeyGetChallenge() {
    const res = await this.request.get<ChallengeOutput>(
      '/passkey/get_challenge'
    )
    return res
  }

  private async passkeyRegister(
    display_name: string,
    challenge: ChallengeOutput
  ) {
    const creationOptions: PublicKeyCredentialCreationOptions = {
      challenge: challenge.challenge.buffer,
      rp: {
        id: challenge.rp_id,
        name: challenge.rp_name,
      },
      user: {
        id: utils.parseBase64url(challenge.user_handle),
        name: display_name,
        displayName: display_name,
      },
      pubKeyCredParams: [
        { alg: -8, type: 'public-key' }, // Ed25519
        { alg: -7, type: 'public-key' }, // ES256 (Webauthn's default algorithm)
        { alg: -257, type: 'public-key' }, // RS256 (for Windows Hello and others)
      ],
      timeout: 60000,
      authenticatorSelection: {
        userVerification: 'preferred',
        residentKey: 'required',
      },
      attestation: 'none',
    }

    const credential = (await navigator.credentials.create({
      publicKey: creationOptions,
    })) as any

    if (!credential) {
      throw new Error('Passkey (Webauthn) registration failed')
    }

    const response = credential.response as AuthenticatorAttestationResponse

    const registration = {
      id: credential.id,
      display_name,
      authenticator_data: new Uint8Array(response.getAuthenticatorData()),
      client_data: new Uint8Array(response.clientDataJSON),
    }
    const res = await this.request.post<any>(
      '/passkey/verify_registration',
      registration
    )

    const credentialUserEntities: CredentialUserEntity[] =
      (await authStore.getItem(CredentialUserEntitiesKey)) || []
    if (!credentialUserEntities.find((entity) => entity.id === credential.id)) {
      credentialUserEntities.push({
        id: credential.id,
        transports: response.getTransports() as AuthenticatorTransport[],
        display_name,
        picture: '',
      })
      await authStore.setItem(CredentialUserEntitiesKey, credentialUserEntities)
    }

    return res
  }

  private async passkeyGetAuthentication(
    challenge: ChallengeOutput
  ): Promise<Authentication> {
    const credentialUserEntities: CredentialUserEntity[] =
      (await authStore.getItem(CredentialUserEntitiesKey)) || []

    // https://w3c.github.io/webauthn/#enum-transport
    const transports: AuthenticatorTransport[] =
      (await client.isLocalAuthenticator())
        ? ['internal']
        : ['internal', 'hybrid', 'usb', 'ble', 'nfc']
    const authOptions: PublicKeyCredentialRequestOptions = {
      challenge: challenge.challenge.buffer,
      rpId: challenge.rp_id,
      allowCredentials: credentialUserEntities.map((entity) => {
        return {
          id: utils.parseBase64url(entity.id),
          type: 'public-key',
          transports:
            entity.transports?.length > 0 ? entity.transports : transports,
        }
      }),
      userVerification: 'preferred',
      timeout: 60000,
    }

    const auth = await navigator.credentials.get({
      publicKey: authOptions,
    })
    if (!auth) {
      throw new Error('Passkey (Webauthn) authentication failed')
    }

    const response = (auth as any).response as AuthenticatorAssertionResponse

    return {
      id: auth.id,
      authenticator_data: new Uint8Array(response.authenticatorData),
      client_data: new Uint8Array(response.clientDataJSON),
      signature: new Uint8Array(response.signature),
      ip: '',
      device_id: '',
      device_desc: '',
    }
  }

  private async passkeyVerifyAuthentication(authentication: Authentication) {
    const res = await this.request.post<any>(
      '/passkey/verify_authentication',
      authentication
    )
    const credentialUserEntities: CredentialUserEntity[] =
      (await authStore.getItem(CredentialUserEntitiesKey)) || []
    if (
      !credentialUserEntities.find((entity) => entity.id === authentication.id)
    ) {
      credentialUserEntities.push({
        id: authentication.id,
        transports: [],
        display_name: '',
        picture: '',
      })
      await authStore.setItem(CredentialUserEntitiesKey, credentialUserEntities)
    }
    return res
  }

  authorize(
    provider: IdentityProvider,
    display_name: string,
    signal: AbortSignal | null
  ) {
    return new Observable<UserInfo>((observer) => {
      ;(async () => {
        if (provider === 'Passkey') {
          if (!client.isAvailable()) {
            throw new Error('Passkey (Webauthn) is not available')
          }

          if (display_name) {
            const challenge = await this.passkeyGetChallenge()
            await this.passkeyRegister(display_name, challenge)
            await new Promise((resolve) => setTimeout(resolve, 2000))
          }

          const challenge = await this.passkeyGetChallenge()
          const authentication = await this.passkeyGetAuthentication(challenge)
          await this.passkeyVerifyAuthentication(authentication)
        }

        await new Promise((resolve) => setTimeout(resolve, 1000))
        const user = await this.fetchUser(signal)
        observer.next(user)
        observer.complete()
      })().catch((error: Error) => {
        console.error('authorize failed:', error)
        observer.error(error)
      })
    })
  }

  callback(payload: { status: number }) {
    const { opener } = window
    if (isWindow(opener)) {
      const channel = new Channel(opener)
      channel
        .send(this.authentication(payload))
        .catch(() => {}) // ignore error
        .finally(() => channel.close())
    }
  }

  logout() {
    return this.request.post('/logout')
  }
}

interface State {
  isInitialized: boolean
  isAuthorized: boolean
  language: string
  error: string
  user?: UserInfo | undefined
  accessToken?: string | undefined
  refreshInterval?: number | undefined
  dialog: ModalRef
  authorize: (provider: IdentityProvider, display_name: string) => void
  authorizingProvider?: IdentityProvider | undefined
  callback: (payload: { status: number }) => void
  logout: () => void
}

const Context = createContext<Readonly<State>>({
  isInitialized: false,
  isAuthorized: false,
  language: '',
  error: '',
  dialog: {
    open: false,
    show: () => {},
    close: () => {},
    toggle: () => {},
  },
  authorize: () => {},
  callback: () => {},
  logout: () => {},
})

export function useAuth() {
  return useContext(Context)
}

export const xLanguage = { current: '' }

export function setXLanguage(language: string) {
  xLanguage.current = language
}

export function useEnsureAuthorized() {
  const {
    isAuthorized,
    dialog: { show: showDialog },
  } = useAuth()

  return useCallback(
    <T extends (...args: never[]) => unknown>(callback: T) => {
      return (...args: Parameters<T>) => {
        if (isAuthorized) {
          return callback(...args) as ReturnType<T>
        } else {
          return showDialog() as undefined
        }
      }
    },
    [isAuthorized, showDialog]
  )
}

export function useEnsureAuthorizedCallback() {
  const {
    isAuthorized,
    dialog: { show: showDialog },
  } = useAuth()

  const createHandler = useCallback(
    <T extends React.SyntheticEvent>(callback?: (ev: T) => void) => {
      return (ev: T) => {
        if (isAuthorized) {
          callback?.(ev)
        } else {
          ev.preventDefault()
          ev.stopPropagation()
          showDialog()
        }
      }
    },
    [isAuthorized, showDialog]
  )

  return useCallback(
    <T extends React.SyntheticEvent>(ev: T | ((ev: T) => void)) => {
      if (typeof ev === 'function') {
        const callback = ev
        return createHandler(callback)
      } else {
        createHandler()(ev)
        return undefined
      }
    },
    [createHandler]
  )
}

export function authorized(
  children: React.ReactNode,
  fallback?: React.ReactNode
) {
  return createElement(function EnsureAuthorized() {
    const {
      isAuthorized,
      dialog: { show: showDialog },
    } = useAuth()

    useEffect(() => {
      if (!isAuthorized) showDialog()
    }, [isAuthorized, showDialog])

    return !isAuthorized && isValidElement(fallback) ? fallback : children
  })
}

export function AuthProvider(
  props: React.PropsWithChildren<{
    fallback?: React.ReactNode
  }>
) {
  const logger = useLogger()
  const config = useFetcherConfig()
  const authAPI = useMemo(() => new AuthAPI(logger, config), [config, logger])
  const [state, setState] = useState(useAuth())
  const { isInitialized, refreshInterval } = state
  const isMounted = useIsMounted()

  const refresh = useCallback(
    async (authAPI: AuthAPI, signal: AbortSignal | null) => {
      try {
        const [user, { access_token, expires_in }] = await Promise.all([
          authAPI.fetchUser(signal),
          authAPI.fetchAccessToken(signal),
        ])
        isMounted() &&
          setState((state) => ({
            ...state,
            isAuthorized: true,
            user,
            accessToken: access_token,
            refreshInterval: expires_in,
          }))
      } catch {
        isMounted() &&
          setState((state) => ({
            ...state,
            isAuthorized: false,
            user: undefined,
            accessToken: undefined,
            refreshInterval: undefined,
          }))
      }
    },
    [isMounted]
  )

  const isLoadingRef = useRef(false)
  useEffect(() => {
    if (isLoadingRef.current) return
    isLoadingRef.current = true
    refresh(authAPI, null)
      .catch((error) => {
        // TODO: handle error
      })
      .finally(() => {
        if (!isMounted()) return
        setState((state) => ({ ...state, isInitialized: true }))
      })
  }, [authAPI, isMounted, refresh])

  useEffect(() => {
    if (!refreshInterval) return
    const controller = new AbortController()
    const timer = window.setInterval(() => {
      authAPI
        .fetchAccessToken(controller.signal)
        .then(({ access_token, expires_in }) => {
          setState((state) => ({
            ...state,
            accessToken: access_token,
            refreshInterval: expires_in,
          }))
        })
        .catch(() => {
          setState((state) => ({
            ...state,
            accessToken: undefined,
            refreshInterval: undefined,
          }))
        })
    }, refreshInterval * 1000)
    return () => {
      window.clearInterval(timer)
      controller.abort()
    }
  }, [authAPI, refreshInterval])

  const authorizingControllerRef = useRef<AbortController>()
  useEffect(() => () => authorizingControllerRef.current?.abort(), [])
  useEffect(() => {
    if (!state.dialog.open) authorizingControllerRef.current?.abort()
  }, [state.dialog.open])

  useEffect(() => {
    const subscriptionList = new Set<Subscription>()
    const authorize = (provider: IdentityProvider, display_name: string) => {
      const controller = new AbortController()
      authorizingControllerRef.current?.abort()
      authorizingControllerRef.current = controller
      setState((state) => ({
        ...state,
        authorizingProvider: provider,
        error: '',
      }))
      const subscription = authAPI
        .authorize(provider, display_name, controller.signal)
        .pipe(
          concatMap(() => refresh(authAPI, controller.signal)),
          tap(() => {
            setState((state) => ({
              ...state,
              dialog: { ...state.dialog, open: false },
              authorizingProvider: undefined,
            }))
          }),
          catchError((error) => {
            setState((state) => ({
              ...state,
              authorizingProvider: undefined,
              error: String(error),
            }))
            // TODO: handle error
            return EMPTY
          }),
          finalize(() => {
            controller.abort()
            if (authorizingControllerRef.current === controller) {
              authorizingControllerRef.current = undefined
            }
            subscriptionList.delete(subscription)
          })
        )
        .subscribe()
      subscriptionList.add(subscription)
    }
    const callback = authAPI.callback.bind(authAPI)
    const logout = () => {
      const subscription = from(authAPI.logout())
        .pipe(
          concatMap(() => {
            return new Observable<void>((observer) => {
              const controller = new AbortController()
              from(refresh(authAPI, controller.signal)).subscribe(observer)
              return () => controller.abort()
            })
          }),
          catchError((error) => {
            // TODO: handle error
            return EMPTY
          }),
          finalize(() => {
            subscriptionList.delete(subscription)
          })
        )
        .subscribe()
      subscriptionList.add(subscription)
    }
    setState((state) => ({ ...state, authorize, callback, logout }))
    return () => {
      subscriptionList.forEach((subscription) => subscription.unsubscribe())
      subscriptionList.clear()
    }
  }, [authAPI, refresh])

  useEffect(() => {
    const showDialog = () => {
      setState((state) => ({
        ...state,
        dialog: { ...state.dialog, open: true },
      }))
    }
    const closeDialog = () => {
      setState((state) => ({
        ...state,
        dialog: { ...state.dialog, open: false },
      }))
    }
    const toggleDialog = () => {
      setState((state) => ({
        ...state,
        dialog: { ...state.dialog, open: !state.dialog.open },
      }))
    }
    setState((state) => ({
      ...state,
      dialog: {
        ...state.dialog,
        show: showDialog,
        close: closeDialog,
        toggle: toggleDialog,
      },
    }))
  }, [])

  return createElement(
    Context.Provider,
    { value: state },
    isInitialized ? props.children : props.fallback
  )
}
