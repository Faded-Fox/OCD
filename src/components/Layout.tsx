import { Suspense, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTheme } from '../lib/useTheme'
import pawLogo from '../assets/paw-logo.png'

// The four things reached most often stay as always-visible top-level pills;
// everything else lives behind "More" so the mobile header doesn't wrap into
// several rows of equally-weighted tabs.
const primaryNavItems: { to: string; label: string; section: NavSection }[] = [
  { to: '/', label: 'Dashboard', section: 'dashboard' },
  { to: '/sessions', label: 'Sessions', section: 'sessions' },
  { to: '/live', label: 'Live', section: 'live' },
  { to: '/journal', label: 'Journal', section: 'journal' },
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

type NavSection = 'dashboard' | 'sessions' | 'live' | 'journal' | 'more'

// Route-aware rather than styled per-page: a couple of real routes
// (/session/:id, /hierarchy/:name) have no exact entry in either nav list
// above — the first because it's a plural/singular mismatch with "Sessions",
// the second because it's a Fear Ladders drill-down living inside "More" —
// so left as exact-match checks, neither Sessions nor More ever highlighted
// on those pages. Any future nested route just needs one clause here.
function sectionForPath(pathname: string): NavSection | null {
  if (pathname === '/') return 'dashboard'
  if (pathname === '/sessions' || pathname.startsWith('/session/')) return 'sessions'
  if (pathname === '/live') return 'live'
  if (pathname === '/journal') return 'journal'
  if (secondaryNavItems.some((item) => item.to === pathname) || pathname.startsWith('/hierarchy/')) return 'more'
  return null
}

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

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <circle cx="5" cy="12" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="19" cy="12" r="1.75" />
    </svg>
  )
}

function pillClass(isActive: boolean) {
  return `rounded-full px-2 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-inverse text-on-inverse shadow-sm' : 'text-text-secondary hover:bg-surface-muted'
  }`
}

function iconButtonClass(isActive: boolean) {
  return `rounded-full p-2 transition-colors ${
    isActive ? 'bg-inverse text-on-inverse shadow-sm' : 'text-text-secondary hover:bg-surface-muted'
  }`
}

function MoreMenu({ isActive }: { isActive: boolean }) {
  const location = useLocation()
  const [open, setOpen] = useState(false)

  // Any navigation — from this menu or anywhere else — should leave it closed.
  useEffect(() => setOpen(false), [location.pathname])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="More"
        className={iconButtonClass(isActive)}
      >
        <MoreIcon />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          {/* Below sm (640px) this renders as a viewport-anchored sheet spanning
              the same 1rem margins as the header's own edges, so it can never
              overflow left or right at any of the 320–430px widths this app
              targets — anchoring it to the button itself (as a fixed-width
              popover) was what let it run past the left edge on narrow phones.
              From sm up there's comfortably enough room for the original
              compact anchored popover. */}
          <div className="fixed inset-x-4 top-[calc(env(safe-area-inset-top)+7.75rem)] z-20 flex flex-col gap-0.5 rounded-2xl bg-surface p-1.5 shadow-lg ring-1 ring-border sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-56">
            {secondaryNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-inverse text-on-inverse' : 'text-text-secondary hover:bg-surface-muted'
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
  const location = useLocation()
  const activeSection = sectionForPath(location.pathname)

  return (
    <div className="mx-auto flex min-h-svh max-w-5xl flex-col px-4 pb-16 sm:px-6">
      {/* pt uses max() rather than a flat inset so non-notched devices/browsers
          (where env() resolves to 0px) keep today's exact 1.25rem spacing —
          only devices that actually need clearance for a notch/Dynamic Island
          get pushed further down. */}
      {/* Two deliberate rows rather than one that wraps organically — at 320px
          a single flex row can't fit the logo, all 4 primary pills, and the
          utility cluster together, and letting it wrap wherever space ran
          out split "Journal" onto the icon cluster's row instead of staying
          with its siblings. Logo + the compact icon cluster share a row
          (comfortably fits at any width this app targets); primary nav gets
          a full-width row of its own underneath, so it's never competing
          with anything else for space. */}
      <header className="flex flex-col gap-3 pt-[max(1.25rem,env(safe-area-inset-top))] pb-5 print:hidden">
        <div className="flex items-center justify-between gap-4">
          <NavLink to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <img src={pawLogo} alt="" className="h-8 w-8 rounded-xl shadow-sm" />
            <span>
              PocketFox<span className="hidden sm:inline"> Companion</span>
            </span>
          </NavLink>
          <div className="flex items-center gap-1">
            <MoreMenu isActive={activeSection === 'more'} />
            <NavLink to="/help" aria-label="Help" className={() => iconButtonClass(location.pathname === '/help')}>
              <HelpIcon />
            </NavLink>
            <button type="button" onClick={toggle} aria-label="Toggle dark mode" className={iconButtonClass(false)}>
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-1">
          {primaryNavItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={() => pillClass(activeSection === item.section)}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1">
        <Suspense fallback={<p className="py-10 text-center text-sm text-text-secondary">Loading…</p>}>
          <Outlet />
        </Suspense>
      </main>
      <footer className="mt-10 text-center text-xs text-text-secondary print:hidden">
        All data stays on this device. No accounts, no cloud sync, no analytics.
      </footer>
    </div>
  )
}
