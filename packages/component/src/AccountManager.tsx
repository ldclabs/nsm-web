import { css, useTheme } from '@emotion/react'
import { useAuth, type IdentityProvider } from '@ldclabs/store'
import { stopPropagation } from '@ldclabs/util'
import { memo, useCallback, useMemo } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { Icon, type IconName } from '.'
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogClose,
  AlertDialogHead,
} from './AlertDialog'
import { Avatar } from './Avatar'
import { Brand } from './Brand'
import { Button } from './Button'
import { Menu, type MenuProps } from './Menu'
import { Spinner } from './Spinner'

export const AccountManager = memo(function AccountManager({
  items: _items,
  ...props
}: MenuProps) {
  const intl = useIntl()
  const { user, dialog, authorize, authorizingProvider, logout } = useAuth()
  const items = useMemo(() => {
    return (_items || []).concat({
      label: intl.formatMessage({ defaultMessage: '退出登录' }),
      danger: true,
      onClick: logout,
    })
  }, [_items, intl, logout])

  return user ? (
    <Menu
      anchor={(props) => (
        <button {...props}>
          <Avatar src={user.picture} name={user.name} />
        </button>
      )}
      placement='bottom-end'
      items={items}
      {...props}
    />
  ) : (
    <AlertDialog
      open={dialog.open}
      onToggle={dialog.toggle}
      onPointerUpCapture={stopPropagation}
      anchor={(props) => (
        <Button color='primary' {...props}>
          {intl.formatMessage({ defaultMessage: '登录' })}
        </Button>
      )}
    >
      <AlertDialogHead>
        <FormattedMessage
          defaultMessage='登录到 {brand}'
          values={{ brand: <Brand /> }}
        />
      </AlertDialogHead>
      <AlertDialogBody
        css={css`
          display: flex;
          flex-direction: column;
          gap: 16px;
        `}
      >
        <ProviderItem
          provider={'wechat'}
          providerLogo={'wechat'}
          providerName={intl.formatMessage({ defaultMessage: '微信' })}
          isAuthorizing={authorizingProvider === 'wechat'}
          disabled={!!authorizingProvider}
          onAuthorize={authorize}
        />
        <ProviderItem
          provider={'github'}
          providerLogo={'github'}
          providerName={intl.formatMessage({ defaultMessage: 'GitHub' })}
          isAuthorizing={authorizingProvider === 'github'}
          disabled={!!authorizingProvider}
          onAuthorize={authorize}
        />
        <ProviderItem
          provider={'google'}
          providerLogo={'google'}
          providerName={intl.formatMessage({ defaultMessage: 'Google' })}
          isAuthorizing={authorizingProvider === 'google'}
          disabled={!!authorizingProvider}
          onAuthorize={authorize}
        />
      </AlertDialogBody>
      <AlertDialogClose />
    </AlertDialog>
  )
})

function ProviderItem({
  provider,
  providerLogo,
  providerName,
  isAuthorizing,
  disabled,
  onAuthorize,
}: {
  provider: IdentityProvider
  providerLogo: IconName
  providerName: string
  isAuthorizing: boolean
  disabled: boolean
  onAuthorize: (provider: IdentityProvider) => void
}) {
  const intl = useIntl()
  const theme = useTheme()
  const onClick = useCallback(
    () => onAuthorize(provider),
    [onAuthorize, provider]
  )

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      css={css`
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 12px;
        border: 1px solid ${theme.palette.grayLight0};
        background: ${theme.color.body.background};
        color: ${theme.color.body.default};
        cursor: pointer;
        :disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
      `}
    >
      <div
        css={css`
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        `}
      >
        {isAuthorizing ? (
          <Spinner size={16} />
        ) : (
          <Icon name={providerLogo} size={16} />
        )}
      </div>
      <span>
        {intl.formatMessage(
          { defaultMessage: '使用 {provider} 登录' },
          { provider: providerName }
        )}
      </span>
    </button>
  )
}
