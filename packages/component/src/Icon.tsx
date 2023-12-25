import { css } from '@emotion/react'
import { useIsMounted } from '@ldclabs/util'
import {
  forwardRef,
  memo,
  useEffect,
  useState,
  type ComponentType,
  type SVGAttributes,
} from 'react'
import { useLogger } from './logger'

const SVG_LIST = {
  'add': () => import('./icon/remixicon/add-line.svg'),
  'align-center': () => import('./icon/remixicon/align-center.svg'),
  'align-justify': () => import('./icon/remixicon/align-justify.svg'),
  'align-left': () => import('./icon/remixicon/align-left.svg'),
  'align-right': () => import('./icon/remixicon/align-right.svg'),
  'arrow-down-s-line': () => import('./icon/remixicon/arrow-down-s-line.svg'),
  'arrow-left-s-line': () => import('./icon/remixicon/arrow-left-s-line.svg'),
  'arrow-right-s-line': () => import('./icon/remixicon/arrow-right-s-line.svg'),
  'arrow-up-s-line': () => import('./icon/remixicon/arrow-up-s-line.svg'),
  'archive': () => import('./icon/16/archive.svg'),
  'arrowcircleright': () => import('./icon/24/arrowcircleright.svg'),
  'backwarditem': () => import('./icon/16/backwarditem.svg'),
  'bold': () => import('./icon/remixicon/bold.svg'),
  'book': () => import('./icon/remixicon/book-2-line.svg'),
  'brodcast': () => import('./icon/16/brodcast.svg'),
  'celo': () => import('./icon/bulk/celo.svg'),
  'closecircle': () => import('./icon/16/closecircle.svg'),
  'closecircle2': () => import('./icon/24/closecircle.svg'),
  'code': () => import('./icon/remixicon/code-view.svg'),
  'codeblock': () => import('./icon/remixicon/code-s-slash-line.svg'),
  'coin': () => import('./icon/bulk/coin.svg'),
  'compare': () => import('./icon/16/compare.svg'),
  'compare2': () => import('./icon/24/compare.svg'),
  'delete': () => import('./icon/16/dele.svg'),
  'directright': () => import('./icon/16/directright.svg'),
  'directright2': () => import('./icon/24/directright.svg'),
  'documentcopy': () => import('./icon/16/documentcopy.svg'),
  'dropdown': () => import('./icon/16/dropdown.svg'),
  'draggable': () => import('./icon/remixicon/draggable.svg'),
  'edit': () => import('./icon/16/edit.svg'),
  'gallery': () => import('./icon/bulk/gallery.svg'),
  'github': () => import('./icon/provider/github.svg'),
  'google': () => import('./icon/provider/google.svg'),
  'h1': () => import('./icon/remixicon/h-1.svg'),
  'h2': () => import('./icon/remixicon/h-2.svg'),
  'h3': () => import('./icon/remixicon/h-3.svg'),
  'h4': () => import('./icon/remixicon/h-4.svg'),
  'h5': () => import('./icon/remixicon/h-5.svg'),
  'h6': () => import('./icon/remixicon/h-6.svg'),
  'heart': () => import('./icon/16/heart.svg'),
  'heart2': () => import('./icon/16/heart-1.svg'),
  'heart3': () => import('./icon/24/heart.svg'),
  'horizontal': () => import('./icon/remixicon/separator.svg'),
  'imgupload': () => import('./icon/remixicon/image-line.svg'),
  'importcurve': () => import('./icon/16/importcurve.svg'),
  'italic': () => import('./icon/remixicon/italic.svg'),
  'lampon': () => import('./icon/bulk/lampon.svg'),
  'link': () => import('./icon/remixicon/link.svg'),
  'link2': () => import('./icon/24/link.svg'),
  'link-unlink': () => import('./icon/remixicon/link-unlink.svg'),
  'memory': () => import('./icon/remixicon/memories-line.svg'),
  'messagenotif': () => import('./icon/16/messagenotif.svg'),
  'more': () => import('./icon/16/more.svg'),
  'more2': () => import('./icon/24/more.svg'),
  'notification': () => import('./icon/24/notification.svg'),
  'ol': () => import('./icon/remixicon/list-ordered-2.svg'),
  'quote': () => import('./icon/format/Quoteup.svg'),
  'recoveryconvert': () => import('./icon/16/recoveryconvert.svg'),
  'refresh': () => import('./icon/16/refresh.svg'),
  'right': () => import('./icon/16/right.svg'),
  'search': () => import('./icon/24/searchnormal1.svg'),
  'settings': () => import('./icon/remixicon/settings-5-line.svg'),
  'strike': () => import('./icon/remixicon/strikethrough-2.svg'),
  'subscript': () => import('./icon/remixicon/subscript-2.svg'),
  'superscript': () => import('./icon/remixicon/superscript-2.svg'),
  'list-check': () => import('./icon/remixicon/list-check-3.svg'),
  'menu-fold-line': () => import('./icon/remixicon/menu-fold-line.svg'),
  'menu-line': () => import('./icon/remixicon/menu-line.svg'),
  'menu-unfold-line': () => import('./icon/remixicon/menu-unfold-line.svg'),
  'tick': () => import('./icon/16/tick.svg'),
  'tickcircle': () => import('./icon/bulk/tickcircle.svg'),
  'translate': () => import('./icon/16/translate.svg'),
  'translate2': () => import('./icon/24/translate.svg'),
  'translate3': () => import('./icon/bulk/translate.svg'),
  'ul': () => import('./icon/remixicon/list-unordered.svg'),
  'underline': () => import('./icon/remixicon/underline.svg'),
  'upload': () => import('./icon/24/upload.svg'),
  'wanchain': () => import('./icon/16/wanchain1.svg'),
  'warning': () => import('./icon/bulk/warning.svg'),
  'wechat': () => import('./icon/provider/wechat.svg'),
}

