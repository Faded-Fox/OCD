import { NavLink, Outlet } from 'react-router-dom'
import { useTheme } from '../lib/useTheme'
import pawLogo from '../assets/paw-logo.png'

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/live', label: 'Live' },
  { to: '/journal', label: 'Journal' },
  { to: '/focus-plan', label: 'Focus Plan' },
  { to: '/ladders', label: 'Ladders' },
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

export default function Layout() {
  const { theme, toggle } = useTheme()

  return (
    <div className="mx-auto flex min-h-svh max-w-5xl flex-col px-4 pb-16 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 py-5">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <img src={pawLogo} alt="" className="h-8 w-8 rounded-xl shadow-sm" />
          <span>
            PocketFox<span className="hidden sm:inline"> Companion</span>
          </span>
        </NavLink>
        <nav className="flex flex-wrap items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
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
        <Outlet />
      </main>
      <footer className="mt-10 text-center text-xs text-slate-400 dark:text-slate-600">
        All data stays on this device. No accounts, no cloud sync, no analytics.
      </footer>
    </div>
  )
}
