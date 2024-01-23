import { SetHeaderProps } from '#/App'
import UserInfo from '#/components/UserInfo'
import { css, useTheme } from '@emotion/react'
import { Clickable, useToast } from '@nsm-web/component'
import { useAuth } from '@nsm-web/store'
import { useCallback, useState } from 'react'
import { useIntl } from 'react-intl'

export default function AccountPage() {
  const intl = useIntl()
  const theme = useTheme()
  const { renderToastContainer } = useToast()
  const { user } = useAuth()
  const [openUserInfo, setOpenUserInfo] = useState(false)
  const handleUserClick = useCallback(() => {
    setOpenUserInfo((v) => !v)
  }, [setOpenUserInfo])

  return (
    user && (
      <>
        {renderToastContainer()}
        <SetHeaderProps>
          <div
            css={css`
              flex: 1;
              margin: 0 12px;
              display: flex;
              align-items: center;
              justify-content: flex-start;
              gap: 16px;
            `}
          >
            <Clickable onClick={handleUserClick}>{user.name}</Clickable>
          </div>
        </SetHeaderProps>
        <div
          css={css`
            margin: 16px 0;
            padding: 16px 24px;
            display: flex;
            flex-direction: column;
            flex-wrap: wrap;
            align-items: center;
            justify-content: center;
            gap: 24px 36px;
            border-radius: 30px;
            color: ${theme.palette.grayLight1};
          `}
        >
          <p>
            {intl.formatMessage({
              defaultMessage: 'Online inscribing will be coming soon.',
            })}
          </p>
          <p>
            {intl.formatMessage({
              defaultMessage:
                'You can also build it with the source code on Github:',
            })}
          </p>
          <p>
            <a
              href='https://github.com/ldclabs/ns-rs/tree/main/crates/ns-inscriber'
              target='_blank'
              rel='noreferrer'
            >
              https://github.com/ldclabs/ns-rs/tree/main/crates/ns-inscriber
            </a>
          </p>
        </div>
        {openUserInfo && (
          <UserInfo open={openUserInfo} onClose={handleUserClick} />
        )}
      </>
    )
  )
}
