import {
  Bookmark,
  Briefcase,
  Building2,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Search,
  Shield,
  User as UserIcon,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/authContext'
import { cn } from '../../lib/format'
import { Avatar } from '../ui'

/** Primary nav items, each optionally restricted to one or more roles. */
const NAV_LINKS = [
  { to: '/jobs', label: 'Find Jobs', icon: Search },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['jobseeker'] },
  { to: '/employer', label: 'Employer Hub', icon: Briefcase, roles: ['employer'] },
  { to: '/admin', label: 'Admin', icon: Shield, roles: ['admin'] },
]

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Menus are closed explicitly by their own links rather than by an effect
  // watching the route, which keeps the open/closed state local to the click.
  const closeMenus = () => {
    setMobileOpen(false)
    setMenuOpen(false)
  }

  // Dismiss the user dropdown on outside click or Escape.
  useEffect(() => {
    function onPointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false)
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const visibleLinks = NAV_LINKS.filter(
    (link) => !link.roles || (user && link.roles.includes(user.role)),
  )

  const menuItems = [
    { to: '/profile', label: 'My Profile', icon: UserIcon },
    ...(user?.role === 'jobseeker'
      ? [
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/dashboard/applications', label: 'My Applications', icon: Briefcase },
          { to: '/dashboard/saved', label: 'Saved Jobs', icon: Bookmark },
        ]
      : []),
    ...(user?.role === 'employer'
      ? [
          { to: '/employer', label: 'Employer Hub', icon: LayoutDashboard },
          { to: '/employer/jobs/new', label: 'Post a Job', icon: PlusCircle },
        ]
      : []),
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin Panel', icon: Shield }] : []),
  ]

  function handleLogout() {
    closeMenus()
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex shrink-0 items-center gap-2 rounded-md" aria-label="JobNest home">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Briefcase className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Job<span className="text-brand-600">Nest</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-2 hidden items-center gap-1 md:flex" aria-label="Main">
          {visibleLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-slate-100"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <Avatar user={user} size="sm" />
                <span className="hidden max-w-28 truncate text-sm font-medium text-slate-700 sm:block">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', menuOpen && 'rotate-180')} aria-hidden="true" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-60 origin-top-right animate-[fade-in_0.15s_ease-out] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
                >
                  <div className="border-b border-slate-100 px-3 py-2.5">
                    <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                    <span className="mt-1.5 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 capitalize">
                      {user.role}
                    </span>
                  </div>

                  {menuItems.map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      role="menuitem"
                      onClick={closeMenus}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      {label}
                    </Link>
                  ))}

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center gap-2.5 rounded-lg border-t border-slate-100 px-3 py-2 text-sm text-rose-600 transition-colors hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className="btn-ghost">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary">
                Get started
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="btn-ghost px-2 md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {visibleLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={closeMenus}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium',
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100',
                  )
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}

            {!isAuthenticated && (
              <div className="mt-2 flex gap-2 border-t border-slate-100 pt-3">
                <Link to="/login" onClick={closeMenus} className="btn-secondary flex-1">
                  Sign in
                </Link>
                <Link to="/register" onClick={closeMenus} className="btn-primary flex-1">
                  Get started
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
