import { Briefcase, Eye, EyeOff, LogIn } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Alert, Spinner } from '../components/ui'
import { useAuth } from '../context/authContext'
import useDocumentTitle from '../hooks/useDocumentTitle'

/** Where to send each role after a successful sign-in. */
const HOME_BY_ROLE = {
  jobseeker: '/dashboard',
  employer: '/employer',
  admin: '/admin',
}

export default function Login() {
  useDocumentTitle('Sign in')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const redirectTo = location.state?.from

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const user = await login(form)
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`)
      navigate(redirectTo || HOME_BY_ROLE[user.role] || '/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  /** Fill the demo credentials so reviewers can try the app instantly. */
  function fillDemoAccount(email) {
    setForm({ email, password: 'Password123!' })
    setError(null)
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-6xl flex-col items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Briefcase className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-1.5 text-sm text-slate-500">Sign in to continue your job search.</p>
        </div>

        <div className="card p-6 sm:p-7">
          {error && (
            <Alert variant="error" className="mb-5">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="you@example.com"
                className="input"
              />
            </div>

            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder="••••••••"
                  className="input pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
              {submitting ? <Spinner size="sm" className="text-white" /> : <LogIn className="h-4 w-4" aria-hidden="true" />}
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:underline">
              Create one free
            </Link>
          </p>
        </div>

        {/* Demo credentials — remove this block once you have real users. */}
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-4">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Demo accounts</p>
          <p className="mt-1 text-xs text-slate-400">
            Password for all: <code className="rounded bg-slate-100 px-1 py-0.5">Password123!</code>
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {[
              { label: 'Job seeker', email: 'ade@example.com' },
              { label: 'Employer', email: 'employer1@example.com' },
              { label: 'Admin', email: 'admin@jobportal.dev' },
            ].map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => fillDemoAccount(account.email)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-left text-xs transition-colors hover:border-brand-300 hover:bg-brand-50"
              >
                <span className="block font-semibold text-slate-700">{account.label}</span>
                <span className="block truncate text-slate-400">{account.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
