import { css, useTheme } from '@emotion/react'
import { forwardRef, memo, type HTMLAttributes } from 'react'
import { NavLink } from 'react-router-dom'
import { type MenuProps } from './Menu'

export interface NavigationProps extends HTMLAttributes<HTMLElement> {
  brand?: boolean
  userMenu?: MenuProps
}

export const Navigation = memo(
  forwardRef(function Header(
    { brand, userMenu, ...props }: NavigationProps,
    ref: React.Ref<HTMLElement>
  ) {
    const theme = useTheme()

    return (
      <footer
        {...props}
        ref={ref}
        css={css`
          height: 48px;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-around;
          color: ${theme.palette.grayNormal};
          background-color: ${theme.effect.whiteMask};
        `}
      >
        <NavLink
          to='/'
          style={({ isActive, isPending, isTransitioning }) => {
            return {
              color: isActive
                ? theme.palette.grayLight1
                : theme.palette.grayNormal,
            }
          }}
        >
          Inscriptions
        </NavLink>
        <NavLink
          to='/page/name'
          style={({ isActive, isPending, isTransitioning }) => {
            return {
              color: isActive
                ? theme.palette.grayLight1
                : theme.palette.grayNormal,
            }
          }}
        >
          Names
        </NavLink>
        <NavLink
          to='/page/wallet'
          style={({ isActive, isPending, isTransitioning }) => {
            return {
              color: isActive
                ? theme.palette.grayLight1
                : theme.palette.grayNormal,
            }
          }}
        >
          Wallet
        </NavLink>
      </footer>
    )
  })
)
