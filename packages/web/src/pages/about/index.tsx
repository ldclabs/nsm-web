import { SetHeaderProps } from '#/App'
import { css, useTheme } from '@emotion/react'
import { Brand, Footer } from '@ldclabs/component'
import { useIntl } from 'react-intl'

export default function AboutPage() {
  const intl = useIntl()
  const theme = useTheme()
  return (
    <>
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
          About
        </div>
      </SetHeaderProps>
      <div
        css={css`
          margin: 16px 0;
          padding: 16px;
          display: flex;
          flex-direction: column;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: ${theme.palette.grayLight1};
        `}
      >
        <Brand size='large' />
        <p>
          {intl.formatMessage({
            defaultMessage:
              'NS.Top (https://www.ns.top) is a implementation of NS-Protocol.',
          })}
        </p>
        <Footer />
      </div>
      <div
        css={css`
          margin: 16px 0;
          padding: 16px;
          display: flex;
          flex-direction: column;
          flex-wrap: wrap;
          align-content: center;
          align-items: flex-start;
          justify-content: center;
          gap: 16px;
          color: ${theme.palette.grayLight1};
        `}
      >
        <p>
          <label>NS-Protocol: </label>
          <a
            href='https://github.com/ldclabs/ns-protocol'
            target='_blank'
            rel='noreferrer'
          >
            github.com/ldclabs/ns-protocol
          </a>
        </p>
        <p>
          <label>NS-Indexer: </label>
          <a
            href='https://github.com/ldclabs/ns-rs/tree/main/crates/ns-indexer'
            target='_blank'
            rel='noreferrer'
          >
            ldclabs/ns-rs/crates/ns-indexer
          </a>
        </p>
        <p>
          <label>NS-Inscriber: </label>
          <a
            href='https://github.com/ldclabs/ns-rs/tree/main/crates/ns-inscriber'
            target='_blank'
            rel='noreferrer'
          >
            ldclabs/ns-rs/crates/ns-inscriber
          </a>
        </p>
        <p>
          <label>Twitter: </label>
          <a
            href='https://twitter.com/ldc_labs'
            target='_blank'
            rel='noreferrer'
          >
            twitter.com/ldc_labs
          </a>
        </p>
      </div>
    </>
  )
}
