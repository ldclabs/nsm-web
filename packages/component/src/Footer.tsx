import { memo } from 'react'

export interface FooterProps extends React.HTMLAttributes<HTMLElement> {}

export const Footer = memo(function Footer(props: FooterProps) {
  const { VITE_APP_VERSION } = import.meta.env
  return <footer {...props}>{VITE_APP_VERSION} ©️ 2024 LDC Labs</footer>
})
