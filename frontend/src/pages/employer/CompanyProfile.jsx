import { Building2, Camera, ExternalLink, Save, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { Alert, CompanyLogo, Spinner } from '../../components/ui'
import { useAuth } from '../../context/authContext'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useFetch from '../../hooks/useFetch'
import { companiesApi, uploadsApi } from '../../lib/api'

const BLANK = {
  name: '',
  tagline: '',
  description: '',
  website: '',
  industry: '',
  companySize: '',
  foundedYear: '',
  location: '',
  email: '',
  phone: '',
}

const SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+']

export default function CompanyProfile() {
  useDocumentTitle('Company profile')
  const { refreshUser } = useAuth()

  const { data, loading, reload } = useFetch(() => companiesApi.mine(), [])
  const { data: uploadConfig } = useFetch(() => uploadsApi.config(), [])
  const uploadsEnabled = uploadConfig?.enabled ?? false

  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const logoInput = useRef(null)

  const company = data?.company

  // Populate the form when a company record loads. Adjusting state during render
  // is React's recommended alternative to a syncing effect.
  const [syncedCompanyId, setSyncedCompanyId] = useState(null)
  if (company && syncedCompanyId !== company._id) {
    setSyncedCompanyId(company._id)
    setForm({
      name: company.name || '',
      tagline: company.tagline || '',
      description: company.description || '',
      website: company.website || '',
      industry: company.industry || '',
      companySize: company.companySize || '',
      foundedYear: company.foundedYear || '',
      location: company.location || '',
      email: company.email || '',
      phone: company.phone || '',
    })
  }

  function update(key) {
    return (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const payload = { ...form }
    if (payload.foundedYear) payload.foundedYear = Number(payload.foundedYear)
    else delete payload.foundedYear

    try {
      if (company) {
        await companiesApi.update(payload)
        toast.success('Company profile updated')
      } else {
        await companiesApi.create(payload)
        toast.success('Company profile created')
        await refreshUser()
      }
      reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      await uploadsApi.image(file, 'logo')
      toast.success('Logo updated')
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      'Delete your company profile? You must remove all your job postings first.',
    )
    if (!confirmed) return

    try {
      await companiesApi.remove()
      toast.success('Company profile deleted')
      await refreshUser()
      reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {company ? 'Company profile' : 'Create your company profile'}
        </h1>
        <p className="mt-1.5 text-slate-600">
          {company
            ? 'This is what candidates see on your job postings and company page.'
            : 'Tell candidates who you are — it makes your postings far more credible.'}
        </p>
      </header>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {!uploadsEnabled && (
        <Alert variant="info" className="mb-6">
          Logo uploads are disabled because Cloudinary credentials are not configured on the server.
        </Alert>
      )}

      {company && (
        <section className="card mb-6 p-6">
          <div className="flex flex-wrap items-center gap-5">
            <CompanyLogo company={company} size="lg" />

            <div>
              <input
                ref={logoInput}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
                aria-label="Upload company logo"
              />
              <button
                type="button"
                onClick={() => logoInput.current?.click()}
                disabled={!uploadsEnabled || uploading}
                className="btn-secondary"
              >
                {uploading ? <Spinner size="sm" /> : <Camera className="h-4 w-4" aria-hidden="true" />}
                {uploading ? 'Uploading…' : 'Change logo'}
              </button>
              <p className="mt-1.5 text-xs text-slate-400">Square image works best, up to 3MB.</p>
            </div>

            <Link
              to={`/companies/${company.slug || company._id}`}
              className="btn-ghost ml-auto"
              target="_blank"
              rel="noreferrer"
            >
              View public page
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="card p-6">
          <h2 className="mb-5 font-semibold text-slate-900">Company details</h2>

          <div className="space-y-5">
            <div>
              <label className="label" htmlFor="c-name">
                Company name <span className="text-rose-500">*</span>
              </label>
              <input id="c-name" type="text" required value={form.name} onChange={update('name')} placeholder="Acme Corp" className="input" />
            </div>

            <div>
              <label className="label" htmlFor="c-tagline">
                Tagline
              </label>
              <input
                id="c-tagline"
                type="text"
                maxLength={160}
                value={form.tagline}
                onChange={update('tagline')}
                placeholder="Cloud infrastructure that scales with you"
                className="input"
              />
            </div>

            <div>
              <label className="label" htmlFor="c-description">
                About the company
              </label>
              <textarea
                id="c-description"
                rows={5}
                maxLength={4000}
                value={form.description}
                onChange={update('description')}
                placeholder="What you build, how you work, and what makes the team worth joining."
                className="input resize-y"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="c-industry">
                  Industry
                </label>
                <input id="c-industry" type="text" value={form.industry} onChange={update('industry')} placeholder="Software" className="input" />
              </div>

              <div>
                <label className="label" htmlFor="c-size">
                  Company size
                </label>
                <select id="c-size" value={form.companySize} onChange={update('companySize')} className="input">
                  <option value="">Select a size</option>
                  {SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size} employees
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label" htmlFor="c-founded">
                  Founded year
                </label>
                <input
                  id="c-founded"
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={form.foundedYear}
                  onChange={update('foundedYear')}
                  placeholder="2014"
                  className="input"
                />
              </div>

              <div>
                <label className="label" htmlFor="c-location">
                  Headquarters
                </label>
                <input id="c-location" type="text" value={form.location} onChange={update('location')} placeholder="San Francisco, CA" className="input" />
              </div>
            </div>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="mb-5 font-semibold text-slate-900">Contact</h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="c-website">
                Website
              </label>
              <input
                id="c-website"
                type="url"
                value={form.website}
                onChange={update('website')}
                placeholder="https://acme.com"
                className="input"
              />
            </div>

            <div>
              <label className="label" htmlFor="c-email">
                Contact email
              </label>
              <input id="c-email" type="email" value={form.email} onChange={update('email')} placeholder="careers@acme.com" className="input" />
            </div>

            <div>
              <label className="label" htmlFor="c-phone">
                Phone
              </label>
              <input id="c-phone" type="tel" value={form.phone} onChange={update('phone')} placeholder="+1 555 000 0000" className="input" />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-3">
          {company && (
            <button type="button" onClick={handleDelete} className="btn-danger mr-auto">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete company
            </button>
          )}
          <button type="submit" disabled={saving} className="btn-primary min-w-40">
            {saving ? <Spinner size="sm" className="text-white" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            {saving ? 'Saving…' : company ? 'Save changes' : 'Create profile'}
          </button>
        </div>
      </form>

      {!company && !loading && (
        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400">
          <Building2 className="h-4 w-4" aria-hidden="true" />
          You must create a company profile before posting jobs.
        </p>
      )}
    </div>
  )
}
