import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Tiny data-fetching hook: runs `fetcher` on mount and whenever `deps` change,
 * and exposes `reload()` for manual refreshes.
 *
 * A request-sequence guard discards out-of-order responses, which is what makes
 * it safe to fire a new request on every keystroke (job search).
 *
 * @param {(signal: AbortSignal) => Promise<any>} fetcher
 * @param {any[]} deps
 * @param {{ enabled?: boolean, initialData?: any }} options
 */
export function useFetch(fetcher, deps = [], options = {}) {
  const { enabled = true, initialData = null } = options

  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState(null)

  const requestId = useRef(0)
  const mounted = useRef(true)
  // Keep the latest fetcher without making it a dependency of the effect.
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const execute = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError(null)

    try {
      const result = await fetcherRef.current()
      // Ignore stale responses from superseded requests.
      if (mounted.current && id === requestId.current) {
        setData(result)
      }
      return result
    } catch (err) {
      if (mounted.current && id === requestId.current) setError(err)
      return null
    } finally {
      if (mounted.current && id === requestId.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, execute, ...deps])

  return { data, loading, error, reload: execute, setData }
}

export default useFetch
