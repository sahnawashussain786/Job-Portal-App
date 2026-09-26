import { Briefcase, Building2, Eye, EyeOff, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, Spinner } from '../components/ui'
import { useAuth } from '../context/authContext'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { cn } from '../lib/format'

const ROLES = [
  {
    value: 'jobseeker',
    label: 'I want to hire myself out',
    short: 'Job seeker',
    description: 'Find roles, save jobs and track your applications.',
    icon: Users,
  },
  {
    value: 'employer',
    label: 'I want to hire',
    short: 'Employer',
    description: 'Post jobs, manage applicants and build your company page.',
    icon: Building2,
  },
]

export default function Register() {
  useDocumentTitle('Create an account')
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'jobseeker',
    companyName: '',
    location: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  function update(key) {
    return (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        location: form.location || undefined,
      }
      if (form.role === 'employer') payload.companyName = form.companyName || `${form.name}'s Company`

      const user = await register(payload)
      toast.success('Account created — welcome to JobNest!')
      navigate(user.role === 'employer' ? '/employer' : '/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
        <p className="mt-1.5 text-sm text-slate-500">It's free and only takes a minute.</p>
      </div>

      <div className="card p-6 sm:p-8">
        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Role picker */}
        <fieldset className="mb-6">
          <legend className="label">I am a…</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {ROLES.map(({ value, short, description, icon: Icon }) => {
              const selected = form.role === value
              return (
                <label
                  key={value}
                  className={cn(
                    'flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors',
                    selected ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-slate-200 hover:border-slate-300',
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={selected}
                    onChange={update('role')}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                      selected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900">{short}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{description}</span>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              value={form.name}
              onChange={update('name')}
              placeholder={form.role === 'employer' ? 'Dana Whitfield' : 'Ade Okonkwo'}
              className="input"
            />
          </div>

          {form.role === 'employer' && (
            <div>
              <label className="label" htmlFor="companyName">
                Company name
              </label>
              <input
                id="companyName"
                type="text"
                value={form.companyName}
                onChange={update('companyName')}
                placeholder="Acme Corp"
                className="input"
              />
              <p className="mt-1 text-xs text-slate-400">You can change this later in your company profile.</p>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="reg-email">
                Email address
              </label>
              <input
                id="reg-email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={update('email')}
                placeholder="you@example.com"
                className="input"
              />
            </div>

            <div>
              <label className="label" htmlFor="reg-location">
                Location <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="reg-location"
                type="text"
                autoComplete="address-level2"
                value={form.location}
                onChange={update('location')}
                placeholder="Austin, TX"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="reg-password">
              Password
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete="new-password"
                value={form.password}
                onChange={update('password')}
                placeholder="At least 6 characters"
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
            {submitting ? <Spinner size="sm" className="text-white" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
            {submitting ? 'Creating account…' : 'Create account'}
          </button>

          <p className="text-center text-xs leading-relaxed text-slate-400">
            By creating an account you agree to our terms of service and privacy policy.
          </p>
        </form>

        <p className="mt-6 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400">
        <Briefcase className="h-4 w-4" aria-hidden="true" />
        Thousands of roles, one profile.
      </p>
    </div>
  )
}
