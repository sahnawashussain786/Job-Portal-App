import { Briefcase, Github, Linkedin, Twitter } from 'lucide-react'
import { Link } from 'react-router-dom'

const COLUMNS = [
  {
    title: 'Candidates',
    links: [
      { to: '/jobs', label: 'Browse jobs' },
      { to: '/jobs?workMode=remote', label: 'Remote jobs' },
      { to: '/register', label: 'Create an account' },
      { to: '/dashboard/saved', label: 'Saved jobs' },
    ],
  },
  {
    title: 'Employers',
    links: [
      { to: '/employer/jobs/new', label: 'Post a job' },
      { to: '/employer/company', label: 'Company profile' },
      { to: '/employer', label: 'Employer hub' },
      { to: '/companies', label: 'Company directory' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/', label: 'About' },
      { to: '/jobs', label: 'Careers' },
      { to: '/', label: 'Privacy' },
      { to: '/', label: 'Terms' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2" aria-label="JobNest home">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Briefcase className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Job<span className="text-brand-600">Nest</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500">
              A modern job board connecting candidates with teams that are actually hiring. Search by role,
              location, salary and work mode — then apply in minutes.
            </p>
            <div className="mt-5 flex gap-3">
              {[
                { Icon: Twitter, label: 'Twitter' },
                { Icon: Linkedin, label: 'LinkedIn' },
                { Icon: Github, label: 'GitHub' },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="https://example.com"
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-brand-300 hover:text-brand-600"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-slate-900">{column.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    <Link to={link.to} className="text-sm text-slate-500 transition-colors hover:text-brand-600">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} JobNest. Built with the MERN stack.
          </p>
          <p className="text-sm text-slate-400">Made for demo purposes.</p>
        </div>
      </div>
    </footer>
  )
}
