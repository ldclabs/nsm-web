import { css, useTheme } from '@emotion/react'
import { AccountManager, type MenuProps } from '@ldclabs/component'
import { forwardRef, memo, type HTMLAttributes } from 'react'
import { NavLink } from 'react-router-dom'

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
          color: ${theme.palette.grayLight0};
          background-color: ${theme.effect.blackMask};
          box-shadow: ${theme.effect.card};
          a {
            width: 32%;
            text-align: center;
          }
        `}
      >
        <NavLink
          unstable_viewTransition={true}
          to='/indexer'
          style={({ isActive, isPending, isTransitioning }) => {
            return {
              color: isActive ? theme.palette.gold : theme.palette.grayLight0,
            }
          }}
        >
          Indexer
        </NavLink>
        <AccountManager>
          <NavLink
            unstable_viewTransition={true}
            to='/account'
            style={({ isActive, isPending, isTransitioning }) => {
              return {
                color: isActive ? theme.palette.gold : theme.palette.grayLight0,
              }
            }}
          >
            Account
          </NavLink>
        </AccountManager>
      </footer>
    )
  })
)
