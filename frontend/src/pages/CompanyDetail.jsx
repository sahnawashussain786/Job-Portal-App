import { ArrowLeft, Briefcase, Calendar, CheckCircle2, ExternalLink, Globe, Mail, MapPin, Phone, Users } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import JobCard from '../components/JobCard'
import { Alert, CompanyLogo, PageLoader } from '../components/ui'
import useDocumentTitle from '../hooks/useDocumentTitle'
import useFetch from '../hooks/useFetch'
import { companiesApi } from '../lib/api'

function InfoRow({ icon: Icon, label, value, href }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        {href ? (
          <a
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-sm font-medium break-all text-brand-600 hover:underline"
          >
            {value}
            {href.startsWith('http') && <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />}
          </a>
        ) : (
          <p className="text-sm font-medium text-slate-700">{value}</p>
        )}
      </div>
    </div>
  )
}

export default function CompanyDetail() {
  const { idOrSlug } = useParams()
  const { data, loading, error } = useFetch(() => companiesApi.detail(idOrSlug), [idOrSlug])

  const company = data?.company
  useDocumentTitle(company?.name || 'Company')

  if (loading) return <PageLoader label="Loading company…" />

  if (error || !company) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <Alert variant="error" title="Company not found">
          {error?.message || 'We could not find that company.'}
        </Alert>
        <Link to="/companies" className="btn-secondary mt-6">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to companies
        </Link>
      </div>
    )
  }

  const jobs = data.jobs || []

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/companies" className="btn-ghost mb-6 -ml-2">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All companies
      </Link>

      {/* Header */}
      <div className="card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-brand-600 to-indigo-600" aria-hidden="true" />
        <div className="px-6 pb-6 sm:px-8">
          <div className="-mt-10 flex flex-wrap items-end gap-4">
            <CompanyLogo company={company} size="lg" className="ring-4 ring-white" />
            <div className="flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{company.name}</h1>
                {company.isVerified && (
                  <span className="chip bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                    Verified
                  </span>
                )}
              </div>
              {company.tagline && <p className="mt-1 text-slate-600">{company.tagline}</p>}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="chip bg-brand-50 text-brand-700">
              <Briefcase className="h-3 w-3" aria-hidden="true" />
              {data.openJobCount} open role{data.openJobCount === 1 ? '' : 's'}
            </span>
            {company.industry && <span className="chip bg-slate-100 text-slate-600">{company.industry}</span>}
            {company.companySize && (
              <span className="chip bg-slate-100 text-slate-600">
                <Users className="h-3 w-3" aria-hidden="true" />
                {company.companySize} employees
              </span>
            )}
            {company.foundedYear && (
              <span className="chip bg-slate-100 text-slate-600">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                Founded {company.foundedYear}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Open roles */}
        <div className="min-w-0">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Open positions</h2>

          <div className="grid gap-4">
            {jobs.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}

            {jobs.length === 0 && (
              <div className="card p-10 text-center">
                <p className="text-sm text-slate-500">This company has no open roles right now.</p>
                <Link to="/jobs" className="btn-secondary mt-4">
                  Browse all jobs
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-6">
            <h2 className="text-sm font-bold text-slate-900">Company details</h2>
            <div className="mt-5 space-y-4">
              <InfoRow icon={MapPin} label="Headquarters" value={company.location} />
              <InfoRow icon={Globe} label="Website" value={company.website} href={company.website} />
              <InfoRow icon={Mail} label="Email" value={company.email} href={company.email ? `mailto:${company.email}` : undefined} />
              <InfoRow icon={Phone} label="Phone" value={company.phone} href={company.phone ? `tel:${company.phone}` : undefined} />
            </div>
          </div>

          {company.description && (
            <div className="card p-6">
              <h2 className="text-sm font-bold text-slate-900">About</h2>
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-slate-600">{company.description}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
