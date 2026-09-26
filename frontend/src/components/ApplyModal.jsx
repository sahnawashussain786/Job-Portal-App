import { FileText, Send, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/authContext'
import { applicationsApi } from '../lib/api'
import { Alert, Spinner } from './ui'

/**
 * Modal for submitting an application.
 *
 * The resume comes from the candidate's profile (the API rejects applications
 * without one) so we surface that requirement up-front with a link to fix it
 * rather than letting the submit fail.
 */
export default function ApplyModal({ job, onClose, onApplied }) {
  const { user } = useAuth()
  const [coverLetter, setCoverLetter] = useState('')
  const [expectedSalary, setExpectedSalary] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // The parent only mounts this component while the modal is open, so the
  // fields always start empty — no reset effect needed.

  // Close on Escape and lock body scroll while open. This is a genuine
  // external-system sync (document listeners), which is what effects are for.
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  const hasResume = Boolean(user?.resume?.url)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const payload = { coverLetter: coverLetter.trim() }
      if (expectedSalary) payload.expectedSalary = Number(expectedSalary)

      const result = await applicationsApi.apply(job._id, payload)
      toast.success('Application submitted!')
      onApplied?.(result.application)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-modal-title"
        className="relative max-h-[92vh] w-full max-w-lg animate-[slide-up_0.25s_ease-out] overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="apply-modal-title" className="text-lg font-bold text-slate-900">
              Apply for this role
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {job.title} · {job.company?.name}
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost px-2" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!hasResume && (
          <Alert variant="warning" title="Add a resume first" className="mb-5">
            Employers need a CV to review your application.{' '}
            <a href="/profile" className="font-semibold underline">
              Upload one on your profile
            </a>{' '}
            and come back.
          </Alert>
        )}

        {hasResume && (
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <FileText className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-700">{user.resume.filename || 'resume.pdf'}</p>
              <p className="text-xs text-slate-500">Your profile resume will be attached</p>
            </div>
          </div>
        )}

        {error && <Alert variant="error" className="mb-5">{error}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label" htmlFor="cover-letter">
              Cover letter <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="cover-letter"
              rows={7}
              value={coverLetter}
              onChange={(event) => setCoverLetter(event.target.value)}
              maxLength={6000}
              placeholder="Tell them why you're a great fit for this role…"
              className="input resize-y"
            />
            <p className="mt-1 text-right text-xs text-slate-400">{coverLetter.length}/6000</p>
          </div>

          <div>
            <label className="label" htmlFor="expected-salary">
              Expected salary <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="expected-salary"
              type="number"
              min="0"
              step="1000"
              value={expectedSalary}
              onChange={(event) => setExpectedSalary(event.target.value)}
              placeholder="e.g. 120000"
              className="input"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={!hasResume || submitting} className="btn-primary flex-1">
              {submitting ? <Spinner size="sm" className="text-white" /> : <Send className="h-4 w-4" aria-hidden="true" />}
              {submitting ? 'Submitting…' : 'Submit application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
