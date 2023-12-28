import { BREAKPOINT } from '#/shared'
import { css, useTheme } from '@emotion/react'
import { useIntl } from 'react-intl'
import { useSearchParams } from 'react-router-dom'

export default function LoginStatePage() {
  const intl = useIntl()
  const theme = useTheme()
  const [params] = useSearchParams()
  const status = Number(params.get('status'))

  return (
    <div
      css={css`
        padding: 80px;
        text-align: center;
        @media (max-width: ${BREAKPOINT.small}px) {
          padding-left: 40px;
          padding-right: 40px;
        }
      `}
    >
      <div
        css={css`
          margin-top: 8px;
          color: ${theme.color.body.secondary};
        `}
      >
        {status === 200
          ? intl.formatMessage({
              defaultMessage: 'Logged in successfully, please close this page',
            })
          : intl.formatMessage({
              defaultMessage: 'Please try again later',
            })}
      </div>
    </div>
  )
}
