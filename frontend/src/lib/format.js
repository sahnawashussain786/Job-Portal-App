/** Compose class names, dropping falsy values. */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', GBP: '£', INR: '₹', NGN: '₦', CAD: 'CA$', AUD: 'A$' }

const PERIOD_SUFFIX = { hourly: '/hr', monthly: '/mo', yearly: '/yr' }

/** "USD 140000-190000 yearly" → "$140k – $190k / yr" */
export function formatSalary(salary) {
  if (!salary) return 'Not specified'
  if (salary.isNegotiable && !salary.min && !salary.max) return 'Negotiable'

  const symbol = CURRENCY_SYMBOLS[salary.currency] || `${salary.currency || ''} `
  const suffix = PERIOD_SUFFIX[salary.period] || ''

  const compact = (value) => {
    if (value >= 1000) {
      const thousands = value / 1000
      return `${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}k`
    }
    return `${value}`
  }

  if (salary.min && salary.max) return `${symbol}${compact(salary.min)} – ${symbol}${compact(salary.max)}${suffix}`
  if (salary.min) return `From ${symbol}${compact(salary.min)}${suffix}`
  if (salary.max) return `Up to ${symbol}${compact(salary.max)}${suffix}`
  return salary.isVisible === false ? 'Not disclosed' : 'Not specified'
}

/** ISO date → "3 days ago" / "just now" / "2 months ago". */
export function timeAgo(date) {
  if (!date) return ''
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)

  if (seconds < 45) return 'just now'
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]

  for (const [label, secondsInUnit] of units) {
    const value = Math.floor(seconds / secondsInUnit)
    if (value >= 1) return `${value} ${label}${value > 1 ? 's' : ''} ago`
  }
  return 'just now'
}

/** ISO date → "12 Mar 2026". */
export function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Countdown string for application deadlines. */
export function deadlineLabel(deadline) {
  if (!deadline) return null
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return { text: 'Deadline passed', urgent: true }

  const days = Math.ceil(diff / 86400000)
  if (days <= 3) return { text: `Closes in ${days} day${days > 1 ? 's' : ''}`, urgent: true }
  if (days <= 14) return { text: `Closes in ${days} days`, urgent: false }
  return { text: `Deadline ${formatDate(deadline)}`, urgent: false }
}

/** "Ada Lovelace" → "AL" */
export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

/** Human label for a status slug: "shortlisted" → "Shortlisted". */
export function titleCase(value = '') {
  return String(value)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

/** Build a querystring from a filters object, omitting empty values. */
export function toQueryString(params) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== false) {
      search.set(key, value)
    }
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

/** Tailwind classes for each application status pill. */
export const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  reviewed: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  shortlisted: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  interview: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  offered: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  hired: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
  rejected: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  withdrawn: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  open: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  closed: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  draft: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  archived: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
}
