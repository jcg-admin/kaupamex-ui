/**
 * useDebounce Hook
 * Debounce a value (useful for search, typing, etc)
 */

import { useState, useEffect } from 'react'

export function useDebounce(_value, _delay = 500) {
  const [_debouncedValue, setDebouncedValue] = useState(_value)

  useEffect(() => {
    // Set up debounce timer
    const _timer = setTimeout(() => {
      setDebouncedValue(_value)
    }, _delay)

    // Clean up timer if value or delay changes
    return () => clearTimeout(_timer)
  }, [_value, _delay])

  return _debouncedValue
}

export default useDebounce
