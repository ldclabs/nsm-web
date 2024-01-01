import { Global, ThemeProvider, css, keyframes, useTheme } from '@emotion/react'
import {
  Button,
  DEFAULT_LOCALE,
  GlobalStyles,
  Header,
  lightTheme,
  type HeaderProps,
} from '@ldclabs/component'
import {
  AuthProvider,
  FetcherConfigProvider,
  authorized,
  useAuth,
  type FetcherConfig,
} from '@ldclabs/store'
import {
  LoggerProvider,
  LoggingLevel,
  resolveURL,
  useIsMounted,
  useLayoutEffect,
  type LoggingHandler,
} from '@ldclabs/util'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  ErrorBoundary,
  type ErrorBoundaryProps,
  type FallbackProps,
} from 'react-error-boundary'
import {
  IntlProvider,
  MissingTranslationError,
  useIntl,
  type IntlConfig,
  type ResolvedIntlConfig,
} from 'react-intl'
import {
  Outlet,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { SWRConfig, type SWRConfiguration } from 'swr'
import { Navigation } from './Navigation'
import ReloadPrompt from './ReloadPrompt'
import AuthorizedFallback from './components/AuthorizedFallback'
import Loading from './components/Loading'
import { useLogger } from './logger'
import AboutPage from './pages/about'
import AccountPage from './pages/account'
import Home from './pages/indexer'
import InscriptionPage from './pages/indexer/inscription'
import NameStatePage from './pages/indexer/name'
import LoginStatePage from './pages/login/state'
import Market from './pages/market'
import { BREAKPOINT } from './shared'

function Fallback({
  onRefresh,
  ...props
}: FallbackProps & {
  onRefresh: () => void
}) {
  const intl = useIntl()
  const theme = useTheme()

  // TODO: show a better fallback UI
  // TODO: add a button to refresh the page
  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 80px;
        @media (max-width: ${BREAKPOINT.small}px) {
          padding-left: 40px;
          padding-right: 40px;
        }
      `}
    >
      <h1>
        {intl.formatMessage({
          defaultMessage: 'There was an error. Please try again later',
        })}
      </h1>
      <pre
        css={css`
          margin: 40px 0;
          ${theme.typography.tooltip}
          color: ${theme.color.body.secondary};
          white-space: pre-wrap;
          word-break: break-all;
        `}
      >
        <code>{props.error.message}</code>
      </pre>
      <Button color='secondary' onClick={onRefresh}>
        {intl.formatMessage({ defaultMessage: 'Refresh' })}
      </Button>
    </div>
  )
}

export const LayoutDivRefContext =
  createContext<React.RefObject<HTMLDivElement> | null>(null)

function Layout() {
  const logger = useLogger()
  const theme = useTheme()
  const { dialog } = useAuth()

  const layoutDivRef = useRef<HTMLDivElement>(null)

  //#region close auth dialog on location change
  const location = useLocation()
  const closeAuthDialog = dialog.close
  useLayoutEffect(() => closeAuthDialog(), [closeAuthDialog, location])
  //#endregion

  //#region error boundary
  const [key, setKey] = useState(0)

  const renderFallback = useCallback(
    (props: FallbackProps) => (
      <Fallback {...props} onRefresh={() => setKey((key) => key + 1)} />
    ),
    []
  )

  const onError = useCallback<NonNullable<ErrorBoundaryProps['onError']>>(
    (error, { componentStack }) => {
      logger.fatal('component error', { error, stack: String(componentStack) })
    },
    [logger]
  )
  //#endregion

  //#region header
  const [headerProps, setHeaderProps] = useState<HeaderProps>({})
  //#endregion

  return (
    <SetHeaderPropsContext.Provider value={setHeaderProps}>
      <Global
        styles={css`
          .scroll-x {
            overflow-x: auto;
            scroll-behavior: smooth;
            @media (min-width: ${BREAKPOINT.small}px) {
              ::-webkit-scrollbar {
                background-color: ${theme.effect.blackMask};
                height: 8px;
              }
              ::-webkit-scrollbar-track {
                margin: 0 8px;
              }
              ::-webkit-scrollbar-thumb {
                border-radius: 4px;
                background-color: ${theme.effect.whiteMask};
              }
            }
          }
          .scroll-y {
            overflow-y: auto;
            scroll-behavior: smooth;
            @media (min-width: ${BREAKPOINT.small}px) {
              ::-webkit-scrollbar {
                background-color: ${theme.effect.blackMask};
                width: 8px;
              }
              ::-webkit-scrollbar-track {
                margin: 8px 0;
              }
              ::-webkit-scrollbar-thumb {
                border-radius: 4px;
                background-color: ${theme.effect.whiteMask};
              }
            }
          }
        `}
      />
      <main
        id='main'
        css={css`
          position: relative;
          height: calc(100vh - 150px);
          max-height: 1080px;
          max-width: 600px;
          width: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          margin: 100px auto 0;
          border: 2px solid ${theme.effect.whiteMask};
          border-radius: 16px;
          backdrop-filter: blur(2px);
          @media (max-width: ${BREAKPOINT.small}px) or (max-height: ${BREAKPOINT.small}px) {
            border: 0;
            height: 100vh;
            width: 100vw;
            max-width: 800px;
            margin: 0 auto;
            border-radius: 0;
          }
        `}
      >
        <Header
          {...headerProps}
          css={css`
            position: sticky;
            top: 0;
            animation: 0.5s ease-in-out ${keyframes`
                from {
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }`};
          `}
        />
        <div
          ref={layoutDivRef}
          className='scroll-y'
          css={css`
            flex: 1;
            display: flex;
            flex-direction: column;
          `}
        >
          <LayoutDivRefContext.Provider value={layoutDivRef}>
            <ErrorBoundary
              key={key}
              fallbackRender={renderFallback}
              onError={onError}
            >
              <Outlet />
            </ErrorBoundary>
          </LayoutDivRefContext.Provider>
        </div>
        <Navigation
          css={css`
            position: sticky;
            bottom: 0;
            animation: 0.5s ease-in-out ${keyframes`
                from {
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }`};
          `}
        />
        <ReloadPrompt />
      </main>
    </SetHeaderPropsContext.Provider>
  )
}

const SetHeaderPropsContext = createContext<(props: HeaderProps) => void>(
  () => undefined
)

export function SetHeaderProps(props: HeaderProps) {
  const setHeaderProps = useContext(SetHeaderPropsContext)
  useEffect(() => {
    setHeaderProps(props)
    return () => setHeaderProps({})
  }, [props, setHeaderProps])
  return null
}

export const ACCOUNT_PATH = '/account'
export const MARKET_PATH = '/market'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      <Route path='*' element={<RedirectHome />} />
      <Route path='/indexer' element={<Home />}>
        <Route path='inscription' element={<InscriptionPage />} />
        <Route path='name' element={<NameStatePage />} />
      </Route>
      <Route path={MARKET_PATH} element={<Market />} />
      <Route
        path={ACCOUNT_PATH}
        element={authorized(<AccountPage />, <AuthorizedFallback />)}
      />
      <Route path='/help/about' element={<AboutPage />} />
      <Route path='/login/state' element={<LoginStatePage />} />
    </Route>
  ),
  { basename: new URL(resolveURL(import.meta.env.VITE_PUBLIC_PATH)).pathname }
)

export default function App() {
  const { VITE_PUBLIC_PATH, VITE_API_URL, VITE_AUTH_URL, VITE_WALLET_URL } =
    import.meta.env

  const fetcherConfig = useMemo<FetcherConfig>(
    () => ({
      PUBLIC_PATH: resolveURL(VITE_PUBLIC_PATH),
      API_URL: resolveURL(VITE_API_URL),
      AUTH_URL: resolveURL(VITE_AUTH_URL),
      WALLET_URL: resolveURL(VITE_WALLET_URL),
    }),
    [VITE_API_URL, VITE_AUTH_URL, VITE_PUBLIC_PATH, VITE_WALLET_URL]
  )

  const loggingHandler = useMemo<LoggingHandler>(
    () => ({
      publish: (record) => {
        if (import.meta.env.DEV) {
          switch (record.level) {
            case LoggingLevel.DEBUG:
              // TODO: enable debug logging based on feature flag
              break
            case LoggingLevel.INFO:
              console.info(record) // eslint-disable-line no-console
              break
            case LoggingLevel.WARN:
              console.warn(record) // eslint-disable-line no-console
              break
            case LoggingLevel.ERROR:
            case LoggingLevel.FATAL:
              console.error(record) // eslint-disable-line no-console
              break
          }
        } else {
          // TODO: publish to telemetry service
        }
      },
      close: () => {
        // TODO: close telemetry service
      },
    }),
    []
  )

  const swrConfig = useMemo<SWRConfiguration>(
    () => ({
      revalidateIfStale: false,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }),
    []
  )

  return (
    <FetcherConfigProvider value={fetcherConfig}>
      <LoggerProvider handler={loggingHandler}>
        <SWRConfig value={swrConfig}>
          <UserLocaleProvider>
            <AuthProvider
              fallback={
                <UserThemeProvider>
                  <Loading
                    css={css`
                      position: absolute;
                      inset: 0;
                    `}
                  />
                </UserThemeProvider>
              }
            >
              <UserThemeProvider>
                <GlobalStyles />
                <RouterProvider router={router} />
                <LoggingUnhandledError />
              </UserThemeProvider>
            </AuthProvider>
          </UserLocaleProvider>
        </SWRConfig>
      </LoggerProvider>
    </FetcherConfigProvider>
  )
}

function UserLocaleProvider(props: React.PropsWithChildren) {
  const isMounted = useIsMounted()
  const [messages, setMessages] = useState(
    {} as NonNullable<IntlConfig['messages']>
  )

  const locale = useMemo<Intl.Locale>(
    () =>
      new Intl.Locale(
        document.documentElement.lang || window.navigator.language
      ),
    []
  )

  useEffect(() => {
    loadLanguages(locale.language)
      .then((msg) => {
        isMounted() && setMessages(msg)
      })
      .catch(() => {})
  }, [isMounted, locale.language, setMessages])

  const logger = useLogger()
  const onError = useCallback<ResolvedIntlConfig['onError']>(
    (error) => {
      if (import.meta.env.DEV) return
      if (error instanceof MissingTranslationError) {
        logger.warn('missing translation', {
          key: error.descriptor?.id,
          locale: locale.language,
          error,
        })
      } else {
        logger.error('failed to format', { locale: locale.language, error })
      }
    },
    [locale.language, logger]
  )

  return (
    <IntlProvider
      messages={messages}
      locale={locale.language}
      defaultLocale={DEFAULT_LOCALE}
      onError={onError}
    >
      {props.children}
    </IntlProvider>
  )
}

function UserThemeProvider(props: React.PropsWithChildren) {
  return <ThemeProvider theme={lightTheme}>{props.children}</ThemeProvider>
}

function LoggingUnhandledError() {
  const logger = useLogger()

  useLayoutEffect(() => {
    const onError = (ev: ErrorEvent) => {
      logger.error('uncaught error', {
        message: ev.message,
        error: ev.error,
        filename: ev.filename,
        lineno: ev.lineno,
        colno: ev.colno,
      })
    }
    const onUnhandledRejection = (ev: PromiseRejectionEvent) => {
      logger.error('unhandled rejection', { error: ev.reason })
    }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [logger])

  return null
}

async function loadLanguages(locale: string) {
  const res = await import(`../lang/${locale}.json`)
  return res.messages
}

function RedirectHome() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/indexer')
  }, [navigate])

  return null
}
