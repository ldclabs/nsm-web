import { css, useTheme, type CSSObject } from '@emotion/react'
import { forwardRef, memo, type SVGAttributes } from 'react'
import { useIntl } from 'react-intl'

export type BrandSize = 'medium' | 'large'

const SizeDict: Record<BrandSize, CSSObject> = {
  medium: {
    height: '20px',
  },
  large: {
    height: '44px',
  },
}

export interface BrandProps extends SVGAttributes<HTMLHeadingElement> {
  size?: BrandSize
}

export const Brand = memo(
  forwardRef(function Brand(
    { size = 'medium', ...props }: BrandProps,
    ref: React.Ref<HTMLHeadingElement>
  ) {
    const intl = useIntl()
    const theme = useTheme()

    return (
      <div
        css={css`
          color: ${theme.palette.white};
          text-align: center;
        `}
      >
        <h2
          title={intl.formatMessage({ defaultMessage: 'Namebase' })}
          {...props}
          ref={ref}
          css={css`
            ${SizeDict[size]}
            ${theme.typography.h1}
          `}
        >
          Namebase
        </h2>
        <p>
          {intl.formatMessage({
            defaultMessage: 'Inscribing Name service on Bitcoin network',
          })}
        </p>
      </div>
    )
  })
)
