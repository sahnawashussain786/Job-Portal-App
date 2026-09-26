import { AlertTriangle, ArrowLeft, Save, Send, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert, PageLoader, Spinner } from '../../components/ui'
import { useAuth } from '../../context/authContext'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useFetch from '../../hooks/useFetch'
import { jobsApi } from '../../lib/api'
import { titleCase } from '../../lib/format'

const BLANK = {
  title: '',
  category: 'Engineering',
  employmentType: 'full-time',
  workMode: 'onsite',
  experienceLevel: 'mid',
  location: '',
  openings: 1,
  deadline: '',
  description: '',
  responsibilities: '',
  requirements: '',
  benefits: '',
  skills: [],
  salaryMin: '',
  salaryMax: '',
  currency: 'USD',
  period: 'yearly',
  isNegotiable: false,
  isVisible: true,
  status: 'open',
}

/** Array fields are edited as one-item-per-line text; split/join on the way in and out. */
const toLines = (value) => (Array.isArray(value) ? value.join('\n') : value || '')
const fromLines = (value) =>
  String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

const DATE_INPUT = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '')

function Field({ label, hint, children, htmlFor, required }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

export default function JobForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  useDocumentTitle(isEdit ? 'Edit job' : 'Post a job')

  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: metaData } = useFetch(() => jobsApi.filterMeta(), [])
  const { data: jobData, loading: jobLoading } = useFetch(
    () => jobsApi.detail(id),
    [id],
    { enabled: isEdit },
  )

  const [form, setForm] = useState(BLANK)
  const [skillDraft, setSkillDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const meta = metaData?.meta

  // Load existing values when editing. Adjusting state during render is React's
  // recommended alternative to a syncing effect.
  const [syncedJobId, setSyncedJobId] = useState(null)
  const loadedJob = jobData?.job
  if (loadedJob && syncedJobId !== loadedJob._id) {
    setSyncedJobId(loadedJob._id)
    setForm({
      title: loadedJob.title || '',
      category: loadedJob.category || 'Engineering',
      employmentType: loadedJob.employmentType || 'full-time',
      workMode: loadedJob.workMode || 'onsite',
      experienceLevel: loadedJob.experienceLevel || 'mid',
      location: loadedJob.location || '',
      openings: loadedJob.openings || 1,
      deadline: DATE_INPUT(loadedJob.deadline),
      description: loadedJob.description || '',
      responsibilities: toLines(loadedJob.responsibilities),
      requirements: toLines(loadedJob.requirements),
      benefits: toLines(loadedJob.benefits),
      skills: loadedJob.skills || [],
      salaryMin: loadedJob.salary?.min ?? '',
      salaryMax: loadedJob.salary?.max ?? '',
      currency: loadedJob.salary?.currency || 'USD',
      period: loadedJob.salary?.period || 'yearly',
      isNegotiable: Boolean(loadedJob.salary?.isNegotiable),
      isVisible: loadedJob.salary?.isVisible !== false,
      status: loadedJob.status || 'open',
    })
  }

  function update(key) {
    return (event) => {
      const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
      setForm((current) => ({ ...current, [key]: value }))
    }
  }

  function addSkill() {
    const skill = skillDraft.trim()
    if (!skill) return
    if (form.skills.includes(skill)) {
      toast.error('That skill is already added')
      return
    }
    setForm((current) => ({ ...current, skills: [...current.skills, skill] }))
    setSkillDraft('')
  }

  // Client-side guard mirrors the server rule so users get instant feedback.
  const salaryError = useMemo(() => {
    if (form.salaryMin && form.salaryMax && Number(form.salaryMin) > Number(form.salaryMax)) {
      return 'Minimum salary cannot be greater than maximum salary.'
    }
    return null
  }, [form.salaryMin, form.salaryMax])

  async function handleSubmit(event) {
    event.preventDefault()
    if (salaryError) {
      setError(salaryError)
      return
    }

    setSaving(true)
    setError(null)

    const payload = {
      title: form.title,
      category: form.category,
      employmentType: form.employmentType,
      workMode: form.workMode,
      experienceLevel: form.experienceLevel,
      location: form.location || 'Remote',
      openings: Number(form.openings) || 1,
      deadline: form.deadline || undefined,
      description: form.description,
      responsibilities: fromLines(form.responsibilities),
      requirements: fromLines(form.requirements),
      benefits: fromLines(form.benefits),
      skills: form.skills,
      status: form.status,
      salary: {
        min: form.salaryMin ? Number(form.salaryMin) : undefined,
        max: form.salaryMax ? Number(form.salaryMax) : undefined,
        currency: form.currency,
        period: form.period,
        isNegotiable: form.isNegotiable,
        isVisible: form.isVisible,
      },
    }

    try {
      if (isEdit) {
        await jobsApi.update(id, payload)
        toast.success('Job updated')
        navigate('/employer/jobs')
      } else {
        const result = await jobsApi.create(payload)
        toast.success('Job posted')
        navigate(`/jobs/${result.job._id}`)
      }
    } catch (err) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaving(false)
    }
  }

  if (isEdit && jobLoading) return <PageLoader label="Loading job…" />

  const categories = meta?.categories || [form.category]
  const employmentTypes = meta?.employmentTypes || [form.employmentType]
  const workModes = meta?.workModes || [form.workMode]
  const experienceLevels = meta?.experienceLevels || [form.experienceLevel]

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/employer/jobs" className="btn-ghost mb-6 -ml-2">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to postings
      </Link>

      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {isEdit ? 'Edit job posting' : 'Post a new job'}
        </h1>
        <p className="mt-1.5 text-slate-600">
          {isEdit
            ? 'Changes go live immediately for open postings.'
            : 'Describe the role clearly — detailed postings get far more qualified applicants.'}
        </p>
      </header>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {!user?.company && (
        <Alert variant="warning" className="mb-6" title="No company profile yet">
          <Link to="/employer/company" className="font-semibold underline">
            Create your company profile
          </Link>{' '}
          first — candidates need to know who is hiring.
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ------------------------------------------------------- Basics */}
        <section className="card p-6">
          <h2 className="mb-5 font-semibold text-slate-900">Role basics</h2>

          <div className="space-y-5">
            <Field label="Job title" htmlFor="job-title" required>
              <input
                id="job-title"
                type="text"
                required
                maxLength={140}
                value={form.title}
                onChange={update('title')}
                placeholder="Senior Frontend Engineer"
                className="input"
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Category" htmlFor="job-category">
                <select id="job-category" value={form.category} onChange={update('category')} className="input">
                  {categories.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Employment type" htmlFor="job-type">
                <select id="job-type" value={form.employmentType} onChange={update('employmentType')} className="input">
                  {employmentTypes.map((option) => (
                    <option key={option} value={option}>
                      {titleCase(option)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Work mode" htmlFor="job-mode">
                <select id="job-mode" value={form.workMode} onChange={update('workMode')} className="input">
                  {workModes.map((option) => (
                    <option key={option} value={option}>
                      {titleCase(option)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Experience level" htmlFor="job-level">
                <select id="job-level" value={form.experienceLevel} onChange={update('experienceLevel')} className="input">
                  {experienceLevels.map((option) => (
                    <option key={option} value={option}>
                      {titleCase(option)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Location" htmlFor="job-location">
                <input
                  id="job-location"
                  type="text"
                  value={form.location}
                  onChange={update('location')}
                  placeholder="Austin, TX or Remote"
                  className="input"
                />
              </Field>

              <Field label="Number of openings" htmlFor="job-openings">
                <input
                  id="job-openings"
                  type="number"
                  min="1"
                  max="999"
                  value={form.openings}
                  onChange={update('openings')}
                  className="input"
                />
              </Field>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------- Description */}
        <section className="card p-6">
          <h2 className="mb-5 font-semibold text-slate-900">Description</h2>

          <div className="space-y-5">
            <Field label="About the role" htmlFor="job-description" required>
              <textarea
                id="job-description"
                rows={7}
                required
                value={form.description}
                onChange={update('description')}
                placeholder="What the team does, what this person will own, and why the role is interesting."
                className="input resize-y"
              />
            </Field>

            <Field
              label="Responsibilities"
              htmlFor="job-responsibilities"
              hint="One per line — each becomes a bullet point."
            >
              <textarea
                id="job-responsibilities"
                rows={4}
                value={form.responsibilities}
                onChange={update('responsibilities')}
                placeholder={'Own frontend architecture\nMentor mid-level engineers'}
                className="input resize-y font-mono text-xs"
              />
            </Field>

            <Field
              label="Requirements"
              htmlFor="job-requirements"
              hint="One per line — each becomes a bullet point."
            >
              <textarea
                id="job-requirements"
                rows={4}
                value={form.requirements}
                onChange={update('requirements')}
                placeholder={'5+ years with React\nStrong TypeScript skills'}
                className="input resize-y font-mono text-xs"
              />
            </Field>

            <Field label="Benefits" htmlFor="job-benefits" hint="One per line, e.g. Remote, Equity, Health insurance.">
              <textarea
                id="job-benefits"
                rows={3}
                value={form.benefits}
                onChange={update('benefits')}
                placeholder={'Fully remote\nEquity\n30 days PTO'}
                className="input resize-y font-mono text-xs"
              />
            </Field>

            <Field label="Skills" htmlFor="job-skill" hint="Press Enter or click Add after each skill.">
              <div className="flex gap-2">
                <input
                  id="job-skill"
                  type="text"
                  value={skillDraft}
                  onChange={(event) => setSkillDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addSkill()
                    }
                  }}
                  placeholder="React"
                  className="input"
                />
                <button type="button" onClick={addSkill} className="btn-secondary shrink-0">
                  Add
                </button>
              </div>

              {form.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.skills.map((skill) => (
                    <span key={skill} className="chip bg-brand-50 text-brand-700">
                      {skill}
                      <button
                        type="button"
                        onClick={() =>
                          setForm((current) => ({ ...current, skills: current.skills.filter((s) => s !== skill) }))
                        }
                        aria-label={`Remove ${skill}`}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-brand-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </Field>
          </div>
        </section>

        {/* -------------------------------------------------------- Salary */}
        <section className="card p-6">
          <h2 className="mb-5 font-semibold text-slate-900">Compensation</h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Minimum" htmlFor="job-salary-min">
              <input
                id="job-salary-min"
                type="number"
                min="0"
                step="1000"
                value={form.salaryMin}
                onChange={update('salaryMin')}
                placeholder="120000"
                className="input"
              />
            </Field>

            <Field label="Maximum" htmlFor="job-salary-max">
              <input
                id="job-salary-max"
                type="number"
                min="0"
                step="1000"
                value={form.salaryMax}
                onChange={update('salaryMax')}
                placeholder="160000"
                className="input"
              />
            </Field>

            <Field label="Currency" htmlFor="job-currency">
              <select id="job-currency" value={form.currency} onChange={update('currency')} className="input">
                {['USD', 'EUR', 'GBP', 'INR', 'NGN', 'CAD', 'AUD'].map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Period" htmlFor="job-period">
              <select id="job-period" value={form.period} onChange={update('period')} className="input">
                {['yearly', 'monthly', 'hourly'].map((value) => (
                  <option key={value} value={value}>
                    Per {value.replace('ly', '')}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-5 space-y-3">
            <label className="flex items-center gap-2.5 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isNegotiable}
                onChange={update('isNegotiable')}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Salary is negotiable
            </label>
            <label className="flex items-center gap-2.5 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isVisible}
                onChange={update('isVisible')}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Show the salary range on the posting
            </label>
          </div>

          {salaryError && (
            <Alert variant="warning" className="mt-5">
              <span className="inline-flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                {salaryError}
              </span>
            </Alert>
          )}
        </section>

        {/* ------------------------------------------------------ Publishing */}
        <section className="card p-6">
          <h2 className="mb-5 font-semibold text-slate-900">Publishing</h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Status" htmlFor="job-status" hint="Drafts are only visible to you.">
              <select id="job-status" value={form.status} onChange={update('status')} className="input">
                <option value="open">Open — accepting applications</option>
                <option value="draft">Draft — not visible publicly</option>
                <option value="closed">Closed — no longer accepting</option>
              </select>
            </Field>

            <Field label="Application deadline" htmlFor="job-deadline" hint="Leave empty for open until filled.">
              <input
                id="job-deadline"
                type="date"
                value={form.deadline}
                min={new Date().toISOString().slice(0, 10)}
                onChange={update('deadline')}
                className="input"
              />
            </Field>
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-3">
          <Link to="/employer/jobs" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || !user?.company}
            className="btn-primary min-w-40"
          >
            {saving ? <Spinner size="sm" className="text-white" /> : isEdit ? <Save className="h-4 w-4" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Publish job'}
          </button>
        </div>
      </form>
    </div>
  )
}
