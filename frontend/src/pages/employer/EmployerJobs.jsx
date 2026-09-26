import { Briefcase, Edit3, Eye, PlusCircle, Search, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Link } from 'react-router-dom'
import Pagination from '../../components/Pagination'
import { Alert, EmptyState, PageLoader, StatusBadge } from '../../components/ui'
import useDebounce from '../../hooks/useDebounce'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useFetch from '../../hooks/useFetch'
import { jobsApi } from '../../lib/api'
import { cn, formatDate, titleCase } from '../../lib/format'

const STATUS_TABS = ['', 'open', 'draft', 'closed', 'archived']

export default function EmployerJobs() {
  useDocumentTitle('Manage jobs')
  const [status, setStatus] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState(null)

  const debouncedQuery = useDebounce(query, 400)

  const { data, loading, error, reload } = useFetch(
    () => jobsApi.mine({ status: status || undefined, q: debouncedQuery || undefined, page, limit: 10 }),
    [status, debouncedQuery, page],
  )

  const jobs = data?.jobs || []

  async function handleDelete(job) {
    const confirmed = window.confirm(
      `Delete "${job.title}"? This also removes its ${job.applicationCount} application(s) and cannot be undone.`,
    )
    if (!confirmed) return

    setDeletingId(job._id)
    try {
      await jobsApi.remove(job._id)
      toast.success('Job deleted')
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  async function toggleStatus(job) {
    const next = job.status === 'open' ? 'closed' : 'open'
    try {
      await jobsApi.update(job._id, { status: next })
      toast.success(next === 'open' ? 'Job reopened' : 'Job closed')
      reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Your job postings</h1>
          <p className="mt-1.5 text-slate-600">Edit, close or review applications for each role.</p>
        </div>
        <Link to="/employer/jobs/new" className="btn-primary">
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          Post a job
        </Link>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          {STATUS_TABS.map((value) => (
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

        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            placeholder="Search by title"
            aria-label="Search your jobs"
            className="input pl-9"
          />
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error.message}
        </Alert>
      )}

      {loading && !data ? (
        <PageLoader />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <article key={job._id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/jobs/${job._id}`} className="text-base font-semibold text-slate-900 hover:text-brand-600">
                      {job.title}
                    </Link>
                    <StatusBadge status={job.status} />
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>{job.location}</span>
                    <span className="text-slate-300">•</span>
                    <span>{titleCase(job.employmentType)}</span>
                    <span className="text-slate-300">•</span>
                    <span>{titleCase(job.workMode)}</span>
                    <span className="text-slate-300">•</span>
                    <span>Posted {formatDate(job.createdAt)}</span>
                    {job.deadline && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>Closes {formatDate(job.deadline)}</span>
                      </>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                      <Users className="h-3.5 w-3.5" aria-hidden="true" />
                      {job.applicationCount} applicant{job.applicationCount === 1 ? '' : 's'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      {job.views} views
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link to={`/employer/jobs/${job._id}/applicants`} className="btn-primary">
                    <Users className="h-4 w-4" aria-hidden="true" />
                    Applicants
                  </Link>
                  <Link to={`/employer/jobs/${job._id}/edit`} className="btn-secondary">
                    <Edit3 className="h-4 w-4" aria-hidden="true" />
                    Edit
                  </Link>
                  <button type="button" onClick={() => toggleStatus(job)} className="btn-secondary">
                    {job.status === 'open' ? 'Close' : 'Reopen'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(job)}
                    disabled={deletingId === job._id}
                    className="btn-ghost px-2.5 text-rose-600 hover:bg-rose-50"
                    aria-label={`Delete ${job.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}

          {jobs.length === 0 && (
            <EmptyState
              icon={Briefcase}
              title={query || status ? 'No matching postings' : 'You have no job postings yet'}
              description={
                query || status
                  ? 'Try clearing the search or status filter.'
                  : 'Post your first role and it will appear here with its applicants.'
              }
              action={
                <Link to="/employer/jobs/new" className="btn-primary">
                  <PlusCircle className="h-4 w-4" aria-hidden="true" />
                  Post a job
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
