import { checkNarrow } from '@ldclabs/util'
import { useEffect, useState } from 'react'

export const MAX_WIDTH = '800px'
export { BREAKPOINT } from '@ldclabs/util'

export function useIsNarrow() {
  const [isNarrow, setIsNarrow] = useState(checkNarrow)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleResize = () => setIsNarrow(checkNarrow())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isNarrow
}
