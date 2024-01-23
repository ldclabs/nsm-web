import { css, useTheme } from '@emotion/react'
import {
  passKeyIsAvailable,
  passKeyIsExist,
  useAuth,
  type IdentityProvider,
} from '@nsm-web/store'
import { stopPropagation } from '@nsm-web/util'
import { memo, useCallback, useEffect, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { Icon, type IconName } from '.'
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogClose,
  AlertDialogHead,
} from './AlertDialog'
import { Button } from './Button'
import { type MenuProps } from './Menu'
import { Spinner } from './Spinner'
import { TextField } from './TextField'

export const AccountManager = memo(function AccountManager({
  ...props
}: MenuProps) {
  const intl = useIntl()
  const theme = useTheme()
  const { error, user, dialog, authorize, authorizingProvider } = useAuth()

  return user ? (
    props.children
  ) : (
    <AlertDialog
      open={dialog.open}
      onToggle={dialog.toggle}
      onPointerUpCapture={stopPropagation}
      anchor={(props) => (
        <Button color='primary' {...props}>
          {intl.formatMessage({ defaultMessage: 'Sign In' })}
        </Button>
      )}
      css={css`
        margin: 100px auto 50px;
        max-width: 400px;
        top: 200px;
        transform: unset;
      `}
    >
      <AlertDialogHead>
        <FormattedMessage defaultMessage='Sign In' />
      </AlertDialogHead>
      <AlertDialogBody
        css={css`
          display: flex;
          flex-direction: column;
          gap: 16px;
        `}
      >
        {error && (
          <p
            css={css`
              color: ${theme.palette.orange};
            `}
          >
            {error}
          </p>
        )}
        <ProviderItem
          provider={'Passkey'}
          providerLogo={'passkey'}
          providerName={intl.formatMessage({ defaultMessage: 'Passkey' })}
          isAuthorizing={authorizingProvider === 'Passkey'}
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
  onAuthorize: (provider: IdentityProvider, display_name: string) => void
}) {
  const intl = useIntl()
  const theme = useTheme()

  const [name, setName] = useState('')
  const handleDisplayNameChange = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      setName(ev.currentTarget.value.trim())
    },
    []
  )

  const onClick = useCallback(() => {
    onAuthorize(provider, '')
  }, [onAuthorize, provider])

  const handleRegisterPasskey = useCallback(
    () => onAuthorize(provider, name || 'NS'),
    [onAuthorize, provider, name]
  )

  const passKeyAvailable = passKeyIsAvailable()
  const [passKeyExist, setPassKeyExist] = useState(false)
  useEffect(() => {
    passKeyIsExist().then(setPassKeyExist)
  }, [setPassKeyExist])

  return (
    <>
      {provider == 'Passkey' && !passKeyExist && (
        <>
          {passKeyAvailable ? (
            <TextField
              size='medium'
              placeholder={intl.formatMessage({
                defaultMessage: 'Display name',
              })}
              inputtype='text'
              onChange={handleDisplayNameChange}
              css={css`
                flex: 1;
                background: ${theme.effect.whiteMask};
                input {
                  height: 42px;
                }
              `}
            />
          ) : (
            <p
              css={css`
                color: ${theme.palette.orange};
              `}
            >
              {intl.formatMessage({
                defaultMessage: 'Passkey is not available',
              })}
            </p>
          )}
          <button
            onClick={handleRegisterPasskey}
            disabled={!passKeyAvailable || disabled || name == ''}
            css={css`
              height: 42px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              margin-bottom: 16px;
              border-radius: 12px;
              border: 1px solid ${theme.palette.grayLight0};
              background: ${theme.effect.goldMask};
              color: ${theme.palette.grayLight1};
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
              {intl.formatMessage({ defaultMessage: 'Register a Passkey' })}
            </span>
          </button>
        </>
      )}
      <button
        onClick={onClick}
        disabled={!passKeyAvailable || disabled}
        css={css`
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 12px;
          border: 1px solid ${theme.palette.grayLight0};
          background: ${theme.effect.primaryMask};
          color: ${theme.palette.grayLight1};
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
            { defaultMessage: 'Sign in with {provider}' },
            { provider: providerName }
          )}
        </span>
      </button>
    </>
  )
}
