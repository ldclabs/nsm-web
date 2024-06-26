import { css } from '@emotion/react'
import { Spinner } from '@nsm-web/component'

export default function Loading(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      css={css`
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      `}
    >
      <Spinner />
    </div>
  )
}
