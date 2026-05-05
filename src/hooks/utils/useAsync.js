/**
 * useAsync Hook
 * Handle async operations
 */

import { useCallback, useEffect, useReducer } from 'react'

const _initialState = {
  status: 'idle',
  data: null,
  error: null
}

function _reducer(_state, _action) {
  switch (_action.type) {
    case 'PENDING':
      return { ..._state, status: 'pending', error: null }
    case 'SUCCESS':
      return { ..._state, status: 'success', data: _action.payload, error: null }
    case 'ERROR':
      return { ..._state, status: 'error', error: _action.payload, data: null }
    default:
      return _state
  }
}

export function useAsync(_asyncFunction, _immediate = true) {
  const [_state, _dispatch] = useReducer(_reducer, _initialState)

  const _execute = useCallback(async () => {
    _dispatch({ type: 'PENDING' })
    try {
      const _response = await _asyncFunction()
      _dispatch({ type: 'SUCCESS', payload: _response })
    } catch (_error) {
      _dispatch({ type: 'ERROR', payload: _error })
    }
  }, [_asyncFunction])

  useEffect(() => {
    if (_immediate) {
      _execute()
    }
  }, [_execute, _immediate])

  return { ..._state, execute: _execute }
}

export default useAsync
