import { SearchX } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import JobCard from '../components/JobCard'
import JobFilters, { DEFAULT_FILTERS } from '../components/JobFilters'
import Pagination from '../components/Pagination'
import { EmptyState, JobCardSkeleton } from '../components/ui'
import useDebounce from '../hooks/useDebounce'
import useDocumentTitle from '../hooks/useDocumentTitle'
import useFetch from '../hooks/useFetch'
import { jobsApi } from '../lib/api'

const FILTER_KEYS = Object.keys(DEFAULT_FILTERS)

export default function Jobs() {
  useDocumentTitle('Find jobs')
  const [searchParams, setSearchParams] = useSearchParams()

  // Derive filter state from the URL so the page is shareable and the back
  // button behaves as users expect.
  const filters = useMemo(() => {
    const fromUrl = {}
    FILTER_KEYS.forEach((key) => {
      fromUrl[key] = searchParams.get(key) || DEFAULT_FILTERS[key]
    })
    return fromUrl
  }, [searchParams])

  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  // The keyword input updates instantly for typing feel, but only the debounced
  // value is sent to the API.
  const [keywordInput, setKeywordInput] = useState(filters.q)
  const debouncedKeyword = useDebounce(keywordInput, 450)

  // Keep the local input in sync when the URL changes from outside the input
  // (e.g. a "Popular" link on the home page). Adjusting state during render is
  // React's recommended alternative to a syncing effect.
  const [syncedQuery, setSyncedQuery] = useState(filters.q)
  if (filters.q !== syncedQuery) {
    setSyncedQuery(filters.q)
    setKeywordInput(filters.q)
  }

  // Push the debounced keyword into the URL, resetting to page 1.
  useEffect(() => {
    if (debouncedKeyword === filters.q) return
    setSearchParams((params) => {
      const next = new URLSearchParams(params)
      if (debouncedKeyword) next.set('q', debouncedKeyword)
      else next.delete('q')
      next.delete('page')
      return next
    })
  }, [debouncedKeyword, filters.q, setSearchParams])

  const requestFilters = useMemo(
    () => ({ ...filters, q: debouncedKeyword, page }),
    [filters, debouncedKeyword, page],
  )

  const { data, loading, error } = useFetch(
    () => jobsApi.list(requestFilters),
    [
      requestFilters.q,
      requestFilters.location,
      requestFilters.category,
      requestFilters.employmentType,
      requestFilters.workMode,
      requestFilters.experienceLevel,
      requestFilters.minSalary,
      requestFilters.sort,
      requestFilters.page,
    ],
  )

  const { data: metaData } = useFetch(() => jobsApi.filterMeta(), [])

  const jobs = data?.jobs || []
  const meta = data?.meta

  /** Merge a filter change into the URL, dropping empties and resetting paging. */
  const handleFilterChange = useCallback(
    (next) => {
      setSearchParams((params) => {
        const updated = new URLSearchParams(params)
        Object.entries(next).forEach(([key, value]) => {
          if (key === 'q') return // handled by the debounce effect
          if (value === '' || value === null || value === undefined) updated.delete(key)
          else updated.set(key, value)
        })
        updated.delete('page')
        return updated
      })
      if (next.q !== filters.q) setKeywordInput(next.q)
    },
    [setSearchParams, filters.q],
  )

  const handleReset = useCallback(() => {
    setSearchParams({})
    setKeywordInput('')
  }, [setSearchParams])

  const handlePageChange = useCallback(
    (nextPage) => {
      setSearchParams((params) => {
        const updated = new URLSearchParams(params)
        if (nextPage > 1) updated.set('page', String(nextPage))
        else updated.delete('page')
        return updated
      })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [setSearchParams],
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Find your next role</h1>
        <p className="mt-1.5 text-slate-600">
          {meta?.total !== undefined ? `${meta.total} roles` : 'Browse roles'} matching your criteria.
        </p>
      </header>

      <JobFilters
        filters={{ ...filters, q: keywordInput }}
        onChange={(next) => {
          if (next.q !== keywordInput) setKeywordInput(next.q)
          handleFilterChange(next)
        }}
        onReset={handleReset}
        meta={metaData?.meta}
        total={meta?.total}
      >
        {error && (
          <div className="card border-rose-200 p-6 text-sm text-rose-700">{error.message}</div>
        )}

        <div className="grid gap-4">
          {loading && !data
            ? Array.from({ length: 5 }, (_, index) => <JobCardSkeleton key={index} />)
            : jobs.map((job) => <JobCard key={job._id} job={job} />)}
        </div>

        {!loading && !error && jobs.length === 0 && (
          <EmptyState
            icon={SearchX}
            title="No jobs match those filters"
            description="Try removing a filter or searching for a broader term."
            action={
              <button type="button" onClick={handleReset} className="btn-primary">
                Clear all filters
              </button>
            }
          />
        )}

        <Pagination meta={meta} onPageChange={handlePageChange} className="mt-8" />

        {jobs.length > 0 && (
          <p className="mt-6 text-center text-sm text-slate-400">
            Looking for something else?{' '}
            <Link to="/companies" className="font-medium text-brand-600 hover:underline">
              Browse companies
            </Link>
          </p>
        )}
      </JobFilters>
    </div>
  )
}
