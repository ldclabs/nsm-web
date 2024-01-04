import { css, useTheme } from '@emotion/react'
import { Button, Icon, TextField } from '@ldclabs/component'
import { useAuth } from '@ldclabs/store'
import { useCallback, useState } from 'react'
import { useIntl } from 'react-intl'
import MediumDialog from './MediumDialog'

export default function UserInfo({
  open,
  onClose,
  ...props
}: { open: boolean; onClose: () => void } & React.HTMLAttributes<HTMLElement>) {
  const intl = useIntl()
  const theme = useTheme()
  const { user, updateName, logout } = useAuth()
  const [value, setValue] = useState('')

  const handleSave = useCallback(
    (ev: React.MouseEvent<HTMLButtonElement>) => {
      value && updateName(value)
      setValue('')
    },
    [value, setValue, updateName]
  )

  const handleLogout = useCallback(() => logout(), [logout])

  return (
    user && (
      <MediumDialog
        title={intl.formatMessage({ defaultMessage: 'User Info' })}
        open={open}
        onClose={onClose}
      >
        <div
          css={css`
            position: relative;
            display: flex;
            flex-direction: column;
            width: 100%;
            margin-top: 16px;
            gap: 12px;
            flex: 1;
          `}
        >
          <TextField
            size='large'
            placeholder={intl.formatMessage({
              defaultMessage: 'Display name',
            })}
            defaultValue={user.name}
            onChange={(e) => setValue(e.target.value.trim())}
            before={<Icon name='edit' size='small' />}
            after={() => (
              <Button
                type='button'
                size='medium'
                color={'primary'}
                variant='text'
                disabled={!value || value === user.name}
                onClick={handleSave}
                css={css`
                  color: ${theme.palette.green};
                  :disabled {
                    opacity: 0;
                  }
                `}
              >
                {intl.formatMessage({ defaultMessage: 'Save' })}
              </Button>
            )}
            css={css`
              background-color: ${theme.effect.whiteMask};
            `}
          />
          <Button
            type='button'
            size='medium'
            color={'secondary'}
            variant='contained'
            onClick={handleLogout}
            css={css`
              position: absolute;
              width: 240px;
              bottom: 16px;
              left: calc(50% - 120px);
              color: ${theme.palette.orange};
            `}
          >
            {intl.formatMessage({ defaultMessage: 'Logout' })}
            <Icon name='logout' size='small' />
          </Button>
        </div>
      </MediumDialog>
    )
  )
}
