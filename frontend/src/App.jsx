import { lazy, Suspense } from 'react'
import { createBrowserRouter, isRouteErrorResponse, Link, RouterProvider, useRouteError } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { PageLoader } from './components/ui'

/**
 * Routes are code-split with `lazy` so the initial bundle only contains the
 * shell + home page. Vite turns each dynamic import into its own chunk.
 *
 * Every `lazy()` needs a Suspense boundary above it; `RouteFallback` below
 * provides one for the whole tree.
 */
const Home = lazy(() => import('./pages/Home'))
const Jobs = lazy(() => import('./pages/Jobs'))
const JobDetail = lazy(() => import('./pages/JobDetail'))
const Companies = lazy(() => import('./pages/Companies'))
const CompanyDetail = lazy(() => import('./pages/CompanyDetail'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Profile = lazy(() => import('./pages/Profile'))
const NotFound = lazy(() => import('./pages/NotFound'))

const Dashboard = lazy(() => import('./pages/jobseeker/Dashboard'))
const MyApplications = lazy(() => import('./pages/jobseeker/MyApplications'))
const SavedJobs = lazy(() => import('./pages/jobseeker/SavedJobs'))

const EmployerDashboard = lazy(() => import('./pages/employer/EmployerDashboard'))
const EmployerJobs = lazy(() => import('./pages/employer/EmployerJobs'))
const JobForm = lazy(() => import('./pages/employer/JobForm'))
const JobApplicants = lazy(() => import('./pages/employer/JobApplicants'))
const CompanyProfile = lazy(() => import('./pages/employer/CompanyProfile'))

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))

/** Shared Suspense fallback for lazily-loaded route chunks. */
function RouteFallback() {
  return <PageLoader />
}

/**
 * Router-level error boundary. Catches render/loader errors and 404s thrown by
 * the router, so a broken page never blanks the whole app.
 */
function RouteError() {
  const error = useRouteError()

  const is404 = isRouteErrorResponse(error) && error.status === 404
  const message = is404
    ? 'That page does not exist.'
    : error?.message || 'Something went wrong while loading this page.'

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-slate-900">{is404 ? 'Page not found' : 'Something went wrong'}</h1>
        <p className="mt-3 text-slate-600">{message}</p>
        <Link to="/" className="btn-primary mt-6">
          Back to home
        </Link>
      </div>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      // --- Public ---------------------------------------------------------
      { index: true, element: <Home /> },
      { path: 'jobs', element: <Jobs /> },
      { path: 'jobs/:id', element: <JobDetail /> },
      { path: 'companies', element: <Companies /> },
      { path: 'companies/:idOrSlug', element: <CompanyDetail /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },

      // --- Any signed-in user --------------------------------------------
      {
        element: <ProtectedRoute />,
        children: [{ path: 'profile', element: <Profile /> }],
      },

      // --- Job seekers ----------------------------------------------------
      {
        element: <ProtectedRoute roles={['jobseeker']} />,
        children: [
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'dashboard/applications', element: <MyApplications /> },
          { path: 'dashboard/saved', element: <SavedJobs /> },
        ],
      },

      // --- Employers ------------------------------------------------------
      {
        element: <ProtectedRoute roles={['employer', 'admin']} />,
        children: [
          { path: 'employer', element: <EmployerDashboard /> },
          { path: 'employer/jobs', element: <EmployerJobs /> },
          { path: 'employer/jobs/new', element: <JobForm /> },
          { path: 'employer/jobs/:id/edit', element: <JobForm /> },
          { path: 'employer/jobs/:jobId/applicants', element: <JobApplicants /> },
          { path: 'employer/company', element: <CompanyProfile /> },
        ],
      },

      // --- Admins ---------------------------------------------------------
      {
        element: <ProtectedRoute roles={['admin']} />,
        children: [{ path: 'admin', element: <AdminDashboard /> }],
      },

      // --- 404 ------------------------------------------------------------
      { path: '*', element: <NotFound /> },
    ],
  },
])

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}
