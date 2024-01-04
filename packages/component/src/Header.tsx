import { css, useTheme } from '@emotion/react'
import { forwardRef, memo, useCallback, type HTMLAttributes } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Logo } from './Logo'
import { type MenuProps } from './Menu'

export interface HeaderProps extends HTMLAttributes<HTMLElement> {
  brand?: boolean
  userMenu?: MenuProps
}

export const Header = memo(
  forwardRef(function Header(
    { brand, userMenu, ...props }: HeaderProps,
    ref: React.Ref<HTMLElement>
  ) {
    const theme = useTheme()
    const handleClick = useCallback(
      (ev: React.MouseEvent<HTMLAnchorElement>) => {
        if (ev.detail == 2) {
          window.location.reload() // for PWA that has no refresh button
        }
      },
      []
    )

    return (
      <header
        {...props}
        ref={ref}
        css={css`
          height: 48px;
          padding: 0 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: ${theme.palette.grayLight0};
          background-color: ${theme.effect.blackMask};
          box-shadow: ${theme.effect.card};
        `}
      >
        <Link
          unstable_viewTransition={true}
          to='/'
          onClick={handleClick}
          css={css`
            display: flex;
            align-items: center;
            gap: 12px;
          `}
        >
          <Logo role='heading' aria-level={1} />
        </Link>
        {props.children}
        <NavLink
          unstable_viewTransition={true}
          to='/help/about'
          style={({ isActive, isPending, isTransitioning }) => {
            return {
              color: isActive ? theme.palette.gold : theme.palette.grayLight0,
            }
          }}
        >
          About
        </NavLink>
      </header>
    )
  })
)
