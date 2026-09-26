import { createContext, useContext } from 'react'

/**
 * The context object and its hook live in a module with no components.
 *
 * Keeping them out of AuthContext.jsx means React Fast Refresh can hot-reload
 * the provider without invalidating the hook for every consumer (the
 * `only-export-components` rule exists to protect exactly this).
 */
export const AuthContext = createContext(null)

/** Access the auth context; throws if used outside the provider. */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an <AuthProvider>')
  return context
}
