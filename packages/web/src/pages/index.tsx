import { LayoutDivRefContext, SetHeaderProps } from '#/App'
import { css, keyframes, useTheme } from '@emotion/react'
import {
  Brand,
  Icon,
  TextField,
  textEllipsis,
  useToast,
} from '@ldclabs/component'
import {
  BytesToHex,
  useBestInscriptions,
  useInscriptions,
  useLastAcceptedInscription,
  type Inscription,
} from '@ldclabs/store'
import { useScrollOnBottom } from '@ldclabs/util'
import { useCallback, useContext, useState } from 'react'
import { useIntl } from 'react-intl'

export default function Home() {
  const intl = useIntl()
  const theme = useTheme()
  const { renderToastContainer } = useToast()

  const { item: lastAcceptedInscription } = useLastAcceptedInscription()
  const { items, isValidating, hasMore, loadMore } = useInscriptions(
    lastAcceptedInscription?.height || 0
  )
  const { items: bestInscriptions } = useBestInscriptions()

  const [collapseComing, setCollapseComing] = useState(true)
  const handleCollapseComing = useCallback(() => {
    setCollapseComing((v) => !v)
  }, [])

  const layoutDivRef = useContext(
    LayoutDivRefContext
  ) as React.RefObject<HTMLDivElement>
  const shouldLoadMore = hasMore && !isValidating && loadMore
  const handleScroll = useCallback(() => {
    shouldLoadMore && shouldLoadMore()
  }, [shouldLoadMore])
  useScrollOnBottom({
    ref: layoutDivRef,
    autoTriggerBottomCount: 10,
    onBottom: handleScroll,
  })

  const breath = keyframes`
  from, to {
    color: ${theme.palette.grayLight1};
  }

  50% {
    color: ${theme.palette.gold};
  }
`

  return (
    <>
      {renderToastContainer()}
      <SetHeaderProps>
        <div
          css={css`
            flex: 1;
            margin: 0 12px;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 16px;
          `}
        >
          Inscriptions
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
        <Brand size='large' />
        <TextField
          size='large'
          before={<Icon name='search' />}
          placeholder={intl.formatMessage({
            defaultMessage: 'Search names',
          })}
          inputtype='search'
          onEnter={() => {}}
          css={css`
            flex: 1;
            height: 48px;
            padding: 0 20px;
            border-radius: 20px;
            ${theme.typography.h2}
            color: ${theme.palette.grayLight1};
            background: ${theme.effect.blackMask};
            input {
              height: 42px;
            }
          `}
        />
      </div>
      {bestInscriptions.length > 0 && (
        <div
          css={css`
            width: 100%;
            margin: 0 0 16px;
            padding: 0 16px ${collapseComing ? '0' : '16px'};
            box-sizing: border-box;
            background-color: ${theme.effect.blackMask};
            box-shadow: ${theme.effect.card};
          `}
        >
          <button
            title={intl.formatMessage({ defaultMessage: 'New inscriptions' })}
            onClick={handleCollapseComing}
            css={css`
              animation: ${breath} 3s ease-in-out infinite;
              background-color: transparent;
              :hover {
                background-color: transparent;
              }
            `}
          >
            {intl.formatMessage(
              {
                defaultMessage: '{n} inscriptions is coming',
              },
              { n: bestInscriptions.length }
            )}
          </button>
          <div
            css={css`
              width: 100%;
              display: flex;
              flex-direction: row;
              flex-wrap: wrap;
              gap: 8px;
              height: ${collapseComing ? '0' : 'auto'};
              opacity: ${collapseComing ? '0' : '1'};
              transition: height 0.8s ease, opacity 0.4s ease;
            `}
          >
            {bestInscriptions.map((inscription) => (
              <InscriptionShortItem
                key={inscription.height}
                inscription={inscription}
              />
            ))}
          </div>
        </div>
      )}
      <div
        css={css`
          width: 100%;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 16px;
        `}
      >
        {lastAcceptedInscription && (
          <InscriptionItem
            key={lastAcceptedInscription.height}
            isLastAccepted={true}
            inscription={lastAcceptedInscription}
          />
        )}
        {items.map((inscription) => (
          <InscriptionItem
            key={inscription.height}
            isLastAccepted={false}
            inscription={inscription}
          />
        ))}
      </div>
    </>
  )
}

function InscriptionItem({
  inscription,
  isLastAccepted,
}: {
  inscription: Inscription
  isLastAccepted: boolean
}) {
  const theme = useTheme()
  const tx = BytesToHex(Uint8Array.from(inscription.txid).reverse())
  return (
    <div
      css={css`
        margin: 0 16px;
        padding: 8px 16px;
        border-radius: 8px;
        color: ${theme.palette.grayLight0};
        background-color: ${isLastAccepted
          ? theme.effect.goldMask
          : theme.effect.primaryMask};
      `}
    >
      <div
        css={css`
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 8px;
          ${theme.typography.tooltip}
        `}
      >
        <a
          href='/'
          css={css`
            ${textEllipsis}
            ${theme.typography.h2}
            color: ${theme.palette.grayLight1};
            margin-right: 8px;
          `}
        >
          {inscription.name}
        </a>
        <span>Seq: {inscription.sequence}</span>
        <span>Height: {inscription.height}</span>
        <span>Block: {inscription.block_height}</span>
      </div>
      <div
        css={css`
          display: flex;
          flex-direction: row;
          gap: 8px;
          ${theme.typography.tooltip}
        `}
      >
        <a
          target='_blank'
          href={'https://mempool.space/tx/' + tx}
          css={css`
            display: inline-block;
            width: 100%;
            ${textEllipsis};
            color: ${theme.palette.grayLight1};
          `}
          rel='noreferrer'
        >
          Inscribed Tx: {tx}
        </a>
      </div>
    </div>
  )
}

function InscriptionShortItem({ inscription }: { inscription: Inscription }) {
  const theme = useTheme()
  const tx = BytesToHex(Uint8Array.from(inscription.txid).reverse())
  return (
    <a
      target='_blank'
      href={'https://mempool.space/tx/' + tx}
      css={css`
        display: inline-block;
        margin: 0;
        padding: 4px 8px;
        border-radius: 4px;
        color: ${theme.palette.primaryNormal};
        background-color: ${theme.effect.goldMask};
        ${textEllipsis};
        ${theme.typography.tooltip}
        color: ${theme.palette.grayLight1};
      `}
      rel='noreferrer'
    >
      {inscription.name} · {inscription.sequence}
    </a>
  )
}
