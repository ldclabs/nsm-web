import { css, useTheme } from '@emotion/react'
import { RequestError, toMessage } from '@ldclabs/store'
import { useMemo, type HTMLAttributes } from 'react'
import { useIntl } from 'react-intl'

export default function ErrorPlaceholder({
  error,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  error: unknown
}) {
  const intl = useIntl()
  const theme = useTheme()

  const [status, , message] = useMemo(() => {
    return error instanceof RequestError
      ? [error.status, error.name, error.message]
      : [undefined, undefined, toMessage(error)]
  }, [error])

  const [title, description] = useMemo(() => {
    switch (status) {
      case 403:
        return [
          intl.formatMessage({
            defaultMessage: 'Forbidden',
          }),
          undefined,
        ]
      case 404:
        return [intl.formatMessage({ defaultMessage: 'Not found' }), undefined]
      default:
        return [intl.formatMessage({ defaultMessage: 'Bad request' }), message]
    }
  }, [intl, message, status])

  return (
    <div
      {...props}
      css={css`
        display: flex;
        flex-direction: column;
        text-align: center;
        margin: 16px;
        border-radius: 8px;
        background-color: ${theme.effect.whiteMask};
      `}
    >
      <div
        css={css`
          margin-top: 16px;
          color: ${theme.palette.orange};
          ${theme.typography.bodyBold}
        `}
      >
        {title}
      </div>
      {description && (
        <pre
          css={css`
            white-space: pre-wrap;
            word-break: break-all;
          `}
        >
          <code>{description}</code>
        </pre>
      )}
    </div>
  )
}
