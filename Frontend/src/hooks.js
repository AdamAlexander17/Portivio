import { useEffect, useState } from 'react'

// Runs an API call when `deps` change and tracks its loading and error state.
export function useFetch(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })

  useEffect(() => {
    let cancelled = false
    setState((current) => ({ ...current, loading: true, error: '' }))
    fetcher()
      .then((data) => !cancelled && setState({ data, loading: false, error: '' }))
      .catch((err) => !cancelled && setState({ data: null, loading: false, error: err.message }))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
