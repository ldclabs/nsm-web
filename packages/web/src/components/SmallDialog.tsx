import { css } from '@emotion/react'
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogHead,
  type DialogProps,
} from '@nsm-web/component'
import { stopPropagation } from '@nsm-web/util'

interface SmallDialogProps extends DialogProps {
  title: string
}

export default function SmallDialog({
  title,
  children,
  ...props
}: SmallDialogProps) {
  return (
    <Dialog
      onPointerUpCapture={stopPropagation}
      {...props}
      css={css`
        width: 600px;
        height: auto;
        max-width: 100%;
        max-height: 100%;
        top: 50%;
        bottom: unset;
        transform: translateY(-50%);
      `}
    >
      <DialogHead>{title}</DialogHead>
      <DialogBody
        css={css`
          padding: 0 36px 36px;
        `}
      >
        {children}
      </DialogBody>
      <DialogClose />
    </Dialog>
  )
}
