import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import { Alert, PageLoader } from './ui'

/**
 * Guards a branch of the router.
 *
 * - Waits for auth hydration before deciding, so a refresh doesn't bounce a
 *   signed-in user to /login.
 * - Sends guests to /login and remembers where they were headed.
 * - Shows a friendly 403 instead of redirecting when a role lacks permission,
 *   which is more informative than a silent bounce.
 */
export default function ProtectedRoute({ roles }) {
  const { user, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader label="Checking your session…" />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <Alert variant="warning" title="You don't have access to this page">
          This area is limited to{' '}
          <strong>
            {roles.join(' / ')}
          </strong>{' '}
          accounts. You are signed in as <strong>{user.role}</strong>.
        </Alert>
      </div>
    )
  }

  return <Outlet />
}
