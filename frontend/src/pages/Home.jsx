import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  MapPin,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import JobCard from '../components/JobCard'
import { JobCardSkeleton, SectionHeading } from '../components/ui'
import { useAuth } from '../context/authContext'
import useFetch from '../hooks/useFetch'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { jobsApi } from '../lib/api'

const CATEGORY_ICONS = {
  Engineering: '💻',
  Design: '🎨',
  Product: '📐',
  'Data & Analytics': '📊',
  Marketing: '📣',
  Sales: '🤝',
  'Customer Support': '🎧',
  Finance: '💰',
  'Human Resources': '🧑‍💼',
  Operations: '⚙️',
  Legal: '⚖️',
  Healthcare: '🩺',
  Education: '🎓',
  Other: '🗂️',
}

const STEPS = [
  {
    title: 'Create your profile',
    description: 'Tell us what you do and upload your CV once. Every application reuses it.',
  },
  {
    title: 'Search with real filters',
    description: 'Filter by salary, work mode, experience level and location — not just keywords.',
  },
  {
    title: 'Apply and track',
    description: 'See exactly where each application stands, from pending through to hired.',
  },
]

export default function Home() {
  useDocumentTitle('')
  const navigate = useNavigate()
  const { user } = useAuth()

  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')

  const { data, loading } = useFetch(() => jobsApi.featured(6), [])
  const { data: metaData } = useFetch(() => jobsApi.filterMeta(), [])

  const featured = data?.jobs || []
  const categories = metaData?.meta?.categories || []
  const openRoles = metaData?.meta?.locations?.reduce((sum, entry) => sum + entry.count, 0) || 0

  function handleSearch(event) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('q', keyword.trim())
    if (location.trim()) params.set('location', location.trim())
    const query = params.toString()
    navigate(query ? `/jobs?${query}` : '/jobs')
  }

  return (
    <div className="animate-[fade-in_0.4s_ease-out]">
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        {/* Decorative gradient wash */}
        <div
          className="pointer-events-none absolute -top-40 -right-32 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-indigo-100/60 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {openRoles > 0 ? `${openRoles} open roles right now` : 'Fresh roles added daily'}
            </span>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Find work that
              <span className="bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-transparent">
                {' '}
                fits your life
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
              Search thousands of roles from teams that are actively hiring. Filter by salary, work mode and
              experience — then track every application in one place.
            </p>

            {/* Search bar */}
            <form
              onSubmit={handleSearch}
              className="mx-auto mt-9 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/50 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  type="search"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Job title, skill or company"
                  aria-label="Search jobs by keyword"
                  className="w-full rounded-lg border-0 bg-transparent py-3 pr-3 pl-9 text-sm focus:outline-none"
                />
              </div>

              <div className="relative flex-1 sm:border-l sm:border-slate-200">
                <MapPin className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  type="text"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Location or Remote"
                  aria-label="Search jobs by location"
                  className="w-full rounded-lg border-0 bg-transparent py-3 pr-3 pl-9 text-sm focus:outline-none"
                />
              </div>

              <button type="submit" className="btn-primary shrink-0 px-6 py-3">
                <Search className="h-4 w-4" aria-hidden="true" />
                Search
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-500">
              <span>Popular:</span>
              {['React', 'Remote', 'Design', 'Data'].map((term) => (
                <Link
                  key={term}
                  to={`/jobs?q=${encodeURIComponent(term)}`}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium transition-colors hover:border-brand-300 hover:text-brand-600"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Metrics */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            { icon: Briefcase, label: 'Open roles', value: openRoles || '—' },
            { icon: Building2, label: 'Hiring companies', value: metaData?.meta?.companies?.length ?? '—' },
            { icon: Users, label: 'Candidates', value: '10k+' },
            { icon: TrendingUp, label: 'Applications tracked', value: '50k+' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xl font-bold text-slate-900">{value}</p>
                <p className="text-xs font-medium text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* --------------------------------------------------------- Categories */}
        <SectionHeading
          title="Browse by category"
          description="Jump straight to the kind of work you want to do."
          action={
            <Link to="/jobs" className="btn-ghost">
              All jobs
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        />

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {categories.slice(0, 10).map((category) => (
            <Link
              key={category}
              to={`/jobs?category=${encodeURIComponent(category)}`}
              className="card flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
            >
              <span className="text-2xl" aria-hidden="true">
                {CATEGORY_ICONS[category] || '🗂️'}
              </span>
              <span className="truncate text-sm font-medium text-slate-700">{category}</span>
            </Link>
          ))}
        </div>

        {/* ---------------------------------------------------- Featured jobs */}
        <SectionHeading
          className="mt-16"
          title="Featured opportunities"
          description="Hand-picked roles from companies with a strong hiring track record."
          action={
            <Link to="/jobs" className="btn-secondary">
              Browse all jobs
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        />

        <div className="mt-6 grid gap-4">
          {loading
            ? Array.from({ length: 3 }, (_, index) => <JobCardSkeleton key={index} />)
            : featured.map((job) => <JobCard key={job._id} job={job} />)}

          {!loading && featured.length === 0 && (
            <div className="card p-10 text-center text-sm text-slate-500">
              No jobs yet. Run <code className="rounded bg-slate-100 px-1.5 py-0.5">npm run seed</code> to load demo
              data.
            </div>
          )}
        </div>

        {/* ------------------------------------------------------ How it works */}
        <section className="mt-20 rounded-2xl border border-slate-200 bg-white p-8 lg:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">How JobNest works</h2>
            <p className="mt-2 text-slate-600">Three steps from browsing to hired.</p>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="relative">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* --------------------------------------------------------------- CTA */}
        <section className="mt-16 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 px-8 py-12 text-center lg:px-16">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {user ? 'Ready for your next move?' : 'Start your search today'}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">
            {user
              ? 'Your profile is set up. Browse the latest roles and apply in a couple of clicks.'
              : 'Create a free account to save jobs, upload your CV and apply in minutes.'}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/jobs" className="btn bg-white px-6 py-3 text-brand-700 hover:bg-brand-50">
              <Briefcase className="h-4 w-4" aria-hidden="true" />
              Browse jobs
            </Link>

            {!user && (
              <Link
                to="/register"
                className="btn border border-white/40 px-6 py-3 text-white hover:bg-white/10"
              >
                Create free account
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-brand-100">
            {['Free for candidates', 'No spam', 'Track every application'].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
