import { Bookmark } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import JobCard from '../../components/JobCard'
import Pagination from '../../components/Pagination'
import { Alert, EmptyState, JobCardSkeleton } from '../../components/ui'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useFetch from '../../hooks/useFetch'
import { jobsApi } from '../../lib/api'

export default function SavedJobs() {
  useDocumentTitle('Saved jobs')
  const [page, setPage] = useState(1)
  const [jobs, setJobs] = useState(null)

  const { data, loading, error } = useFetch(() => jobsApi.saved({ page, limit: 10 }), [page])

  // Prefer locally-updated list (so unsaving removes the card immediately).
  const list = jobs ?? data?.jobs ?? []

  /** Un-saving from this page should drop the card rather than just flip an icon. */
  function handleSaveChange(jobId, isSaved) {
    if (isSaved) return
    setJobs(list.filter((job) => job._id !== jobId))
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Saved jobs</h1>
        <p className="mt-1.5 text-slate-600">Roles you've bookmarked to come back to.</p>
      </header>

      {error && (
        <Alert variant="error" className="mb-6">
          {error.message}
        </Alert>
      )}

      <div className="grid gap-4">
        {loading && !data
          ? Array.from({ length: 3 }, (_, index) => <JobCardSkeleton key={index} />)
          : list.map((job) => <JobCard key={job._id} job={job} onSaveChange={handleSaveChange} />)}
      </div>

      {!loading && list.length === 0 && (
        <EmptyState
          icon={Bookmark}
          title="No saved jobs"
          description="Tap the bookmark icon on any job card to save it for later."
          action={
            <Link to="/jobs" className="btn-primary">
              Browse jobs
            </Link>
          }
        />
      )}

      {!jobs && <Pagination meta={data?.meta} onPageChange={setPage} className="mt-8" />}
    </div>
  )
}
