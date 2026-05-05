/**
 * useInterval Hook
 * Safe interval with automatic cleanup
 */

import { useEffect, useRef } from 'react'

export function useInterval(_callback, _delay) {
  const _ref = useRef(null)

  useEffect(() => {
    _ref.current = setInterval(_callback, _delay)
    return () => clearInterval(_ref.current)
  }, [_callback, _delay])

  return _ref.current
}

export default useInterval
