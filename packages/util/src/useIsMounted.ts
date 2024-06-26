import { useCallback, useEffect, useRef } from 'react'

export function useIsMounted() {
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])
  return useCallback(() => isMountedRef.current, [])
}
