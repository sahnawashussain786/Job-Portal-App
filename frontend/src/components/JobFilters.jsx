import { Filter, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import { cn, titleCase } from '../lib/format'

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most recent' },
  { value: 'salary', label: 'Highest salary' },
  { value: 'popular', label: 'Most applied' },
  { value: 'title', label: 'Job title (A–Z)' },
]

const DEFAULT_FILTERS = {
  q: '',
  location: '',
  category: '',
  employmentType: '',
  workMode: '',
  experienceLevel: '',
  minSalary: '',
  sort: 'recent',
}

export { DEFAULT_FILTERS }

/** Count how many filters are active, for the mobile badge. */
function countActive(filters) {
  return Object.entries(filters).filter(
    ([key, value]) => key !== 'sort' && key !== 'q' && value !== '' && value !== undefined,
  ).length
}

function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <label className="label" htmlFor={`filter-${label}`}>
        {label}
      </label>
      <select
        id={`filter-${label}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input capitalize"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {titleCase(option)}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function JobFilters({
  filters,
  onChange,
  onReset,
  meta,
  total,
  children,
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const activeCount = countActive(filters)

  const set = (key) => (value) => onChange({ ...filters, [key]: value })

  const panel = (
    <div className="space-y-5">
      <div>
        <label className="label" htmlFor="filter-keyword">
          Keyword
        </label>
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id="filter-keyword"
            type="search"
            value={filters.q}
            onChange={(event) => set('q')(event.target.value)}
            placeholder="Title, skill or company"
            className="input pl-9"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="filter-location">
          Location
        </label>
        <input
          id="filter-location"
          type="text"
          list="filter-location-options"
          value={filters.location}
          onChange={(event) => set('location')(event.target.value)}
          placeholder="City, region or Remote"
          className="input"
        />
        <datalist id="filter-location-options">
          {(meta?.locations || []).map((entry) => (
            <option key={entry.value} value={entry.value} />
          ))}
        </datalist>
      </div>

      <SelectField
        label="Category"
        value={filters.category}
        onChange={set('category')}
        options={meta?.categories || []}
        placeholder="All categories"
      />

      <SelectField
        label="Employment type"
        value={filters.employmentType}
        onChange={set('employmentType')}
        options={meta?.employmentTypes || []}
        placeholder="Any type"
      />

      <SelectField
        label="Work mode"
        value={filters.workMode}
        onChange={set('workMode')}
        options={meta?.workModes || []}
        placeholder="Any mode"
      />

      <SelectField
        label="Experience"
        value={filters.experienceLevel}
        onChange={set('experienceLevel')}
        options={meta?.experienceLevels || []}
        placeholder="Any level"
      />

      <div>
        <label className="label" htmlFor="filter-salary">
          Minimum salary
        </label>
        <input
          id="filter-salary"
          type="number"
          min="0"
          step="5000"
          value={filters.minSalary}
          onChange={(event) => set('minSalary')(event.target.value)}
          placeholder="e.g. 80000"
          className="input"
        />
        <p className="mt-1 text-xs text-slate-400">Matches jobs whose top of range is at least this.</p>
      </div>

      <button type="button" onClick={onReset} className="btn-secondary w-full" disabled={activeCount === 0 && !filters.q}>
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Reset filters
      </button>
    </div>
  )

  return (
    <>
      {/* Toolbar: search summary + mobile filter trigger */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {total === undefined ? (
            'Searching…'
          ) : (
            <>
              <span className="font-semibold text-slate-800">{total}</span> job{total === 1 ? '' : 's'} found
            </>
          )}
        </p>

        <div className="flex items-center gap-2">
          <label htmlFor="filter-sort" className="text-sm text-slate-500">
            Sort
          </label>
          <select
            id="filter-sort"
            value={filters.sort}
            onChange={(event) => set('sort')(event.target.value)}
            className="input w-auto py-2"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="btn-secondary lg:hidden"
            aria-expanded={mobileOpen}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters
            {activeCount > 0 && (
              <span className="ml-1 rounded-full bg-brand-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="card sticky top-20 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Filter className="h-4 w-4 text-brand-600" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-slate-900">Filter jobs</h2>
            </div>
            {panel}
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Job filters"
            className={cn(
              'absolute right-0 bottom-0 left-0 max-h-[85vh] animate-[slide-up_0.25s_ease-out] overflow-y-auto rounded-t-2xl bg-white p-5',
            )}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Filter jobs</h2>
              <button type="button" onClick={() => setMobileOpen(false)} className="btn-ghost px-2" aria-label="Close filters">
                <X className="h-5 w-5" />
              </button>
            </div>
            {panel}
            <button type="button" onClick={() => setMobileOpen(false)} className="btn-primary mt-5 w-full">
              Show {total ?? ''} result{total === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
