/**
 * usePrevious Hook
 * Track previous value
 */

import { useRef, useEffect } from 'react'

export function usePrevious(_value) {
  const _ref = useRef()

  useEffect(() => {
    _ref.current = _value
  }, [_value])

  return _ref.current
}

export default usePrevious
