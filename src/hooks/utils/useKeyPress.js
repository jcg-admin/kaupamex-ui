/**
 * useKeyPress Hook
 * Detect keyboard key press
 */

import { useEffect } from 'react'

export function useKeyPress(_key, _callback) {
  useEffect(() => {
    const _handleKeyPress = (_event) => {
      if (_event.key === _key) {
        _callback(_event)
      }
    }

    window.addEventListener('keydown', _handleKeyPress)
    return () => window.removeEventListener('keydown', _handleKeyPress)
  }, [_key, _callback])
}

export default useKeyPress
