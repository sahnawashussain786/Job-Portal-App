import { Outlet, ScrollRestoration } from 'react-router-dom'
import Footer from './Footer'
import Navbar from './Navbar'

/** App shell: sticky navbar, routed content, footer pinned to the bottom. */
export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <Navbar />

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <Footer />
      <ScrollRestoration />
    </div>
  )
}
