import {
  ArrowLeft,
  Bookmark,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  Globe,
  Layers,
  MapPin,
  Send,
  Share2,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ApplyModal from '../components/ApplyModal'
import { Alert, CompanyLogo, PageLoader, StatusBadge } from '../components/ui'
import { useAuth } from '../context/authContext'
import useDocumentTitle from '../hooks/useDocumentTitle'
import useFetch from '../hooks/useFetch'
import { jobsApi } from '../lib/api'
import { cn, deadlineLabel, formatDate, formatSalary, timeAgo, titleCase } from '../lib/format'

/** A titled bulleted section (Responsibilities / Requirements / Benefits). */
function ListSection({ title, items, icon: Icon }) {
  if (!items?.length) return null
  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
        <Icon className="h-4 w-4 text-brand-600" aria-hidden="true" />
        {title}
      </h2>
      <ul className="mt-3 space-y-2.5">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Label/value pair in the detail header. */
function Fact({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="truncate text-sm font-medium text-slate-700">{value}</p>
      </div>
    </div>
  )
}

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  const { data, loading, error, setData } = useFetch(() => jobsApi.detail(id), [id])
  const [applyOpen, setApplyOpen] = useState(false)
  const [savingInFlight, setSavingInFlight] = useState(false)

  const job = data?.job
  useDocumentTitle(job ? `${job.title} at ${job.company?.name}` : 'Job')

  if (loading) return <PageLoader label="Loading job…" />

  if (error || !job) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <Alert variant="error" title="Job not available">
          {error?.message || 'This job could not be found.'}
        </Alert>
        <Link to="/jobs" className="btn-secondary mt-6">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to all jobs
        </Link>
      </div>
    )
  }

  const isOwner = user && (String(job.postedBy?._id || job.postedBy) === String(user._id) || user.role === 'admin')
  const canApply = !isOwner && (!user || user.role === 'jobseeker')
  const deadline = deadlineLabel(job.deadline)
  const closed = job.status !== 'open'

  async function handleSave() {
    if (!isAuthenticated) {
      toast.error('Sign in to save jobs')
      navigate('/login', { state: { from: `/jobs/${id}` } })
      return
    }

    setSavingInFlight(true)
    const previous = data.isSaved
    setData({ ...data, isSaved: !previous })

    try {
      const result = await jobsApi.toggleSave(job._id)
      setData((current) => ({ ...current, isSaved: result.isSaved }))
      toast.success(result.message)
    } catch (err) {
      setData((current) => ({ ...current, isSaved: previous }))
      toast.error(err.message)
    } finally {
      setSavingInFlight(false)
    }
  }

  async function handleShare() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: job.title, url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied to clipboard')
      }
    } catch {
      // The user dismissed the share sheet — nothing to report.
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <button type="button" onClick={() => navigate(-1)} className="btn-ghost mb-6 -ml-2">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back
      </button>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* --------------------------------------------------------- Main column */}
        <div className="min-w-0 space-y-6">
          <div className="card p-6 sm:p-8">
            <div className="flex flex-wrap items-start gap-5">
              <CompanyLogo company={job.company} size="lg" />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={job.status} />
                  {job.isFeatured && <span className="chip bg-amber-50 text-amber-700">Featured</span>}
                  {data.hasApplied && (
                    <span className="chip bg-brand-50 text-brand-700">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      You applied
                    </span>
                  )}
                </div>

                <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{job.title}</h1>

                <p className="mt-1.5 text-slate-600">
                  <Link to={`/companies/${job.company?.slug || job.company?._id}`} className="font-medium text-brand-600 hover:underline">
                    {job.company?.name}
                  </Link>
                  {job.category ? ` · ${job.category}` : ''}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    {job.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    Posted {timeAgo(job.publishedAt || job.createdAt)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    {job.applicationCount} applicant{job.applicationCount === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            </div>

            {/* Key facts grid */}
            <dl className="mt-7 grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
              <Fact icon={DollarSign} label="Salary" value={formatSalary(job.salary)} />
              <Fact icon={Briefcase} label="Employment type" value={titleCase(job.employmentType)} />
              <Fact icon={Layers} label="Experience" value={titleCase(job.experienceLevel)} />
              <Fact icon={MapPin} label="Work mode" value={titleCase(job.workMode)} />
            </dl>

            {/* Jobs have two ways to be unavailable: status or deadline. */}
            {(closed || deadline?.urgent) && (
              <Alert
                variant={closed ? 'warning' : 'info'}
                className="mt-6"
                title={closed ? 'This job is no longer open' : deadline.text}
              >
                {closed
                  ? 'The employer has closed this posting. You can still browse similar roles below.'
                  : 'Submit your application soon to be considered.'}
              </Alert>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              {canApply && (
                <button
                  type="button"
                  onClick={() => (isAuthenticated ? setApplyOpen(true) : navigate('/login', { state: { from: `/jobs/${id}` } }))}
                  disabled={closed || data.hasApplied || deadline?.text === 'Deadline passed'}
                  className="btn-primary px-6 py-3"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {data.hasApplied ? 'Already applied' : closed ? 'Applications closed' : 'Apply now'}
                </button>
              )}

              {isOwner && (
                <Link to={`/employer/jobs/${job._id}/edit`} className="btn-secondary px-6 py-3">
                  Edit posting
                </Link>
              )}

              {canApply && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={savingInFlight}
                  className={cn('btn-secondary px-5 py-3', data.isSaved && 'border-brand-300 text-brand-700')}
                >
                  <Bookmark className={cn('h-4 w-4', data.isSaved && 'fill-current')} aria-hidden="true" />
                  {data.isSaved ? 'Saved' : 'Save job'}
                </button>
              )}

              <button type="button" onClick={handleShare} className="btn-secondary px-5 py-3">
                <Share2 className="h-4 w-4" aria-hidden="true" />
                Share
              </button>
            </div>
          </div>

          {/* ------------------------------------------------------ Description */}
          <div className="card p-6 sm:p-8">
            <h2 className="text-base font-bold text-slate-900">About the role</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed whitespace-pre-line text-slate-600">
              {job.description}
            </div>

            <ListSection title="What you'll do" items={job.responsibilities} icon={Briefcase} />
            <ListSection title="What we're looking for" items={job.requirements} icon={CheckCircle2} />
            <ListSection title="Benefits" items={job.benefits} icon={CheckCircle2} />

            {job.skills?.length > 0 && (
              <section className="mt-8">
                <h2 className="text-base font-bold text-slate-900">Skills</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <span key={skill} className="chip bg-brand-50 text-brand-700">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className="mt-8 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
              <div className="flex items-center gap-2.5 text-sm text-slate-600">
                <CalendarClock className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <span>
                  <span className="text-slate-400">Posted:</span> {formatDate(job.publishedAt || job.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-slate-600">
                <CalendarClock className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <span>
                  <span className="text-slate-400">Deadline:</span>{' '}
                  {job.deadline ? formatDate(job.deadline) : 'Open until filled'}
                </span>
              </div>
            </section>
          </div>
        </div>

        {/* ------------------------------------------------------------- Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-6">
            <h2 className="text-sm font-bold text-slate-900">About the company</h2>

            <div className="mt-4 flex items-center gap-3">
              <CompanyLogo company={job.company} />
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{job.company?.name}</p>
                <p className="truncate text-xs text-slate-500">{job.company?.industry || 'Industry not listed'}</p>
              </div>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              {job.company?.location && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <div>
                    <dt className="text-xs text-slate-400">Headquarters</dt>
                    <dd className="text-slate-700">{job.company.location}</dd>
                  </div>
                </div>
              )}
              {job.company?.companySize && (
                <div className="flex items-start gap-2.5">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <div>
                    <dt className="text-xs text-slate-400">Company size</dt>
                    <dd className="text-slate-700">{job.company.companySize} employees</dd>
                  </div>
                </div>
              )}
              {job.company?.website && (
                <div className="flex items-start gap-2.5">
                  <Globe className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <div className="min-w-0">
                    <dt className="text-xs text-slate-400">Website</dt>
                    <dd>
                      <a
                        href={job.company.website}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 truncate text-brand-600 hover:underline"
                      >
                        Visit site
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    </dd>
                  </div>
                </div>
              )}
              {job.company?.isVerified && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Verified employer
                </div>
              )}
            </dl>

            <Link to={`/companies/${job.company?.slug || job.company?._id}`} className="btn-secondary mt-5 w-full">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              View company profile
            </Link>
          </div>

          <div className="card p-6">
            <h2 className="text-sm font-bold text-slate-900">Job overview</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ['Openings', job.openings > 1 ? `${job.openings} positions` : '1 position'],
                ['Category', job.category],
                ['Employment', titleCase(job.employmentType)],
                ['Work mode', titleCase(job.workMode)],
                ['Experience', titleCase(job.experienceLevel)],
                ['Views', job.views],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="text-right font-medium text-slate-800">{value ?? '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>

      {/* Mounted only while open so the form starts from a clean state. */}
      {applyOpen && (
        <ApplyModal
          job={job}
          onClose={() => setApplyOpen(false)}
          onApplied={() => setData((current) => ({ ...current, hasApplied: true }))}
        />
      )}
    </div>
  )
}
