/**
 * useLocalStorage Hook
 * Safe localStorage management with JSON serialization
 * 
 * Features:
 * - Type-safe get/set
 * - Automatic JSON serialization
 * - Error handling
 * - Sync between tabs
 * - Default value support
 */

import { useState, useEffect } from 'react'

export function useLocalStorage(_key, _initialValue) {
  // State para almacenar el valor
  const [_storedValue, setStoredValue] = useState(() => {
    try {
      const _item = window.localStorage.getItem(_key)
      return _item ? JSON.parse(_item) : _initialValue
    } catch (_error) {
      console.error(`localStorage error reading key "${_key}":`, _error)
      return _initialValue
    }
  })

  // Función para actualizar localStorage
  const _setValue = (_value) => {
    try {
      const _valueToStore = _value instanceof Function ? _value(_storedValue) : _value
      setStoredValue(_valueToStore)
      window.localStorage.setItem(_key, JSON.stringify(_valueToStore))
      
      // Dispatchear evento personalizado para sincronización entre tabs
      window.dispatchEvent(new Event('local-storage'))
    } catch (_error) {
      console.error(`localStorage error writing key "${_key}":`, _error)
    }
  }

  // Escuchar cambios en otros tabs
  useEffect(() => {
    const _handleStorageChange = (_event) => {
      if (_event.key === _key && _event.newValue) {
        try {
          setStoredValue(JSON.parse(_event.newValue))
        } catch (_error) {
          console.error(`localStorage sync error:`, _error)
        }
      }
    }

    window.addEventListener('storage', _handleStorageChange)
    return () => window.removeEventListener('storage', _handleStorageChange)
  }, [_key])

  return [_storedValue, _setValue]
}

export default useLocalStorage
