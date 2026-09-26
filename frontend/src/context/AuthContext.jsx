import { useCallback, useEffect, useMemo, useState } from 'react'
import { authApi, tokenStore } from '../lib/api'
import { AuthContext } from './authContext'

/**
 * Owns the authenticated user for the whole app.
 *
 * The token lives in localStorage and is injected by the axios interceptor; on
 * first paint we hydrate the user from `/auth/me` so a page refresh keeps you
 * signed in. A global `jobnest:unauthorized` event (fired by the interceptor on
 * any 401) clears the session immediately, which keeps the UI honest even if
 * the token expires mid-session.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(tokenStore.get()))
  const [error, setError] = useState(null)

  // Restore the session from a stored token on mount.
  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      if (!tokenStore.get()) {
        setLoading(false)
        return
      }
      try {
        const data = await authApi.me()
        if (!cancelled) setUser(data.user)
      } catch {
        // Token is stale/invalid — drop it and continue as a guest.
        tokenStore.clear()
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  // React to forced sign-outs from the API layer.
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null)
      setError(null)
    }
    window.addEventListener('jobnest:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('jobnest:unauthorized', handleUnauthorized)
  }, [])

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials)
    tokenStore.set(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (payload) => {
    const data = await authApi.register(payload)
    tokenStore.set(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  /** Merge partial profile updates (e.g. after a successful upload). */
  const updateUser = useCallback((partial) => {
    setUser((current) => (current ? { ...current, ...partial } : current))
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.me()
      setUser(data.user)
      return data.user
    } catch {
      return null
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      setError,
      isAuthenticated: Boolean(user),
      isJobseeker: user?.role === 'jobseeker',
      isEmployer: user?.role === 'employer',
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      updateUser,
      refreshUser,
    }),
    [user, loading, error, login, register, logout, updateUser, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