export const IconNameList = Object.keys(SVG_LIST) as IconName[]

export type IconName = keyof typeof SVG_LIST

export type IconSize = 'small' | 'medium' | 'large' | number

const SizeDict: Record<IconSize, number> = {
  small: 16,
  medium: 24,
  large: 32,
}

export interface IconProps extends SVGAttributes<SVGSVGElement> {
  /**
   * custom SVG component
   */
  component?: ComponentType<SVGAttributes<SVGSVGElement>>
  /**
   * required if `component` is not provided
   */
  name?: IconName
  /**
   * @default 'medium'
   */
  size?: IconSize
}

export const Icon = memo(
  forwardRef(function Icon(
    { component, name, size = 'medium', tabIndex = -1, ...props }: IconProps,
    ref: React.Ref<SVGSVGElement>
  ) {
    const logger = useLogger()
    const isMounted = useIsMounted()
    const width = typeof size === 'number' ? size : SizeDict[size]
    const [SVG = 'svg', setSVG] = useState<
      ComponentType<SVGAttributes<SVGSVGElement>> | undefined
    >(component)

    useEffect(() => {
      if (typeof SVG === 'function') return
      if (!name) return
      ;(async () => {
        try {
          const { ReactComponent } = await SVG_LIST[name]()
          isMounted() && setSVG(() => ReactComponent)
        } catch (error) {
          logger.error('failed to load icon', { error })
        }
      })()
    }, [SVG, isMounted, logger, name])

    return (
      <SVG
        focusable={tabIndex >= 0}
        tabIndex={tabIndex}
        aria-hidden={!props['aria-label']} // https://css-tricks.com/accessible-svg-icons/#aa-the-icon-is-decorative
        role='img'
        {...props}
        ref={ref}
        css={css`
          flex-shrink: 0;
          width: ${width}px;
          height: ${width}px;
          color: inherit;
          fill: currentColor;
          user-select: none;
        `}
      />
    )
  })
)