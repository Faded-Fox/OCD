import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSessions } from '../lib/useSessions'
import { Card, EmptyState, PrimaryButton, SecondaryButton } from '../components/ui'
import HierarchyBadge from '../components/HierarchyBadge'
import { inputClass } from '../components/SessionFields'
import type { Session } from '../lib/types'

type SortOrder = 'newest' | 'oldest' | 'peak-desc' | 'peak-asc'
type ResistanceFilter = 'any' | 'full' | 'partial' | 'unknown'

const emptyFilters = {
  query: '',
  hierarchy: 'all',
  resistance: 'any' as ResistanceFilter,
  dateFrom: '',
  dateTo: '',
  sort: 'newest' as SortOrder,
}

function matchesSearch(session: Session, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = [
    session.hierarchy,
    session.rung_description,
    session.variation ?? '',
    session.notes,
    ...session.compulsions_targeted,
    ...session.techniques_used,
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(q)
}

export default function Sessions() {
  const { sessions, loading } = useSessions()
  const [filters, setFilters] = useState(emptyFilters)

  const hierarchies = useMemo(
    () => Array.from(new Set(sessions.map((s) => s.hierarchy || 'Unlabeled'))).sort(),
    [sessions],
  )

  const patch = (p: Partial<typeof filters>) => setFilters((f) => ({ ...f, ...p }))

  const filtered = useMemo(() => {
    let result = sessions.filter((s) => {
      if (!matchesSearch(s, filters.query)) return false
      if (filters.hierarchy !== 'all' && (s.hierarchy || 'Unlabeled') !== filters.hierarchy) return false
      if (filters.resistance === 'full' && s.compulsions_resisted !== true) return false
      if (filters.resistance === 'partial' && s.compulsions_resisted !== false) return false
      if (filters.resistance === 'unknown' && s.compulsions_resisted !== null) return false
      if (filters.dateFrom && s.date < filters.dateFrom) return false
      if (filters.dateTo && s.date > filters.dateTo) return false
      return true
    })

    result = [...result].sort((a, b) => {
      switch (filters.sort) {
        case 'oldest':
          return a.date.localeCompare(b.date)
        case 'peak-desc':
          return (b.peak_suds ?? -1) - (a.peak_suds ?? -1)
        case 'peak-asc':
          return (a.peak_suds ?? 11) - (b.peak_suds ?? 11)
        case 'newest':
        default:
          return b.date.localeCompare(a.date)
      }
    })

    return result
  }, [sessions, filters])

  const hasActiveFilters =
    filters.query !== '' ||
    filters.hierarchy !== 'all' ||
    filters.resistance !== 'any' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== ''

  if (loading) return <p className="py-10 text-center text-sm text-slate-400">Loading…</p>

  if (sessions.length === 0) {
    return (
      <EmptyState
        title="No sessions yet"
        body="Run a live session, or import a conversation export or pasted session text to start browsing them here."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/live">
              <PrimaryButton>Start live session</PrimaryButton>
            </Link>
            <Link to="/import">
              <SecondaryButton>Import sessions</SecondaryButton>
            </Link>
          </div>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Sessions</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Search and filter every logged session, across all hierarchies.
        </p>
      </div>

      <Card className="flex flex-col gap-3">
        <input
          type="text"
          value={filters.query}
          onChange={(e) => patch({ query: e.target.value })}
          placeholder="Search notes, scenario, compulsions, techniques…"
          className={`${inputClass} h-10 py-0`}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Hierarchy
            </span>
            <select
              value={filters.hierarchy}
              onChange={(e) => patch({ hierarchy: e.target.value })}
              className={`${inputClass} h-10 min-w-0 py-0`}
            >
              <option value="all">All</option>
              {hierarchies.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Resistance
            </span>
            <select
              value={filters.resistance}
              onChange={(e) => patch({ resistance: e.target.value as ResistanceFilter })}
              className={`${inputClass} h-10 min-w-0 py-0`}
            >
              <option value="any">Any</option>
              <option value="full">Fully resisted</option>
              <option value="partial">Partial</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              From
            </span>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => patch({ dateFrom: e.target.value })}
              className={`${inputClass} h-10 min-w-0 py-0`}
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              To
            </span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => patch({ dateTo: e.target.value })}
              className={`${inputClass} h-10 min-w-0 py-0`}
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Sort
            </span>
            <select
              value={filters.sort}
              onChange={(e) => patch({ sort: e.target.value as SortOrder })}
              className={`${inputClass} h-10 w-auto py-0`}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="peak-desc">Highest peak SUDs</option>
              <option value="peak-asc">Lowest peak SUDs</option>
            </select>
          </label>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => setFilters(emptyFilters)}
              className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
            >
              Clear filters
            </button>
          )}
        </div>
      </Card>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        {filtered.length} of {sessions.length} session{sessions.length === 1 ? '' : 's'}
      </p>

      {filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500 dark:text-slate-400">No sessions match these filters.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((s) => (
            <Link key={s.id} to={`/session/${s.id}`}>
              <Card className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="flex items-center gap-3">
                  <HierarchyBadge hierarchy={s.hierarchy} />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {s.rung !== null ? `Rung ${s.rung}` : 'Rung —'}
                    {s.variation ? ` · ${s.variation}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span>{s.date || 'no date'}</span>
                  <span>
                    Peak {s.peak_suds ?? '—'} → End {s.end_suds ?? '—'}
                  </span>
                  <span>
                    {s.compulsions_resisted === true
                      ? 'Fully resisted'
                      : s.compulsions_resisted === false
                        ? 'Partial resistance'
                        : 'Resistance unknown'}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
