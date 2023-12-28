import { css, useTheme } from '@emotion/react'
import { textEllipsis } from '@ldclabs/component'
import {
  BytesToHex,
  diagServices,
  type NameState,
  type ServiceState,
} from '@ldclabs/store'
import { useIntl } from 'react-intl'
import { Link } from 'react-router-dom'

export default function NameDetail({
  nameState,
  servicesState,
  ...props
}: {
  nameState: NameState
  servicesState: ServiceState[]
} & React.HTMLAttributes<HTMLElement>) {
  const intl = useIntl()
  const theme = useTheme()
  return (
    <fieldset
      css={css`
        display: flex;
        flex-direction: column;
        width: 100%;
        height: fit-content;
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
          min-height: 100px;
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
          ${theme.typography.h2}
          color: ${theme.palette.primaryNormal};
        `}
      >
        <Link
          to={`/indexer/inscription?name=${nameState.name}&sequence=${nameState.sequence}`}
        >
          {nameState.name}
        </Link>
      </legend>
      <div>
        <label>
          {intl.formatMessage({ defaultMessage: 'Name sequence:' })}
        </label>
        <p>{nameState.sequence}</p>
      </div>
      <div>
        <label>
          {intl.formatMessage({ defaultMessage: 'Inscribed block height:' })}
        </label>
        <p>{nameState.block_height}</p>
      </div>
      <div>
        <label>
          {intl.formatMessage({ defaultMessage: 'Inscribed block time:' })}
        </label>
        <p>{new Date(nameState.block_time * 1000).toLocaleString()}</p>
      </div>
      <div>
        <label>
          {intl.formatMessage({ defaultMessage: 'Name stale time:' })}
        </label>
        <p>{new Date(nameState.stale_time * 1000).toLocaleString()}</p>
      </div>
      <div>
        <label>
          {intl.formatMessage({ defaultMessage: 'Name expire time:' })}
        </label>
        <p>{new Date(nameState.expire_time * 1000).toLocaleString()}</p>
      </div>
      <div>
        <label>
          {intl.formatMessage({
            defaultMessage: 'Public keys:',
          })}
        </label>
        {nameState.public_keys.map((key, i) => (
          <p key={i}>{'0x' + BytesToHex(key)}</p>
        ))}
      </div>
      <div>
        <label>
          {intl.formatMessage({ defaultMessage: 'Signature threshold:' })}
        </label>
        <p>{nameState.threshold}</p>
      </div>
      {nameState.next_public_keys && (
        <div>
          <label>
            {intl.formatMessage({
              defaultMessage: 'Next Public keys:',
            })}
          </label>
          {nameState.next_public_keys.map((key, i) => (
            <p key={i}>{'0x' + BytesToHex(key)}</p>
          ))}
        </div>
      )}
      {servicesState.length > 0 && (
        <div>
          <label>
            {intl.formatMessage({ defaultMessage: 'Services diagnostic:' })}
          </label>
          <textarea readOnly={true} className='scroll-x scroll-y'>
            {diagServices(servicesState)}
          </textarea>
        </div>
      )}
    </fieldset>
  )
}
