import { Bookmark, Briefcase, CheckCircle2, FileText, Send, TrendingUp, UserCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import JobCard from '../../components/JobCard'
import { Alert, EmptyState, JobCardSkeleton, SectionHeading, StatCard, StatusBadge } from '../../components/ui'
import { useAuth } from '../../context/authContext'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useFetch from '../../hooks/useFetch'
import { applicationsApi, jobsApi } from '../../lib/api'
import { timeAgo } from '../../lib/format'

/** Completion checklist shown until the profile is "good enough to apply". */
function ProfileChecklist({ user }) {
  const checks = [
    { label: 'Add a headline', done: Boolean(user.headline), to: '/profile' },
    { label: 'Upload your resume', done: Boolean(user.resume?.url), to: '/profile' },
    { label: 'List at least 3 skills', done: (user.skills?.length || 0) >= 3, to: '/profile' },
    { label: 'Write a short bio', done: Boolean(user.bio), to: '/profile' },
  ]

  const completed = checks.filter((check) => check.done).length
  const percent = Math.round((completed / checks.length) * 100)

  if (percent === 100) return null

  return (
    <div className="card p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <UserCircle2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-slate-900">Finish your profile</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            A complete profile helps employers take your application seriously.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-xs font-semibold text-slate-600">{percent}%</span>
          </div>

          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {checks.map((check) => (
              <li key={check.label} className="flex items-center gap-2 text-sm">
                <CheckCircle2
                  className={check.done ? 'h-4 w-4 shrink-0 text-emerald-500' : 'h-4 w-4 shrink-0 text-slate-300'}
                  aria-hidden="true"
                />
                <span className={check.done ? 'text-slate-400 line-through' : 'text-slate-600'}>{check.label}</span>
              </li>
            ))}
          </ul>

          <Link to="/profile" className="btn-primary mt-5">
            Update profile
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  useDocumentTitle('Dashboard')
  const { user } = useAuth()

  const { data: statsData, loading: statsLoading } = useFetch(() => applicationsApi.myStats(), [])
  const { data: savedData } = useFetch(() => jobsApi.saved({ limit: 3 }), [])
  const { data: recommendedData, loading: recommendedLoading } = useFetch(
    () => jobsApi.list({ limit: 4, sort: 'recent' }),
    [],
  )

  const stats = statsData?.stats
  const savedJobs = savedData?.jobs || []
  const recommended = recommendedData?.jobs || []

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="mt-1.5 text-slate-600">Here's where your job search stands today.</p>
      </header>

      <div className="space-y-8">
        <ProfileChecklist user={user} />

        {/* KPI row */}
        <section>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total applications"
              value={statsLoading ? '—' : stats?.total ?? 0}
              icon={Send}
              tone="brand"
            />
            <StatCard
              label="In progress"
              value={statsLoading ? '—' : stats?.inProgress ?? 0}
              icon={TrendingUp}
              tone="amber"
              hint="Reviewed, shortlisted or interviewing"
            />
            <StatCard
              label="Offers"
              value={statsLoading ? '—' : stats?.offered ?? 0}
              icon={CheckCircle2}
              tone="green"
            />
            <StatCard label="Saved jobs" value={savedJobs.length ? savedData?.meta?.total ?? savedJobs.length : 0} icon={Bookmark} tone="slate" />
          </div>
        </section>

        {/* Applications + saved jobs */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card p-6">
            <SectionHeading
              title="Recent applications"
              action={
                <Link to="/dashboard/applications" className="text-sm font-semibold text-brand-600 hover:underline">
                  View all
                </Link>
              }
            />

            <div className="mt-5 space-y-3">
              {(stats?.recent || []).map((application) => (
                <div
                  key={application._id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-3.5"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/jobs/${application.job?._id}`}
                      className="block truncate text-sm font-semibold text-slate-800 hover:text-brand-600"
                    >
                      {application.job?.title || 'Job removed'}
                    </Link>
                    <p className="truncate text-xs text-slate-500">
                      {application.job?.company?.name} · applied {timeAgo(application.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={application.status} />
                </div>
              ))}

              {stats && stats.recent.length === 0 && (
                <EmptyState
                  icon={Send}
                  title="No applications yet"
                  description="Find a role you like and apply — we'll track it here."
                  action={
                    <Link to="/jobs" className="btn-primary">
                      Browse jobs
                    </Link>
                  }
                  className="border-0 py-8"
                />
              )}
            </div>
          </section>

          <section className="card p-6">
            <SectionHeading
              title="Saved jobs"
              action={
                <Link to="/dashboard/saved" className="text-sm font-semibold text-brand-600 hover:underline">
                  View all
                </Link>
              }
            />

            <div className="mt-5 space-y-3">
              {savedJobs.map((job) => (
                <Link
                  key={job._id}
                  to={`/jobs/${job._id}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-3.5 transition-colors hover:border-brand-300"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{job.title}</p>
                    <p className="truncate text-xs text-slate-500">
                      {job.company?.name} · {job.location}
                    </p>
                  </div>
                  <Briefcase className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
                </Link>
              ))}

              {savedJobs.length === 0 && (
                <EmptyState
                  icon={Bookmark}
                  title="Nothing saved yet"
                  description="Tap the bookmark icon on any job to keep it here."
                  className="border-0 py-8"
                />
              )}
            </div>
          </section>
        </div>

        {/* Recommended */}
        <section>
          <SectionHeading
            title="Recommended for you"
            description="Fresh roles posted recently."
            action={
              <Link to="/jobs" className="btn-secondary">
                See all jobs
              </Link>
            }
          />

          <div className="mt-5 grid gap-4">
            {recommendedLoading
              ? Array.from({ length: 3 }, (_, index) => <JobCardSkeleton key={index} />)
              : recommended.map((job) => <JobCard key={job._id} job={job} />)}
          </div>

          {!recommendedLoading && recommended.length === 0 && (
            <Alert variant="info" className="mt-5">
              No jobs have been posted yet. Run <code className="rounded bg-white px-1">npm run seed</code> to load demo
              data.
            </Alert>
          )}
        </section>

        <div className="flex flex-wrap gap-3">
          <Link to="/jobs" className="btn-primary">
            <Briefcase className="h-4 w-4" aria-hidden="true" />
            Find more jobs
          </Link>
          <Link to="/profile" className="btn-secondary">
            <FileText className="h-4 w-4" aria-hidden="true" />
            Manage resume
          </Link>
        </div>
      </div>
    </div>
  )
}
