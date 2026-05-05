/**
 * useMediaQuery Hook
 * Responsive design in JS
 */

import { useState, useEffect } from 'react'

export function useMediaQuery(_query) {
  const [_matches, setMatches] = useState(false)

  useEffect(() => {
    const _media = window.matchMedia(_query)
    
    // Check inicial
    setMatches(_media.matches)

    // Listener para cambios
    const _listener = (_e) => setMatches(_e.matches)
    _media.addEventListener('change', _listener)

    return () => _media.removeEventListener('change', _listener)
  }, [_query])

  return _matches
}

export default useMediaQuery
