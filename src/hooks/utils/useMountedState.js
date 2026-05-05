/**
 * useMountedState Hook
 * Track if component is mounted (prevent memory leaks)
 */

import { useEffect, useRef, useCallback } from 'react'

export function useMountedState() {
  const _isMounted = useRef(false)

  useEffect(() => {
    _isMounted.current = true
    return () => {
      _isMounted.current = false
    }
  }, [])

  return useCallback(() => _isMounted.current, [])
}

export default useMountedState
