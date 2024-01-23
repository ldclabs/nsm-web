import { css } from '@emotion/react'
import { Button } from '@nsm-web/component'
import { useAuth } from '@nsm-web/store'
import { useIntl } from 'react-intl'
import { Link } from 'react-router-dom'

export default function AuthorizedFallback({
  description,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  description?: string
}) {
  const intl = useIntl()
  const {
    dialog: { show: showAuthDialog },
  } = useAuth()

  return (
    <div
      {...props}
      css={css`
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
      `}
    >
      <span
        css={(theme) => css`
          ${theme.typography.h2}
          color: ${theme.color.body.primary};
        `}
      >
        {description ||
          intl.formatMessage({
            defaultMessage: 'Please sign in and try again',
          })}
      </span>
      <div
        css={css`
          display: flex;
          align-items: center;
          gap: 16px;
        `}
      >
        <Button
          color='primary'
          variant='outlined'
          size='large'
          onClick={showAuthDialog}
        >
          {intl.formatMessage({ defaultMessage: 'Sign in' })}
        </Button>
        <Link
          unstable_viewTransition={true}
          to='/'
          css={css`
            display: flex;
          `}
        >
          <Button color='secondary' variant='outlined' size='large'>
            {intl.formatMessage({ defaultMessage: 'Back to home page' })}
          </Button>
        </Link>
      </div>
    </div>
  )
}
