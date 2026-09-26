import { Bookmark, Briefcase, CheckCircle2, Clock, MapPin, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/authContext'
import { jobsApi } from '../lib/api'
import { cn, deadlineLabel, formatSalary, timeAgo, titleCase } from '../lib/format'
import { CompanyLogo } from './ui'

/** Small labelled pill used for the job's key facts. */
function MetaChip({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
      <Icon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
      {children}
    </span>
  )
}

export default function JobCard({ job, onSaveChange, className }) {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  const [saved, setSaved] = useState(Boolean(job.isSaved))
  const [savingInFlight, setSavingInFlight] = useState(false)

  const deadline = deadlineLabel(job.deadline)
  const jobId = job._id || job.id

  async function handleSave(event) {
    // The whole card is wrapped in a Link — stop the click from navigating.
    event.preventDefault()
    event.stopPropagation()

    if (!isAuthenticated) {
      toast.error('Sign in to save jobs')
      navigate('/login', { state: { from: `/jobs/${jobId}` } })
      return
    }

    setSavingInFlight(true)
    const optimistic = !saved
    setSaved(optimistic)

    try {
      const result = await jobsApi.toggleSave(jobId)
      setSaved(result.isSaved)
      toast.success(result.message)
      onSaveChange?.(jobId, result.isSaved)
    } catch (error) {
      setSaved(!optimistic) // roll back
      toast.error(error.message)
    } finally {
      setSavingInFlight(false)
    }
  }

  const canApply = !user || user.role === 'jobseeker'

  return (
    <Link
      to={`/jobs/${jobId}`}
      className={cn(
        'card group block p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md',
        className,
      )}
    >
      <div className="flex gap-4">
        <CompanyLogo company={job.company} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-semibold text-slate-900 transition-colors group-hover:text-brand-700">
                  {job.title}
                </h3>
                {job.isFeatured && (
                  <span className="chip bg-amber-50 text-amber-700" title="Featured job">
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                    Featured
                  </span>
                )}
              </div>

              <p className="mt-0.5 truncate text-sm text-slate-500">
                {job.company?.name || 'Confidential company'}
                {job.category ? ` · ${job.category}` : ''}
              </p>
            </div>

            {canApply && (
              <button
                type="button"
                onClick={handleSave}
                disabled={savingInFlight}
                aria-label={saved ? 'Remove from saved jobs' : 'Save this job'}
                aria-pressed={saved}
                className={cn(
                  'shrink-0 rounded-lg p-2 transition-colors disabled:opacity-50',
                  saved ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600',
                )}
              >
                <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <MetaChip icon={MapPin}>{job.location || 'Unspecified'}</MetaChip>
            <MetaChip icon={Briefcase}>{titleCase(job.employmentType)}</MetaChip>
            <MetaChip icon={Clock}>{timeAgo(job.publishedAt || job.createdAt)}</MetaChip>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <span className="chip bg-emerald-50 text-emerald-700">
              {job.salary?.isVisible === false ? 'Salary not disclosed' : formatSalary(job.salary)}
            </span>
            <span className="chip bg-slate-100 text-slate-600">{titleCase(job.workMode)}</span>
            <span className="chip bg-slate-100 text-slate-600">{titleCase(job.experienceLevel)}</span>

            {deadline && (
              <span className={cn('chip', deadline.urgent ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600')}>
                {deadline.text}
              </span>
            )}

            {job.hasApplied && (
              <span className="chip bg-brand-50 text-brand-700">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                Applied
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
