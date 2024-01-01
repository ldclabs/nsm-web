import { css, useTheme } from '@emotion/react'
import { Button } from '@ldclabs/component'
import { useCallback } from 'react'
import { useIntl } from 'react-intl'
import { useRegisterSW } from 'virtual:pwa-register/react'

export default function ReloadPrompt() {
  const intl = useIntl()
  const theme = useTheme()
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // eslint-disable-next-line prefer-template
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  const handleReload = useCallback(() => {
    updateServiceWorker(true)
  }, [updateServiceWorker])
  const handleClose = useCallback(() => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }, [setOfflineReady, setNeedRefresh])

  return (
    (offlineReady || needRefresh) && (
      <div
        css={css`
          position: fixed;
          bottom: 60px;
          width: calc(100% - 64px);
          margin: 16px;
          padding: 16px;
          border-radius: 8px;
          z-index: 1;
          background-color: ${theme.palette.grayLight1};
        `}
      >
        <div
          css={css`
            margin-bottom: 8px;
            text-align: center;
          `}
        >
          {offlineReady ? (
            <span>
              {intl.formatMessage({
                defaultMessage: 'App ready to work offline',
              })}
            </span>
          ) : (
            <span>
              {intl.formatMessage({
                defaultMessage:
                  'New content available, click on reload button to update',
              })}
            </span>
          )}
        </div>
        <div
          css={css`
            display: flex;
            gap: 16px;
            flex-direction: row;
            justify-content: center;
          `}
        >
          {needRefresh && (
            <Button color='primary' size='large' onClick={handleReload}>
              Reload
            </Button>
          )}
          <Button color='secondary' size='large' onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    )
  )
}
