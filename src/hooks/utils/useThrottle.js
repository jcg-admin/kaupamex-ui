/**
 * useThrottle Hook
 * Throttle function calls
 */

import { useRef, useCallback } from 'react'

export function useThrottle(_callback, _delay = 300) {
  const _lastRun = useRef(Date.now() - _delay)
  const _timeoutRef = useRef(null)

  const _throttledCallback = useCallback(
    (..._args) => {
      const _now = Date.now()
      const _timeSinceLastRun = _now - _lastRun.current

      if (_timeSinceLastRun >= _delay) {
        _callback(..._args)
        _lastRun.current = _now
      } else {
        clearTimeout(_timeoutRef.current)
        _timeoutRef.current = setTimeout(() => {
          _callback(..._args)
          _lastRun.current = Date.now()
        }, _delay - _timeSinceLastRun)
      }
    },
    [_callback, _delay]
  )

  return _throttledCallback
}

export default useThrottle
