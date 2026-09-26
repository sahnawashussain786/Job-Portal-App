import { Compass, Home, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function NotFound() {
  useDocumentTitle('Page not found')

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Compass className="h-8 w-8" aria-hidden="true" />
      </span>

      <p className="mt-6 text-sm font-bold tracking-wider text-brand-600 uppercase">Error 404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Page not found</h1>
      <p className="mt-3 text-slate-600">
        The page you're looking for doesn't exist, or the job posting may have been removed.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">
          <Home className="h-4 w-4" aria-hidden="true" />
          Back home
        </Link>
        <Link to="/jobs" className="btn-secondary">
          <Search className="h-4 w-4" aria-hidden="true" />
          Browse jobs
        </Link>
      </div>
    </div>
  )
}
