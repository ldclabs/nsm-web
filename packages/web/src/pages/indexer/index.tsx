import { LayoutDivRefContext, SetHeaderProps } from '#/App'
import { LoadMore } from '#/components/LoadMore'
import { css, keyframes, useTheme } from '@emotion/react'
import {
  Brand,
  Clickable,
  Icon,
  Popover,
  TextField,
  textEllipsis,
  useToast,
} from '@nsm-web/component'
import {
  NameValidating,
  bytesToHex,
  useBestInscriptions,
  useInscriptions,
  useLastAcceptedInscription,
  useNamesByQuery,
  type Inscription,
} from '@nsm-web/store'
import { useScrollOnBottom } from '@nsm-web/util'
import {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
} from 'react'
import { useIntl } from 'react-intl'
import { Outlet, useNavigate } from 'react-router-dom'

export default function Home() {
  const intl = useIntl()
  const theme = useTheme()
  const { renderToastContainer } = useToast()
  const navigate = useNavigate()

  const [keyword, setKeyword] = useState('')
  const handleKeywordChange = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      setKeyword(ev.currentTarget.value.trim())
    },
    []
  )
  const queryContainerRef = useRef<HTMLDivElement>(null)

  const { items: names, validating } = useNamesByQuery(keyword)
  const { item: lastAcceptedInscription } = useLastAcceptedInscription()
  const { items, isValidating, hasMore, loadMore } = useInscriptions(
    lastAcceptedInscription?.height || 0
  )
  const { items: bestInscriptions } = useBestInscriptions()

  const [collapseComing, setCollapseComing] = useState(true)
  const handleCollapseComing = useCallback(() => {
    setCollapseComing((v) => !v)
  }, [])

  const handleInscriptionClick = useCallback(
    (inscription: Inscription) => {
      let url = `/indexer/inscription?height=${inscription.height}`
      if (inscription.__best) {
        url += `&best=true`
      }
      navigate(url)
    },
    [navigate]
  )

  const layoutDivRef = useContext(
    LayoutDivRefContext
  ) as React.RefObject<HTMLDivElement>
  const shouldLoadMore = hasMore && !isValidating && loadMore
  const handleScroll = useCallback(() => {
    shouldLoadMore && shouldLoadMore()
  }, [shouldLoadMore])
  useScrollOnBottom({
    ref: layoutDivRef,
    autoTriggerBottomCount: 1,
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
      <Outlet />
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
          flex-wrap: nowrap;
          align-items: center;
          justify-content: center;
          gap: 24px 0;
          border-radius: 30px;
        `}
      >
        <Brand size='large' />
        <Popover
          anchor={() => (
            <TextField
              size='medium'
              before={<Icon name='search' />}
              after={NameStatus({ status: validating })}
              placeholder={intl.formatMessage(
                {
                  defaultMessage: '{n} names inscribed',
                },
                { n: lastAcceptedInscription?.name_height || 0 }
              )}
              inputtype='search'
              onChange={handleKeywordChange}
              css={css`
                flex: 1;
                height: 48px;
                width: 360px;
                padding: 0 16px;
                border-radius: 24px;
                ${theme.typography.h2}
                color: ${theme.palette.grayLight1};
                background: ${theme.effect.blackMask};
                input {
                  height: 42px;
                }
              `}
            />
          )}
          open={names.length > 0}
          container={queryContainerRef}
          className='scroll-y'
          css={css`
            width: 100%;
            padding: 8px 16px;
            max-height: 320px;
            color: ${theme.palette.grayLight1};
            background-color: ${theme.effect.blackMask};
            border: none;
          `}
        >
          <div
            css={css`
              ${theme.typography.bodyBold}
            `}
          >
            {intl.formatMessage(
              {
                defaultMessage: '{n} inscribed names:',
              },
              { n: names.length }
            )}
          </div>
          {names.map((name) => (
            <p key={name}>{name}</p>
          ))}
        </Popover>
        <div
          ref={queryContainerRef}
          css={css`
            position: relative;
            width: 320px;
            margin-top: -24px;
          `}
        ></div>
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
                onClick={handleInscriptionClick}
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
            onClick={handleInscriptionClick}
          />
        )}
        {items.map((inscription) => (
          <InscriptionItem
            key={inscription.height}
            isLastAccepted={false}
            inscription={inscription}
            onClick={handleInscriptionClick}
          />
        ))}
      </div>
      <LoadMore
        hasMore={hasMore}
        isLoadingMore={isValidating}
        onLoadMore={loadMore}
      />
    </>
  )
}

function InscriptionItem({
  inscription,
  isLastAccepted,
  onClick,
}: {
  inscription: Inscription
  isLastAccepted: boolean
  onClick: (inscription: Inscription) => void
}) {
  const theme = useTheme()
  const tx = bytesToHex(Uint8Array.from(inscription.txid).reverse())
  return (
    <Clickable
      onClick={() => onClick(inscription)}
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
          flex: 1;
          min-width: 0;
          flex-direction: row;
          align-items: center;
          gap: 8px;
          ${theme.typography.tooltip}
        `}
      >
        <label
          css={css`
            ${textEllipsis}
            ${theme.typography.h2}
            color: ${theme.palette.grayLight1};
            margin-right: 8px;
          `}
        >
          {inscription.name}
        </label>
        <span>Seq: {inscription.sequence}</span>
        <span>Height: {inscription.height}</span>
        <span>Block: {inscription.block_height}</span>
      </div>
      <div
        css={css`
          ${textEllipsis};
          ${theme.typography.tooltip}
        `}
      >
        <span>Inscribed Tx: {tx}</span>
      </div>
    </Clickable>
  )
}

function InscriptionShortItem({
  inscription,
  onClick,
}: {
  inscription: Inscription
  onClick: (inscription: Inscription) => void
}) {
  const theme = useTheme()
  return (
    <Clickable
      onClick={() => onClick(inscription)}
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
    >
      {inscription.name} · {inscription.sequence}
    </Clickable>
  )
}

function NameStatus({
  status,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  status: NameValidating
}) {
  const intl = useIntl()
  const theme = useTheme()

  const { label, color } = useMemo(() => {
    switch (status) {
      case NameValidating.Empty:
        return {
          label: '',
          color: '',
        }
      case NameValidating.Available:
        return {
          label: intl.formatMessage({ defaultMessage: 'available' }),
          color: theme.palette.gold,
        }
      case NameValidating.Invalid:
        return {
          label: intl.formatMessage({ defaultMessage: 'invalid' }),
          color: theme.palette.orange,
        }
      case NameValidating.Inscribed:
        return {
          label: intl.formatMessage({ defaultMessage: 'inscribed' }),
          color: theme.palette.grayLight,
        }
    }
  }, [intl, status, theme])

  return label ? (
    <span
      {...props}
      css={css`
        color: ${color};
      `}
    >
      {label}
    </span>
  ) : null
}
