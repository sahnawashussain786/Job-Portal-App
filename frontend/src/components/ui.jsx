import { AlertCircle, Inbox, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { cn, initials, STATUS_STYLES, titleCase } from '../lib/format'

/** Centred spinner with an accessible label. */
export function Spinner({ size = 'md', className }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }
  return (
    <Loader2
      className={cn('animate-spin text-brand-600', sizes[size], className)}
      aria-hidden="true"
    />
  )
}

/** Full-panel loading state for route-level suspense. */
export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3" role="status">
      <Spinner size="lg" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  )
}

/** Inline error/success banner. */
export function Alert({ variant = 'error', title, children, className }) {
  const variants = {
    error: 'border-rose-200 bg-rose-50 text-rose-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
  }

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-lg border p-3.5 text-sm', variants[variant], className)}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5')}>{children}</div>}
      </div>
    </div>
  )
}

/** Friendly placeholder for empty lists. */
export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center', className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-6 w-6 text-slate-400" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/** Generic pill. */
export function Badge({ children, className, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    brand: 'bg-brand-50 text-brand-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  }
  return <span className={cn('chip', tones[tone], className)}>{children}</span>
}

/** Coloured pill for an application or job status. */
export function StatusBadge({ status, className }) {
  return (
    <span className={cn('chip', STATUS_STYLES[status] || STATUS_STYLES.pending, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {titleCase(status)}
    </span>
  )
}

/** Circular initials avatar, optionally showing an image. */
export function Avatar({ user, size = 'md', className }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-lg' }
  const [failed, setFailed] = useState(false)
  const name = user?.name || 'User'

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-semibold text-brand-700',
        sizes[size],
        className,
      )}
      title={name}
    >
      {user?.avatar?.url && !failed ? (
        <img
          src={user.avatar.url}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        initials(name) || '?'
      )}
    </span>
  )
}

/** Company logo with a deterministic letter-tile fallback. */
export function CompanyLogo({ company, size = 'md', className }) {
  const sizes = { sm: 'h-9 w-9 text-xs', md: 'h-12 w-12 text-sm', lg: 'h-16 w-16 text-lg' }
  const [failed, setFailed] = useState(false)
  const name = company?.name || 'Company'
  const url = company?.logo?.url

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white font-bold text-slate-500',
        sizes[size],
        className,
      )}
    >
      {url && !failed ? (
        <img src={url} alt={name} className="h-full w-full object-contain p-1" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        initials(name) || 'C'
      )}
    </span>
  )
}

/** KPI tile for dashboards. */
export function StatCard({ label, value, icon: Icon, tone = 'brand', hint }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-100 text-slate-600',
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">{value ?? '—'}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        {Icon && (
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', tones[tone])}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
      </div>
    </div>
  )
}

/** Section header with an optional action on the right. */
export function SectionHeading({ title, description, action, className }) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

/** Shimmer placeholder used while job cards are loading. */
export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-md bg-slate-200/70', className)} aria-hidden="true" />
}

/** Skeleton matching the JobCard layout. */
export function JobCardSkeleton() {
  return (
    <div className="card p-5">
      <div className="flex gap-4">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
