import { css, useTheme, type CSSObject } from '@emotion/react'
import { forwardRef, memo, type SVGAttributes } from 'react'
import { useIntl } from 'react-intl'
import { ReactComponent as SVG } from './logo.svg'

export type BrandSize = 'medium' | 'large'

const SizeDict: Record<BrandSize, CSSObject> = {
  medium: {
    height: '20px',
  },
  large: {
    height: '44px',
  },
}

export interface BrandProps extends SVGAttributes<SVGSVGElement> {
  size?: BrandSize
}

export const Brand = memo(
  forwardRef(function Brand(
    { size = 'medium', ...props }: BrandProps,
    ref: React.Ref<SVGSVGElement>
  ) {
    const intl = useIntl()
    const theme = useTheme()

    return (
      <SVG
        role='img'
        title={intl.formatMessage({ defaultMessage: 'NS Protocol' })}
        {...props}
        ref={ref}
        css={css`
          ${SizeDict[size]}
          vertical-align: text-bottom;
          color: ${theme.palette.primaryNormal};
          fill: currentColor;
          user-select: none;
        `}
      />
    )
  })
)
