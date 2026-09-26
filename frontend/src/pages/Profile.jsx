import { Camera, FileText, Lock, Plus, Save, Trash2, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { Alert, Avatar, Spinner } from '../components/ui'
import { useAuth } from '../context/authContext'
import useDocumentTitle from '../hooks/useDocumentTitle'
import useFetch from '../hooks/useFetch'
import { authApi, uploadsApi } from '../lib/api'

/** Section wrapper with a heading and optional description. */
function Panel({ title, description, children, action }) {
  return (
    <section className="card p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function Profile() {
  useDocumentTitle('My profile')
  const { user, updateUser, logout, isEmployer } = useAuth()
  const navigate = useNavigate()

  // Upload availability is controlled by server-side Cloudinary credentials.
  const { data: uploadConfig } = useFetch(() => uploadsApi.config(), [])
  const uploadsEnabled = uploadConfig?.enabled ?? false

  const avatarInput = useRef(null)
  const resumeInput = useRef(null)

  const [form, setForm] = useState({
    name: '',
    headline: '',
    location: '',
    phone: '',
    bio: '',
    skills: [],
  })
  const [skillDraft, setSkillDraft] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' })
  const [savingPassword, setSavingPassword] = useState(false)

  const [uploading, setUploading] = useState(null)

  // Seed the form when the signed-in user first arrives. Adjusting state during
  // render (rather than in an effect) avoids an extra render pass and is the
  // approach React recommends for "reset/derive state from props".
  const [syncedUserId, setSyncedUserId] = useState(null)
  if (user && syncedUserId !== user._id) {
    setSyncedUserId(user._id)
    setForm({
      name: user.name || '',
      headline: user.headline || '',
      location: user.location || '',
      phone: user.phone || '',
      bio: user.bio || '',
      skills: user.skills || [],
    })
  }

  function update(key) {
    return (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  function addSkill() {
    const skill = skillDraft.trim()
    if (!skill) return
    if (form.skills.includes(skill)) {
      toast.error('That skill is already listed')
      return
    }
    setForm((current) => ({ ...current, skills: [...current.skills, skill] }))
    setSkillDraft('')
  }

  function removeSkill(skill) {
    setForm((current) => ({ ...current, skills: current.skills.filter((item) => item !== skill) }))
  }

  async function handleSaveProfile(event) {
    event.preventDefault()
    setSavingProfile(true)
    try {
      const result = await authApi.updateProfile(form)
      updateUser(result.user)
      toast.success('Profile updated')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSavingProfile(false)
    }
  }

  async function handlePasswordChange(event) {
    event.preventDefault()
    setSavingPassword(true)
    try {
      await authApi.changePassword(passwords)
      setPasswords({ currentPassword: '', newPassword: '' })
      toast.success('Password updated')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSavingPassword(false)
    }
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading('avatar')
    try {
      const result = await uploadsApi.image(file, 'avatar')
      updateUser({ avatar: result.file })
      toast.success('Photo updated')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setUploading(null)
      event.target.value = '' // allow re-selecting the same file
    }
  }

  async function handleResumeChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading('resume')
    try {
      const result = await uploadsApi.resume(file)
      updateUser({ resume: result.file })
      toast.success('Resume uploaded')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setUploading(null)
      event.target.value = ''
    }
  }

  async function handleResumeRemove() {
    if (!window.confirm('Remove your uploaded resume? You will not be able to apply until you add a new one.')) return
    try {
      await uploadsApi.removeResume()
      updateUser({ resume: undefined })
      toast.success('Resume removed')
    } catch (error) {
      toast.error(error.message)
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      'Delete your account permanently? This removes your profile and applications and cannot be undone.',
    )
    if (!confirmed) return

    try {
      await authApi.deleteAccount()
      logout()
      toast.success('Account deleted')
      navigate('/')
    } catch (error) {
      toast.error(error.message)
    }
  }

  if (!user) return null

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">My profile</h1>
        <p className="mt-1.5 text-slate-600">
          {isEmployer
            ? 'Keep your details current so candidates know who they are talking to.'
            : 'A complete profile gets you noticed by employers.'}
        </p>
      </header>

      {!uploadsEnabled && (
        <Alert variant="info" className="mb-6" title="File uploads are disabled">
          Cloudinary credentials are not configured on the server, so photo and resume uploads are unavailable. See the
          README to enable them.
        </Alert>
      )}

      <div className="space-y-6">
        {/* ------------------------------------------------------------ Photo */}
        <Panel title="Profile photo" description="Shown to employers alongside your applications.">
          <div className="flex items-center gap-5">
            <Avatar user={user} size="lg" />

            <div>
              <input
                ref={avatarInput}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                aria-label="Upload profile photo"
              />
              <button
                type="button"
                onClick={() => avatarInput.current?.click()}
                disabled={!uploadsEnabled || uploading === 'avatar'}
                className="btn-secondary"
              >
                {uploading === 'avatar' ? <Spinner size="sm" /> : <Camera className="h-4 w-4" aria-hidden="true" />}
                {uploading === 'avatar' ? 'Uploading…' : 'Change photo'}
              </button>
              <p className="mt-1.5 text-xs text-slate-400">JPG, PNG or WebP up to 3MB.</p>
            </div>
          </div>
        </Panel>

        {/* --------------------------------------------------------- Details */}
        <Panel title="Personal details">
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="p-name">
                  Full name
                </label>
                <input id="p-name" type="text" value={form.name} onChange={update('name')} required className="input" />
              </div>

              <div>
                <label className="label" htmlFor="p-email">
                  Email
                </label>
                <input
                  id="p-email"
                  type="email"
                  value={user.email}
                  readOnly
                  className="input cursor-not-allowed bg-slate-50 text-slate-500"
                />
                <p className="mt-1 text-xs text-slate-400">Email addresses can't be changed.</p>
              </div>

              <div>
                <label className="label" htmlFor="p-phone">
                  Phone
                </label>
                <input id="p-phone" type="tel" value={form.phone} onChange={update('phone')} placeholder="+1 555 000 0000" className="input" />
              </div>

              <div>
                <label className="label" htmlFor="p-location">
                  Location
                </label>
                <input id="p-location" type="text" value={form.location} onChange={update('location')} placeholder="Austin, TX" className="input" />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="p-headline">
                Headline
              </label>
              <input
                id="p-headline"
                type="text"
                maxLength={140}
                value={form.headline}
                onChange={update('headline')}
                placeholder="Senior Frontend Engineer · React & TypeScript"
                className="input"
              />
            </div>

            <div>
              <label className="label" htmlFor="p-bio">
                About you
              </label>
              <textarea
                id="p-bio"
                rows={5}
                maxLength={2000}
                value={form.bio}
                onChange={update('bio')}
                placeholder="A couple of sentences about what you do and what you're looking for."
                className="input resize-y"
              />
            </div>

            <div>
              <label className="label" htmlFor="p-skill">
                Skills
              </label>
              <div className="flex gap-2">
                <input
                  id="p-skill"
                  type="text"
                  value={skillDraft}
                  onChange={(event) => setSkillDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addSkill()
                    }
                  }}
                  placeholder="e.g. React"
                  className="input"
                />
                <button type="button" onClick={addSkill} className="btn-secondary shrink-0">
                  <Plus className="h-4 w-4" aria-hidden="true" />
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
                        onClick={() => removeSkill(skill)}
                        aria-label={`Remove ${skill}`}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-brand-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-5">
              <button type="submit" disabled={savingProfile} className="btn-primary">
                {savingProfile ? <Spinner size="sm" className="text-white" /> : <Save className="h-4 w-4" aria-hidden="true" />}
                {savingProfile ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </Panel>

        {/* ---------------------------------------------------------- Resume */}
        {!isEmployer && (
          <Panel
            title="Resume"
            description="Attached automatically to every application you submit."
          >
            <input
              ref={resumeInput}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeChange}
              className="hidden"
              aria-label="Upload resume"
            />

            {user.resume?.url ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{user.resume.filename || 'resume.pdf'}</p>
                    <a
                      href={user.resume.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Preview
                    </a>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => resumeInput.current?.click()}
                    disabled={!uploadsEnabled || uploading === 'resume'}
                    className="btn-secondary"
                  >
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    Replace
                  </button>
                  <button type="button" onClick={handleResumeRemove} className="btn-danger">
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
                <FileText className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
                <p className="mt-3 text-sm text-slate-500">No resume uploaded yet.</p>
                <button
                  type="button"
                  onClick={() => resumeInput.current?.click()}
                  disabled={!uploadsEnabled || uploading === 'resume'}
                  className="btn-primary mt-4"
                >
                  {uploading === 'resume' ? <Spinner size="sm" className="text-white" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
                  {uploading === 'resume' ? 'Uploading…' : 'Upload resume'}
                </button>
                <p className="mt-2 text-xs text-slate-400">PDF, DOC or DOCX up to 5MB.</p>
              </div>
            )}
          </Panel>
        )}

        {/* -------------------------------------------------------- Password */}
        <Panel title="Password" description="Use at least 6 characters.">
          <form onSubmit={handlePasswordChange} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="p-current">
                  Current password
                </label>
                <input
                  id="p-current"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={passwords.currentPassword}
                  onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label" htmlFor="p-new">
                  New password
                </label>
                <input
                  id="p-new"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={passwords.newPassword}
                  onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-5">
              <button type="submit" disabled={savingPassword} className="btn-primary">
                {savingPassword ? <Spinner size="sm" className="text-white" /> : <Lock className="h-4 w-4" aria-hidden="true" />}
                {savingPassword ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </form>
        </Panel>

        {/* ---------------------------------------------------- Danger zone */}
        <Panel title="Danger zone" description="Permanently delete your account and all associated data.">
          <button type="button" onClick={handleDeleteAccount} className="btn-danger">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete my account
          </button>
        </Panel>
      </div>
    </div>
  )
}
