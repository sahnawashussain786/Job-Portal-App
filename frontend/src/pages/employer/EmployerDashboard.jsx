import { Briefcase, CheckCircle2, Eye, PlusCircle, Send, TrendingUp, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Alert, Avatar, EmptyState, SectionHeading, StatCard, StatusBadge } from '../../components/ui'
import { useAuth } from '../../context/authContext'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useFetch from '../../hooks/useFetch'
import { jobsApi } from '../../lib/api'
import { timeAgo } from '../../lib/format'

export default function EmployerDashboard() {
  useDocumentTitle('Employer hub')
  const { user } = useAuth()
  const { data, loading, error } = useFetch(() => jobsApi.employerStats(), [])

  const stats = data?.stats
  const recent = stats?.recentApplications || []
  const hasCompany = Boolean(user?.company)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {user?.company?.name || 'Employer'} hiring hub
          </h1>
          <p className="mt-1.5 text-slate-600">Track your postings and the candidates coming through.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/employer/jobs" className="btn-secondary">
            <Briefcase className="h-4 w-4" aria-hidden="true" />
            Manage jobs
          </Link>
          <Link to="/employer/jobs/new" className="btn-primary">
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            Post a job
          </Link>
        </div>
      </header>

      {error && (
        <Alert variant="error" className="mb-6">
          {error.message}
        </Alert>
      )}

      {!hasCompany && (
        <Alert variant="warning" className="mb-6" title="Set up your company profile">
          You need a company profile before candidates can see who they're applying to.{' '}
          <Link to="/employer/company" className="font-semibold underline">
            Create it now
          </Link>
          .
        </Alert>
      )}

      <div className="space-y-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Open roles" value={loading ? '—' : stats?.openJobs ?? 0} icon={Briefcase} tone="brand" />
          <StatCard
            label="Total applications"
            value={loading ? '—' : stats?.totalApplications ?? 0}
            icon={Send}
            tone="amber"
          />
          <StatCard
            label="Awaiting review"
            value={loading ? '—' : stats?.pendingApplications ?? 0}
            icon={TrendingUp}
            tone="rose"
            hint="Still marked as pending"
          />
          <StatCard label="Hired" value={loading ? '—' : stats?.hired ?? 0} icon={CheckCircle2} tone="green" />
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Job views" value={loading ? '—' : stats?.totalViews ?? 0} icon={Eye} tone="slate" />
          <StatCard label="In progress" value={loading ? '—' : stats?.shortlisted ?? 0} icon={Users} tone="brand" hint="Shortlisted or interviewing" />
          <StatCard
            label="Draft postings"
            value={loading ? '—' : stats?.draftJobs ?? 0}
            icon={Briefcase}
            tone="slate"
          />
        </section>

        <section className="card p-6">
          <SectionHeading
            title="Recent applications"
            description="The five most recent candidates across all your postings."
            action={
              <Link to="/employer/jobs" className="text-sm font-semibold text-brand-600 hover:underline">
                All postings
              </Link>
            }
          />

          <div className="mt-5 space-y-3">
            {recent.map((application) => (
              <div
                key={application._id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar user={application.applicant} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {application.applicant?.name || 'Candidate'}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {application.applicant?.headline || application.applicant?.email || '—'}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      Applied for{' '}
                      <Link
                        to={`/employer/jobs/${application.job?._id}/applicants`}
                        className="font-medium text-brand-600 hover:underline"
                      >
                        {application.job?.title || 'a role'}
                      </Link>{' '}
                      · {timeAgo(application.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={application.status} />
                  <Link to={`/employer/jobs/${application.job?._id}/applicants`} className="btn-secondary">
                    Review
                  </Link>
                </div>
              </div>
            ))}

            {stats && recent.length === 0 && (
              <EmptyState
                icon={Send}
                title="No applications yet"
                description="Once candidates apply to your postings they'll appear here."
                action={
                  <Link to="/employer/jobs/new" className="btn-primary">
                    Post your first job
                  </Link>
                }
                className="border-0 py-8"
              />
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
