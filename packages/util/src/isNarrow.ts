export const BREAKPOINT = {
  small: 600,
  medium: 960,
  large: 1280,
} as const

export function checkNarrow() {
  return typeof window !== 'undefined' && window.innerWidth <= BREAKPOINT.small
}
