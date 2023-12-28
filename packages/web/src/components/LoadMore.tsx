import { css, useTheme } from '@emotion/react'
import { Button, Spinner } from '@ldclabs/component'
import { useIntl } from 'react-intl'

interface LoadMoreProps extends React.HTMLAttributes<HTMLDivElement> {
  hasMore: boolean
  isLoadingMore: boolean
  onLoadMore: React.MouseEventHandler<HTMLButtonElement>
}

export function LoadMore({
  hasMore,
  isLoadingMore,
  onLoadMore,
  ...props
}: LoadMoreProps) {
  const intl = useIntl()
  const theme = useTheme()

  const content = isLoadingMore ? (
    <Spinner />
  ) : hasMore ? (
    <Button
      color='primary'
      variant='outlined'
      onClick={onLoadMore}
      css={css`
        border: none;
        color: ${theme.palette.grayLight1};
        box-shadow: ${theme.effect.card};
        border-color: ${theme.effect.whiteMask};
        background-color: transparent;
        :hover {
          color: ${theme.palette.grayLight1};
          box-shadow: ${theme.effect.cardHover};
          background-color: transparent;
        }
      `}
    >
      {intl.formatMessage({ defaultMessage: 'Load more' })}
    </Button>
  ) : null

  return content ? (
    <div
      {...props}
      css={css`
        height: 80px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-color: ${theme.effect.whiteMask};
        background-color: transparent;
      `}
    >
      {content}
    </div>
  ) : null
}
