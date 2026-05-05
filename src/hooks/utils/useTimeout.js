/**
 * useTimeout Hook
 * Safe timeout with automatic cleanup
 */

import { useEffect, useRef } from 'react'

export function useTimeout(_callback, _delay) {
  const _ref = useRef(null)

  useEffect(() => {
    _ref.current = setTimeout(_callback, _delay)
    return () => clearTimeout(_ref.current)
  }, [_callback, _delay])

  return _ref.current
}

export default useTimeout
