import { SetHeaderProps } from '#/App'
import { BREAKPOINT } from '#/shared'
import { css } from '@emotion/react'
import { useToast } from '@ldclabs/component'
import { useResizeDetector } from 'react-resize-detector'

export default function Home() {
  const { renderToastContainer } = useToast()

  const { ref } = useResizeDetector<HTMLDivElement>()

  return (
    <>
      {renderToastContainer()}
      <SetHeaderProps>
        <div
          ref={ref}
          css={css`
            flex: 1;
            margin: 0 36px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 32px;
            @media (max-width: ${BREAKPOINT.small}px) {
              gap: 16px;
            }
          `}
        ></div>
      </SetHeaderProps>
      <div
        css={css`
          width: 100%;
          max-width: calc(820px + 24px * 2);
          margin: 60px auto 0;
          padding: 0 24px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          @media (max-width: ${BREAKPOINT.small}px) {
            margin: 24px auto 0;
          }
        `}
      >
        NS-Protocol
      </div>
    </>
  )
}
