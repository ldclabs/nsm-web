import { css } from '@emotion/react'
import { useIsMounted } from '@nsm-web/util'
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
  'arrowcircleright': () => import('./icon/24/arrowcircleright.svg'),
  'closecircle2': () => import('./icon/24/closecircle.svg'),
  'code': () => import('./icon/remixicon/code-view.svg'),
  'delete': () => import('./icon/16/dele.svg'),
  'edit': () => import('./icon/remixicon/edit-2-line.svg'),
  'github': () => import('./icon/provider/github.svg'),
  'google': () => import('./icon/provider/google.svg'),
  'logout': () => import('./icon/remixicon/logout-box-r-line.svg'),
  'more': () => import('./icon/16/more.svg'),
  'search': () => import('./icon/24/searchnormal1.svg'),
  'tickcircle': () => import('./icon/bulk/tickcircle.svg'),
  'warning': () => import('./icon/bulk/warning.svg'),
  'passkey': () => import('./icon/provider/key.svg'),
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
