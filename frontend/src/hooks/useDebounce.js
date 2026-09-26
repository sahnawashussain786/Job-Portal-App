import { useEffect, useState } from 'react'

/**
 * Delay propagating a rapidly-changing value (like a search box) until the user
 * pauses typing. Keeps the API from being hit on every keystroke.
 */
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    // Reset the timer if the value changes before `delay` elapses.
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

export default useDebounce
