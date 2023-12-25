import { ThemeProvider, css, keyframes, useTheme } from '@emotion/react'
import {
  Button,
  DEFAULT_LOCALE,
  GlobalStyles,
  Header,
  lightTheme,
  type HeaderProps,
  type MenuProps,
} from '@ldclabs/component'
import {
  AuthProvider,
  FetcherConfigProvider,
  useAuth,
  type FetcherConfig,
} from '@ldclabs/store'
import {
  LoggerProvider,
  LoggingLevel,
  RGBA,
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
import Loading from './components/Loading'
import { useLogger } from './logger'
import Home from './pages'
import NotFound from './pages/404'
import LoginStatePage from './pages/login/state'
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
      <h1>{intl.formatMessage({ defaultMessage: '出错了，请稍后再试' })}</h1>
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
        {intl.formatMessage({ defaultMessage: '刷新' })}
      </Button>
    </div>
  )
}

export const LayoutDivRefContext =
  createContext<React.RefObject<HTMLDivElement> | null>(null)

function Layout() {
  const logger = useLogger()
  const intl = useIntl()
  const { dialog } = useAuth()
  const navigate = useNavigate()

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

  const userMenu = useMemo<MenuProps>(
    () => ({
      items: [
        {
          label: intl.formatMessage({ defaultMessage: 'My Wallet' }),
          style: { display: 'none' },
        },
        {
          label: intl.formatMessage({ defaultMessage: 'My Names' }),
          onClick: () => navigate(WALLET_PATH),
        },
      ],
    }),
    [intl, navigate]
  )
  //#endregion

  return (
    <SetHeaderPropsContext.Provider value={setHeaderProps}>
      <main
        css={css`
          height: calc(100vh - 200px);
          max-height: 1080px;
          width: 480px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          margin: 100px auto 0;
          border: 20px solid ${RGBA('ffffff', 0.618)};
          border-radius: 10px;
          @media (max-width: ${BREAKPOINT.small}px) {
            border: 0;
            width: 100%;
            height: 100vh;
            margin: 0;
          }
        `}
      >
        <Header
          userMenu={userMenu}
          {...headerProps}
          css={css`
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
          css={css`
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
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

export const WALLET_PATH = '/wallet'
export const INDEXER_NAME_PATH = '/indexer/:name'
export const INDEXER_DEFAULT_PATH = '/indexer'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      <Route path='*' element={<NotFound />} />
      <Route path='/' element={<Home />} />
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