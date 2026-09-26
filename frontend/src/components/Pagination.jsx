import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/format'

/**
 * Windowed pagination: always shows first/last, the current page, and its
 * neighbours, collapsing the rest into ellipses.
 */
function buildPages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  if (start > 2) pages.push('…')
  for (let page = start; page <= end; page += 1) pages.push(page)
  if (end < total - 1) pages.push('…')

  pages.push(total)
  return pages
}

export default function Pagination({ meta, onPageChange, className }) {
  if (!meta || meta.pages <= 1) return null

  const { page, pages, hasPrevPage, hasNextPage, total, limit } = meta
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <nav
      className={cn('flex flex-wrap items-center justify-between gap-4 pt-2', className)}
      aria-label="Pagination"
    >
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{from}</span>–
        <span className="font-medium text-slate-700">{to}</span> of{' '}
        <span className="font-medium text-slate-700">{total}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className="btn-secondary px-2.5 py-2"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        {buildPages(page, pages).map((entry, index) =>
          entry === '…' ? (
            <span key={`gap-${index}`} className="px-2 text-sm text-slate-400" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => onPageChange(entry)}
              aria-current={entry === page ? 'page' : undefined}
              className={cn(
                'min-w-9 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                entry === page
                  ? 'bg-brand-600 text-white'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
              )}
            >
              {entry}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="btn-secondary px-2.5 py-2"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}
