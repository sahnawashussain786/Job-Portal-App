import { Building2, MapPin, Search, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Pagination from '../components/Pagination'
import { CompanyLogo, EmptyState, Skeleton } from '../components/ui'
import useDebounce from '../hooks/useDebounce'
import useDocumentTitle from '../hooks/useDocumentTitle'
import useFetch from '../hooks/useFetch'
import { companiesApi } from '../lib/api'

export default function Companies() {
  useDocumentTitle('Companies')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const debouncedQuery = useDebounce(query, 400)

  const { data, loading, error } = useFetch(
    () => companiesApi.list({ q: debouncedQuery, page, limit: 12 }),
    [debouncedQuery, page],
  )

  const companies = data?.companies || []

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Company directory</h1>
        <p className="mt-1.5 text-slate-600">Explore the teams hiring on JobNest and see their open roles.</p>
      </header>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(1)
          }}
          placeholder="Search companies"
          aria-label="Search companies"
          className="input pl-9"
        />
      </div>

      {error && <div className="card border-rose-200 p-6 text-sm text-rose-700">{error.message}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="card p-5">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="mt-4 h-4 w-2/3" />
                <Skeleton className="mt-2 h-3 w-full" />
              </div>
            ))
          : companies.map((company) => (
              <Link
                key={company._id}
                to={`/companies/${company.slug || company._id}`}
                className="card flex gap-4 p-5 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
              >
                <CompanyLogo company={company} />

                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold text-slate-900">{company.name}</h2>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    {company.industry && (
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-slate-400" aria-hidden="true" />
                        {company.industry}
                      </span>
                    )}
                    {company.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" aria-hidden="true" />
                        {company.location}
                      </span>
                    )}
                    {company.companySize && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3 text-slate-400" aria-hidden="true" />
                        {company.companySize}
                      </span>
                    )}
                  </div>

                  {company.tagline && <p className="mt-2.5 line-clamp-2 text-sm text-slate-600">{company.tagline}</p>}
                </div>
              </Link>
            ))}
      </div>

      {!loading && companies.length === 0 && (
        <EmptyState
          icon={Building2}
          title="No companies found"
          description={query ? `Nothing matched "${query}". Try a different name.` : 'No companies have signed up yet.'}
        />
      )}

      <Pagination meta={data?.meta} onPageChange={setPage} className="mt-8" />
    </div>
  )
}
