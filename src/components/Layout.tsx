import { Suspense, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTheme } from '../lib/useTheme'
import pawLogo from '../assets/paw-logo.png'

// The four things reached most often stay as always-visible top-level pills;
// everything else lives behind "More" so the mobile header doesn't wrap into
// several rows of equally-weighted tabs.
const primaryNavItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/sessions', label: 'Sessions' },
  { to: '/live', label: 'Live' },
  { to: '/journal', label: 'Journal' },
]

const secondaryNavItems = [
  { to: '/focus-plan', label: 'Focus Plan' },
  { to: '/ladders', label: 'Fear Ladders' },
  { to: '/values', label: 'Values' },
  { to: '/flare-guide', label: 'Flare Guide' },
  { to: '/summary', label: 'Therapist Summary' },
  { to: '/import', label: 'Import' },
  { to: '/settings', label: 'Settings' },
]

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
    </svg>
  )
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9a2.5 2.5 0 1 1 3.5 2.29c-.7.3-1.25.86-1.25 1.71v.25" />
      <circle cx="12" cy="16.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  )
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`
}

function MoreMenu() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const isSecondaryActive = secondaryNavItems.some((item) => item.to === location.pathname)

  // Any navigation — from this menu or anywhere else — should leave it closed.
  useEffect(() => setOpen(false), [location.pathname])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
          isSecondaryActive
            ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
        }`}
      >
        More
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 flex w-52 flex-col gap-0.5 rounded-2xl bg-white p-1.5 shadow-lg ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            {secondaryNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function Layout() {
  const { theme, toggle } = useTheme()

  return (
    <div className="mx-auto flex min-h-svh max-w-5xl flex-col px-4 pb-16 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 py-5 print:hidden">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <img src={pawLogo} alt="" className="h-8 w-8 rounded-xl shadow-sm" />
          <span>
            PocketFox<span className="hidden sm:inline"> Companion</span>
          </span>
        </NavLink>
        <nav className="flex flex-wrap items-center gap-1">
          {primaryNavItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
          <MoreMenu />
          <NavLink
            to="/help"
            aria-label="Help"
            className={({ isActive }) =>
              `rounded-full p-2 transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`
            }
          >
            <HelpIcon />
          </NavLink>
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </nav>
      </header>
      <main className="flex-1">
        <Suspense fallback={<p className="py-10 text-center text-sm text-slate-400">Loading…</p>}>
          <Outlet />
        </Suspense>
      </main>
      <footer className="mt-10 text-center text-xs text-slate-400 dark:text-slate-600 print:hidden">
        All data stays on this device. No accounts, no cloud sync, no analytics.
      </footer>
    </div>
  )
}
