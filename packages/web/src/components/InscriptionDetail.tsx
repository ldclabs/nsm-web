import { css, useTheme } from '@emotion/react'
import { textEllipsis } from '@ldclabs/component'
import { BytesToHex, diagName, type Inscription } from '@ldclabs/store'
import { useIntl } from 'react-intl'
import { Link } from 'react-router-dom'

export default function InscriptionDetail({
  inscription,
  ...props
}: { inscription: Inscription } & React.HTMLAttributes<HTMLElement>) {
  const intl = useIntl()
  const theme = useTheme()
  const tx = BytesToHex(Uint8Array.from(inscription.txid).reverse())
  const block = BytesToHex(Uint8Array.from(inscription.block_hash).reverse())
  return (
    <fieldset
      css={css`
        display: flex;
        flex-direction: column;
        width: 100%;
        flex: 1;
        gap: 8px;
        min-width: 0; // for flexbox to work
        min-height: 0; // for flexbox to work
        border-radius: 8px;
        border: 2px solid ${theme.effect.primaryMask};

        > div {
          display: flex;
          flex-direction: column;
          gap: 0;
          min-width: 0; // for flexbox to work
          min-height: 0;
          ${theme.typography.tooltip}
        }

        label {
          display: block;
        }
        p {
          display: block;
          width: 100%;
          ${textEllipsis};
          color: ${theme.palette.primaryNormal};
        }
        textarea {
          width: calc(100% - 16px);
          min-height: 180px;
          resize: none;
          margin-top: 4px;
          padding: 4px 8px;
          text-wrap: nowrap;
          white-space: pre;
          color: ${theme.palette.grayLight1};
          background-color: ${theme.effect.primaryMask};
          border-radius: 4px;
          border: none;
        }
        a {
          text-decoration: underline;
          text-underline-offset: 4px;
        }
      `}
    >
      <legend
        css={css`
          ${theme.typography.h1}
          color: ${theme.palette.primaryNormal};
          padding-bottom: 8px;
        `}
      >
        <Link
          unstable_viewTransition={true}
          to={`/indexer/name?name=${inscription.name}`}
        >
          {inscription.name}
        </Link>
      </legend>
      <div>
        <label>{intl.formatMessage({ defaultMessage: 'Name sequence' })}</label>
        <p>{inscription.sequence}</p>
      </div>
      <div>
        <label>
          {intl.formatMessage({ defaultMessage: 'Inscription height' })}
        </label>
        <p>{inscription.height}</p>
      </div>
      <div>
        <label>
          {intl.formatMessage({ defaultMessage: 'Inscribed block height' })}
        </label>
        <p>{inscription.block_height}</p>
      </div>
      <div>
        <label>
          {intl.formatMessage({ defaultMessage: 'Inscribed block hash' })}
        </label>
        <p>
          <a
            target='_blank'
            href={'https://mempool.space/block/' + block}
            rel='noreferrer'
          >
            {block}
          </a>
        </p>
      </div>
      <div>
        <label>
          {intl.formatMessage({ defaultMessage: 'Inscribed txid' })}
        </label>
        <p>
          <a
            target='_blank'
            href={'https://mempool.space/tx/' + tx}
            rel='noreferrer'
          >
            {tx}
          </a>
        </p>
      </div>
      <div>
        <label>
          {intl.formatMessage({
            defaultMessage: 'Previous inscription hash',
          })}
        </label>
        <p>{BytesToHex(inscription.previous_hash)}</p>
      </div>
      <div>
        <label>
          {intl.formatMessage({ defaultMessage: 'Name state hash' })}
        </label>
        <p>{BytesToHex(inscription.name_hash)}</p>
      </div>
      <div>
        <label>
          {intl.formatMessage({ defaultMessage: 'Service state hash' })}
        </label>
        <p>{BytesToHex(inscription.service_hash)}</p>
      </div>
      <div>
        <label>
          {intl.formatMessage({ defaultMessage: 'Name diagnostic' })}
        </label>
        <textarea readOnly={true} className='scroll-x scroll-y'>
          {diagName(inscription.data)}
        </textarea>
      </div>
    </fieldset>
  )
}
