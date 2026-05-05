/**
 * useClickAway Hook
 * Detect click outside element
 */

import { useRef, useEffect } from 'react'

export function useClickAway(_callback) {
  const _ref = useRef(null)

  useEffect(() => {
    const _handleClickOutside = (_event) => {
      if (_ref.current && !_ref.current.contains(_event.target)) {
        _callback(_event)
      }
    }

    document.addEventListener('mousedown', _handleClickOutside)
    document.addEventListener('touchstart', _handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', _handleClickOutside)
      document.removeEventListener('touchstart', _handleClickOutside)
    }
  }, [_callback])

  return _ref
}

export default useClickAway
