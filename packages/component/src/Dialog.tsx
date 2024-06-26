import { css, useTheme } from '@emotion/react'
import {
  RGBA,
  useModal,
  type AnchorProps,
  type ModalProps,
  type ModalRef,
} from '@nsm-web/util'
import {
  createContext,
  forwardRef,
  memo,
  useCallback,
  useContext,
  useImperativeHandle,
  type HTMLAttributes,
} from 'react'
import { useIntl } from 'react-intl'
import { IconButton, type IconButtonProps } from './Button'
import { Portal, type PortalProps } from './Portal'

export interface DialogProps
  extends HTMLAttributes<HTMLDivElement>,
    ModalProps {
  anchor?: (props: AnchorProps) => JSX.Element
  container?: PortalProps['container']
}

export const Dialog = memo(
  forwardRef(function Dialog(
    { anchor, container, ...props }: DialogProps,
    ref: React.Ref<ModalRef>
  ) {
    const theme = useTheme()
    const { open, modal, anchorProps, floatingProps } = useModal(props)
    useImperativeHandle(ref, () => modal, [modal])

    return (
      <DialogContext.Provider value={modal}>
        {anchor?.(anchorProps)}
        {open && (
          <Portal container={container}>
            <div
              data-dialog-backdrop={true}
              css={css`
                position: fixed;
                inset: 0;
                background: ${theme.color.dialog.backdrop};
                z-index: 1;
              `}
            />
            <div
              role='dialog'
              aria-modal='true'
              tabIndex={-1}
              {...floatingProps}
              css={css`
                position: fixed;
                inset: 0;
                width: 100%;
                max-width: 600px;
                max-height: 1080px;
                margin: auto;
                background: ${theme.palette.grayLight0};
                border-radius: 16px;
                border: none;
                display: flex;
                flex-direction: column;
                z-index: 1;
              `}
            />
          </Portal>
        )}
      </DialogContext.Provider>
    )
  })
)

const DialogContext = createContext<ModalRef | undefined>(undefined)

export const DialogHead = memo(function DialogHead(
  props: HTMLAttributes<HTMLDivElement>
) {
  const theme = useTheme()

  return (
    <div
      data-dialog-head={true}
      {...props}
      css={css`
        ${theme.typography.bodyBold}
        padding: 16px 16px 8px;
        text-align: center;
      `}
    />
  )
})

export const DialogBody = memo(
  forwardRef(function DialogBody(
    props: HTMLAttributes<HTMLDivElement>,
    ref: React.Ref<HTMLDivElement>
  ) {
    return (
      <div
        ref={ref}
        data-dialog-body={true}
        {...props}
        css={css`
          display: flex;
          flex: 1;
          padding: 0 16px 24px;
          overflow-y: auto;
        `}
      />
    )
  })
)

export const DialogFoot = memo(function DialogFoot(
  props: HTMLAttributes<HTMLDivElement>
) {
  return (
    <div
      data-dialog-foot={true}
      {...props}
      css={css`
        padding: 16px;
        text-align: center;
      `}
    />
  )
})

export interface DialogCloseProps extends Partial<IconButtonProps> {
  stopPropagation?: boolean
}

export const DialogClose = memo(function DialogClose({
  stopPropagation = true,
  iconName = 'closecircle2',
  onClick,
  onPointerUpCapture,
  ...props
}: DialogCloseProps) {
  const intl = useIntl()
  const theme = useTheme()
  const dialog = useContext(DialogContext)

  const handleClick = useCallback(
    (ev: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(ev)
      !ev.isDefaultPrevented() && dialog?.close()
    },
    [dialog, onClick]
  )

  const handlePointerUpCapture = useCallback(
    (ev: React.PointerEvent<HTMLButtonElement>) => {
      onPointerUpCapture?.(ev)
      if (stopPropagation) ev.stopPropagation()
    },
    [onPointerUpCapture, stopPropagation]
  )

  return (
    <IconButton
      aria-label={intl.formatMessage({ defaultMessage: 'Close' })}
      data-dialog-close={true}
      iconName={iconName}
      size='medium'
      onClick={handleClick}
      onPointerUpCapture={handlePointerUpCapture}
      {...props}
      css={css`
        position: absolute;
        top: 16px;
        right: 16px;
        color: ${RGBA(theme.palette.grayLight, 0.4)};
      `}
    />
  )
})
