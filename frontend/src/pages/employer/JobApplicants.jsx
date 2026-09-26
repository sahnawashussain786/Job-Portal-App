import {
  ArrowLeft,
  ChevronDown,
  FileText,
  Mail,
  MapPin,
  Send,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Link, useParams } from 'react-router-dom'
import Pagination from '../../components/Pagination'
import { Alert, Avatar, EmptyState, PageLoader, StatusBadge } from '../../components/ui'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useFetch from '../../hooks/useFetch'
import { applicationsApi } from '../../lib/api'
import { cn, formatDate, timeAgo, titleCase } from '../../lib/format'

/** Statuses an employer can move an application to, in a sensible order. */
const NEXT_STATUSES = ['pending', 'reviewed', 'shortlisted', 'interview', 'offered', 'hired', 'rejected']

export default function JobApplicants() {
  const { jobId } = useParams()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const { data, loading, error, reload } = useFetch(
    () => applicationsApi.forJob(jobId, { status: status || undefined, page, limit: 10 }),
    [jobId, status, page],
  )

  const job = data?.job
  useDocumentTitle(job ? `Applicants · ${job.title}` : 'Applicants')

  const applications = data?.applications || []

  async function updateStatus(application, nextStatus, note) {
    setBusyId(application._id)
    try {
      await applicationsApi.updateStatus(application._id, { status: nextStatus, note })
      toast.success(`Marked as ${nextStatus}`)
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/employer/jobs" className="btn-ghost mb-6 -ml-2">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to postings
      </Link>

      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {loading && !job ? 'Applicants' : job?.title || 'Applicants'}
        </h1>
        <p className="mt-1.5 text-slate-600">
          {data?.meta?.total ?? 0} application{data?.meta?.total === 1 ? '' : 's'} received
          {job && (
            <>
              {' · '}
              <Link to={`/jobs/${job._id}`} className="font-medium text-brand-600 hover:underline">
                view posting
              </Link>
            </>
          )}
        </p>
      </header>

      {/* Status filter */}
      <div className="mb-6 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            setStatus('')
            setPage(1)
          }}
          className={cn(
            'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
            status === '' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
          )}
        >
          All
        </button>
        {NEXT_STATUSES.map((value) => (
          <button
            key={value}
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
            {titleCase(value)}
          </button>
        ))}
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
          {applications.map((application) => {
            const applicant = application.applicant
            const isOpen = expanded === application._id

            return (
              <article key={application._id} className="card overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                  <div className="flex min-w-0 flex-1 gap-4">
                    <Avatar user={applicant} />

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-slate-900">{applicant?.name || 'Candidate'}</h2>
                        <StatusBadge status={application.status} />
                      </div>

                      <p className="mt-0.5 text-sm text-slate-600">{applicant?.headline || 'No headline'}</p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                          <a href={`mailto:${applicant?.email}`} className="hover:text-brand-600">
                            {applicant?.email}
                          </a>
                        </span>
                        {applicant?.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                            {applicant.location}
                          </span>
                        )}
                        <span>Applied {timeAgo(application.createdAt)}</span>
                      </div>

                      {applicant?.skills?.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {applicant.skills.slice(0, 6).map((skill) => (
                            <span key={skill} className="chip bg-slate-100 text-slate-600">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {application.resume?.url && (
                      <a
                        href={application.resume.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="btn-secondary"
                      >
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        Resume
                      </a>
                    )}

                    <select
                      value={application.status}
                      onChange={(event) => updateStatus(application, event.target.value)}
                      disabled={busyId === application._id}
                      aria-label={`Update status for ${applicant?.name}`}
                      className="input w-auto py-2 capitalize"
                    >
                      {NEXT_STATUSES.map((value) => (
                        <option key={value} value={value}>
                          {titleCase(value)}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : application._id)}
                      className="btn-ghost px-2.5"
                      aria-expanded={isOpen}
                      aria-label={isOpen ? 'Hide details' : 'Show details'}
                    >
                      <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50 p-5">
                    {application.coverLetter ? (
                      <div>
                        <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Cover letter</h3>
                        <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-slate-700">
                          {application.coverLetter}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No cover letter was submitted.</p>
                    )}

                    {application.expectedSalary ? (
                      <p className="mt-4 text-sm text-slate-600">
                        <span className="text-slate-400">Expected salary:</span>{' '}
                        {application.expectedSalary.toLocaleString()}
                      </p>
                    ) : null}

                    <div className="mt-5">
                      <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">History</h3>
                      <ol className="mt-3 space-y-3">
                        {(application.timeline || []).map((entry, index) => (
                          <li key={index} className="flex gap-3">
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                            <div>
                              <p className="text-sm font-medium text-slate-700">{titleCase(entry.status)}</p>
                              <p className="text-xs text-slate-500">
                                {entry.note} · {formatDate(entry.changedAt)}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-200 pt-5">
                      <button
                        type="button"
                        onClick={() => updateStatus(application, 'shortlisted', 'Moved to shortlist')}
                        className="btn-primary"
                      >
                        <UserCheck className="h-4 w-4" aria-hidden="true" />
                        Shortlist
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(application, 'interview', 'Invited to interview')}
                        className="btn-secondary"
                      >
                        <Send className="h-4 w-4" aria-hidden="true" />
                        Invite to interview
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(application, 'rejected', 'Not moving forward')}
                        className="btn-secondary text-rose-600"
                      >
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </article>
            )
          })}

          {applications.length === 0 && (
            <EmptyState
              icon={Users}
              title={status ? `No ${titleCase(status)} applicants` : 'No applicants yet'}
              description={
                status
                  ? 'Try another status filter.'
                  : 'Share your posting to start receiving applications. They will appear here.'
              }
            />
          )}
        </div>
      )}

      <Pagination meta={data?.meta} onPageChange={setPage} className="mt-8" />
    </div>
  )
}
