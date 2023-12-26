import { SetHeaderProps } from '#/App'
import { css } from '@emotion/react'
import { useToast } from '@ldclabs/component'

export default function Name() {
  const { renderToastContainer } = useToast()

  return (
    <>
      {renderToastContainer()}
      <SetHeaderProps>
        <div
          css={css`
            flex: 1;
            margin: 0 36px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 16px;
          `}
        >
          Names
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
        `}
      >
        Names
      </div>
    </>
  )
}
