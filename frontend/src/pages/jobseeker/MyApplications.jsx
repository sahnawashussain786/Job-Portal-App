import { Briefcase, Filter, Send, XCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Link } from 'react-router-dom'
import Pagination from '../../components/Pagination'
import { Alert, CompanyLogo, EmptyState, PageLoader, StatusBadge } from '../../components/ui'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useFetch from '../../hooks/useFetch'
import { applicationsApi } from '../../lib/api'
import { cn, formatDate, timeAgo, titleCase } from '../../lib/format'

const STATUS_FILTERS = ['', 'pending', 'reviewed', 'shortlisted', 'interview', 'offered', 'hired', 'rejected', 'withdrawn']

export default function MyApplications() {
  useDocumentTitle('My applications')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState(null)

  const { data, loading, error, reload } = useFetch(
    () => applicationsApi.mine({ status: status || undefined, page, limit: 10 }),
    [status, page],
  )

  const applications = data?.applications || []

  async function handleWithdraw(application) {
    if (!window.confirm(`Withdraw your application for "${application.job?.title}"?`)) return

    setBusyId(application._id)
    try {
      await applicationsApi.withdraw(application._id)
      toast.success('Application withdrawn')
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">My applications</h1>
          <p className="mt-1.5 text-slate-600">Track the status of everything you've applied to.</p>
        </div>
        <Link to="/jobs" className="btn-primary">
          <Briefcase className="h-4 w-4" aria-hidden="true" />
          Find more jobs
        </Link>
      </header>

      {/* Status filter */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        {STATUS_FILTERS.map((value) => (
          <button
            key={value || 'all'}
            type="button"
            onClick={() => {
              setStatus(value)
              setPage(1)
            }}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
              status === value ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
            )}
          >
            {value ? titleCase(value) : 'All'}
          </button>
        ))}
      </div>

      {error && <Alert variant="error" className="mb-6">{error.message}</Alert>}

      {loading && !data ? (
        <PageLoader />
      ) : (
        <div className="space-y-4">
          {applications.map((application) => {
            const job = application.job
            const canWithdraw = !['withdrawn', 'hired', 'rejected'].includes(application.status)

            return (
              <article key={application._id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 gap-4">
                    <CompanyLogo company={job?.company} />

                    <div className="min-w-0">
                      <Link
                        to={job?._id ? `/jobs/${job._id}` : '#'}
                        className="text-base font-semibold text-slate-900 hover:text-brand-600"
                      >
                        {job?.title || 'Job no longer available'}
                      </Link>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {job?.company?.name || 'Company unavailable'}
                        {job?.location ? ` · ${job.location}` : ''}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>Applied {timeAgo(application.createdAt)}</span>
                        <span className="text-slate-300">•</span>
                        <span>{formatDate(application.createdAt)}</span>
                        {application.expectedSalary ? (
                          <>
                            <span className="text-slate-300">•</span>
                            <span>Expected {application.expectedSalary.toLocaleString()}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusBadge status={application.status} />

                    {canWithdraw && (
                      <button
                        type="button"
                        onClick={() => handleWithdraw(application)}
                        disabled={busyId === application._id}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 transition-colors hover:text-rose-600 disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>

                {application.coverLetter && (
                  <p className="mt-4 line-clamp-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                    {application.coverLetter}
                  </p>
                )}

                {application.employerNote && (
                  <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3">
                    <p className="text-xs font-semibold text-sky-700">Note from the employer</p>
                    <p className="mt-1 text-sm text-sky-900">{application.employerNote}</p>
                  </div>
                )}
              </article>
            )
          })}

          {applications.length === 0 && (
            <EmptyState
              icon={Send}
              title={status ? `No ${titleCase(status)} applications` : 'No applications yet'}
              description={
                status
                  ? 'Try a different status filter, or apply to more roles.'
                  : "When you apply for a job it'll show up here with its status."
              }
              action={
                <Link to="/jobs" className="btn-primary">
                  Browse jobs
                </Link>
              }
            />
          )}
        </div>
      )}

      <Pagination meta={data?.meta} onPageChange={setPage} className="mt-8" />
    </div>
  )
}
