import {
  BarChart3,
  Briefcase,
  Building2,
  Eye,
  Search,
  Shield,
  Sparkles,
  Star,
  Trash2,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Link } from 'react-router-dom'
import Pagination from '../../components/Pagination'
import { Alert, CompanyLogo, EmptyState, PageLoader, StatCard, StatusBadge } from '../../components/ui'
import useDebounce from '../../hooks/useDebounce'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useFetch from '../../hooks/useFetch'
import { adminApi } from '../../lib/api'
import { cn, formatDate, titleCase } from '../../lib/format'

const ROLES = ['jobseeker', 'employer', 'admin']
const JOB_STATUSES = ['open', 'draft', 'closed', 'archived']

/** Simple horizontal bar list used for the category breakdown. */
function CategoryBars({ rows }) {
  if (!rows?.length) return <p className="text-sm text-slate-500">No data yet.</p>
  const max = Math.max(...rows.map((row) => row.count))

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row._id}>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">{row._id || 'Uncategorised'}</span>
            <span className="font-semibold text-slate-800">{row.count}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${max ? (row.count / max) * 100 : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function UsersTab() {
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const debouncedQuery = useDebounce(query, 400)

  const { data, loading, error, reload } = useFetch(
    () => adminApi.users({ q: debouncedQuery || undefined, role: role || undefined, page, limit: 10 }),
    [debouncedQuery, role, page],
  )

  const users = data?.users || []

  async function changeRole(user, nextRole) {
    try {
      await adminApi.updateUser(user._id, { role: nextRole })
      toast.success(`${user.name} is now ${nextRole}`)
      reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function toggleActive(user) {
    try {
      await adminApi.updateUser(user._id, { isActive: !user.isActive })
      toast.success(user.isActive ? 'Account deactivated' : 'Account reactivated')
      reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function removeUser(user) {
    if (!window.confirm(`Permanently delete ${user.name} (${user.email})? This cannot be undone.`)) return
    try {
      await adminApi.deleteUser(user._id)
      toast.success('User deleted')
      reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          {['', ...ROLES].map((value) => (
            <button
              key={value || 'all'}
              type="button"
              onClick={() => {
                setRole(value)
                setPage(1)
              }}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
                role === value
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
              )}
            >
              {value ? titleCase(value) : 'All roles'}
            </button>
          ))}
        </div>

        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            placeholder="Search name or email"
            aria-label="Search users"
            className="input pl-9"
          />
        </div>
      </div>

      {error && <Alert variant="error" className="mb-5">{error.message}</Alert>}

      {loading && !data ? (
        <PageLoader />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">User</th>
                <th scope="col" className="px-4 py-3 font-semibold">Role</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold">Joined</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    {user.company && <p className="text-xs text-slate-400">{user.company.name}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(event) => changeRole(user, event.target.value)}
                      aria-label={`Role for ${user.name}`}
                      className="input w-auto py-1.5 text-xs capitalize"
                    >
                      {ROLES.map((value) => (
                        <option key={value} value={value}>
                          {titleCase(value)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleActive(user)}
                      className={cn(
                        'chip',
                        user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
                      )}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeUser(user)}
                        className="btn-ghost px-2 text-rose-600 hover:bg-rose-50"
                        aria-label={`Delete ${user.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && <div className="p-8 text-center text-sm text-slate-500">No users found.</div>}
        </div>
      )}

      <Pagination meta={data?.meta} onPageChange={setPage} className="mt-6" />
    </div>
  )
}

function JobsTab() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const debouncedQuery = useDebounce(query, 400)

  const { data, loading, error, reload } = useFetch(
    () => adminApi.jobs({ q: debouncedQuery || undefined, status: status || undefined, page, limit: 10 }),
    [debouncedQuery, status, page],
  )

  const jobs = data?.jobs || []

  async function toggleFeatured(job) {
    try {
      await adminApi.moderateJob(job._id, { isFeatured: !job.isFeatured })
      toast.success(job.isFeatured ? 'Removed from featured' : 'Marked as featured')
      reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function removeJob(job) {
    if (!window.confirm(`Delete "${job.title}" and all of its applications?`)) return
    try {
      await adminApi.deleteJob(job._id)
      toast.success('Job removed')
      reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          {['', ...JOB_STATUSES].map((value) => (
            <button
              key={value || 'all'}
              type="button"
              onClick={() => {
                setStatus(value)
                setPage(1)
              }}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
                status === value
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
              )}
            >
              {value ? titleCase(value) : 'All'}
            </button>
          ))}
        </div>

        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            placeholder="Search job title"
            aria-label="Search jobs"
            className="input pl-9"
          />
        </div>
      </div>

      {error && <Alert variant="error" className="mb-5">{error.message}</Alert>}

      {loading && !data ? (
        <PageLoader />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job._id} className="card flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <CompanyLogo company={job.company} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/jobs/${job._id}`} className="truncate font-semibold text-slate-900 hover:text-brand-600">
                      {job.title}
                    </Link>
                    <StatusBadge status={job.status} />
                    {job.isFeatured && <span className="chip bg-amber-50 text-amber-700">Featured</span>}
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    {job.company?.name} · {job.postedBy?.name} · posted {formatDate(job.createdAt)}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" aria-hidden="true" />
                      {job.applicationCount} applicants
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3 w-3" aria-hidden="true" />
                      {job.views} views
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => toggleFeatured(job)} className="btn-secondary">
                  <Star className={cn('h-4 w-4', job.isFeatured && 'fill-current text-amber-500')} aria-hidden="true" />
                  {job.isFeatured ? 'Unfeature' : 'Feature'}
                </button>
                <button
                  type="button"
                  onClick={() => removeJob(job)}
                  className="btn-ghost px-2.5 text-rose-600 hover:bg-rose-50"
                  aria-label={`Delete ${job.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {jobs.length === 0 && (
            <EmptyState icon={Briefcase} title="No jobs found" description="Try a different filter or search term." />
          )}
        </div>
      )}

      <Pagination meta={data?.meta} onPageChange={setPage} className="mt-6" />
    </div>
  )
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
]

export default function AdminDashboard() {
  useDocumentTitle('Admin')
  const [tab, setTab] = useState('overview')
  const { data, loading, error } = useFetch(() => adminApi.stats(), [])

  const stats = data?.stats

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-brand-600" aria-hidden="true" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Admin panel</h1>
        </div>
        <p className="mt-1.5 text-slate-600">Platform health, user management and job moderation.</p>
      </header>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-current={tab === id ? 'page' : undefined}
            className={cn(
              '-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors',
              tab === id
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-8">
          {error && <Alert variant="error">{error.message}</Alert>}

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total users" value={loading ? '—' : stats?.totalUsers} icon={Users} tone="brand" />
            <StatCard label="Job seekers" value={loading ? '—' : stats?.seekers} icon={Users} tone="slate" />
            <StatCard label="Employers" value={loading ? '—' : stats?.employers} icon={Building2} tone="amber" />
            <StatCard label="Companies" value={loading ? '—' : stats?.totalCompanies} icon={Building2} tone="slate" />
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total jobs" value={loading ? '—' : stats?.totalJobs} icon={Briefcase} tone="brand" />
            <StatCard label="Open jobs" value={loading ? '—' : stats?.openJobs} icon={Briefcase} tone="green" />
            <StatCard
              label="Applications"
              value={loading ? '—' : stats?.totalApplications}
              icon={Users}
              tone="rose"
            />
            <StatCard
              label="Apps per open job"
              value={loading ? '—' : stats?.applicationsPerJob}
              icon={BarChart3}
              tone="slate"
              hint="Funnel health indicator"
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card p-6">
              <h2 className="font-semibold text-slate-900">Open jobs by category</h2>
              <div className="mt-4">
                <CategoryBars rows={stats?.byCategory} />
              </div>
            </section>

            <section className="card p-6">
              <h2 className="font-semibold text-slate-900">Signups (last 6 months)</h2>
              {stats?.monthlySignups?.length ? (
                <ul className="mt-4 space-y-3">
                  {stats.monthlySignups.map((row) => (
                    <li key={row._id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{row._id}</span>
                      <span className="font-semibold text-slate-800">{row.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-500">No signups recorded in the last 6 months.</p>
              )}
            </section>
          </div>

          <Alert variant="info" title="Demo tip">
            The admin account is created by the seed script using the{' '}
            <code className="rounded bg-white px-1">ADMIN_EMAIL</code> environment variable. Change it before deploying.
          </Alert>
        </div>
      )}

      {tab === 'users' && <UsersTab />}
      {tab === 'jobs' && <JobsTab />}

      <p className="mt-10 flex items-center justify-center gap-2 text-sm text-slate-400">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        Admin actions are immediate and cannot be undone.
      </p>
    </div>
  )
}
