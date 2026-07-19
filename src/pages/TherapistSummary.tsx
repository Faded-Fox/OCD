import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSessions } from '../lib/useSessions'
import { useJournalEntries } from '../lib/useJournalEntries'
import { useFocusPlanEntries } from '../lib/useFocusPlanEntries'
import { useFearLadders } from '../lib/useFearLadders'
import { buildTherapistSummary, buildTherapistSummaryText, rangeLabel } from '../lib/therapistSummary'
import { Card, EmptyState, PrimaryButton, SecondaryButton, StatTile } from '../components/ui'
import HierarchyBadge from '../components/HierarchyBadge'
import { inputClass } from '../components/SessionFields'

function fmtPct(rate: number | null): string {
  return rate !== null ? `${Math.round(rate * 100)}%` : '—'
}

function fmtSuds(n: number | null): string {
  return n !== null ? String(Math.round(n * 10) / 10) : '—'
}

export default function TherapistSummary() {
  const { sessions, loading: sessionsLoading } = useSessions()
  const { entries: journalEntries, loading: journalLoading } = useJournalEntries()
  const { entries: focusPlans, loading: focusPlansLoading } = useFocusPlanEntries()
  const { ladders: fearLadders, loading: laddersLoading } = useFearLadders()
  const [range, setRange] = useState({ from: '', to: '' })
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  const loading = sessionsLoading || journalLoading || focusPlansLoading || laddersLoading

  if (loading) return <p className="py-10 text-center text-sm text-slate-400">Loading…</p>

  if (sessions.length === 0) {
    return (
      <EmptyState
        title="Nothing to summarize yet"
        body="Log a few sessions first, and a printable summary — resistance rates, recent sessions, focus plan debriefs — will show up here to bring to your therapist."
        action={
          <Link to="/live">
            <PrimaryButton>Start live session</PrimaryButton>
          </Link>
        }
      />
    )
  }

  const summary = buildTherapistSummary({ sessions, journalEntries, focusPlans, fearLadders }, range)

  const handlePrint = () => window.print()

  const handleShare = async () => {
    const text = buildTherapistSummaryText(summary)
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'ERP Therapy Summary', text })
        return
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      setShareStatus('copied')
      setTimeout(() => setShareStatus('idle'), 2000)
    } catch {
      setShareStatus('error')
      setTimeout(() => setShareStatus('idle'), 2000)
    }
  }

  const hasRange = range.from !== '' || range.to !== ''

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Therapist Summary</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            A printable report to bring to a session — separate from the raw JSON backup in Settings.
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          {shareStatus === 'copied' && (
            <span className="text-sm text-emerald-700 dark:text-emerald-400">Copied to clipboard</span>
          )}
          {shareStatus === 'error' && <span className="text-sm text-rose-600 dark:text-rose-400">Couldn't copy</span>}
          <SecondaryButton onClick={handleShare}>Share</SecondaryButton>
          <PrimaryButton onClick={handlePrint}>Print / Save as PDF</PrimaryButton>
        </div>
      </div>

      <Card className="flex flex-wrap items-end gap-3 print:hidden">
        <label className="flex w-40 min-w-0 shrink-0 flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">From</span>
          <input
            type="date"
            value={range.from}
            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            className={`${inputClass} h-10 min-w-0 appearance-none py-0`}
          />
        </label>
        <label className="flex w-40 min-w-0 shrink-0 flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">To</span>
          <input
            type="date"
            value={range.to}
            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            className={`${inputClass} h-10 min-w-0 appearance-none py-0`}
          />
        </label>
        {hasRange && (
          <button
            type="button"
            onClick={() => setRange({ from: '', to: '' })}
            className="h-10 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
          >
            All time
          </button>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Sessions" value={summary.totalSessions} sub={rangeLabel(summary)} />
        <StatTile label="Hierarchies" value={summary.hierarchyCount} />
        <StatTile label="Full resistance rate" value={fmtPct(summary.overallResistanceRate)} />
        <StatTile label="Journal entries" value={summary.journalEntryCount} sub="logged in this period" />
      </div>

      {summary.hierarchyRows.length > 0 && (
        <Card className="overflow-x-auto">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">By hierarchy</h2>
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-1.5 pr-3 font-medium">Hierarchy</th>
                <th className="py-1.5 pr-3 font-medium">Sessions</th>
                <th className="py-1.5 pr-3 font-medium">Resistance</th>
                <th className="py-1.5 pr-3 font-medium">Avg peak</th>
                <th className="py-1.5 pr-3 font-medium">Last attempted</th>
                <th className="py-1.5 pr-3 font-medium">Avg gap</th>
                <th className="py-1.5 font-medium">Ready to progress</th>
              </tr>
            </thead>
            <tbody>
              {summary.hierarchyRows.map((r) => (
                <tr key={r.hierarchy} className="border-b border-slate-100 last:border-0 dark:border-slate-900">
                  <td className="py-1.5 pr-3">
                    <HierarchyBadge hierarchy={r.hierarchy} />
                  </td>
                  <td className="py-1.5 pr-3 text-slate-700 dark:text-slate-300">{r.sessionCount}</td>
                  <td className="py-1.5 pr-3 text-slate-700 dark:text-slate-300">{fmtPct(r.resistanceRate)}</td>
                  <td className="py-1.5 pr-3 text-slate-700 dark:text-slate-300">{fmtSuds(r.avgPeakSuds)}</td>
                  <td className="py-1.5 pr-3 text-slate-700 dark:text-slate-300">{r.lastSessionDate ?? '—'}</td>
                  <td className="py-1.5 pr-3 text-slate-700 dark:text-slate-300">
                    {r.avgGapDays !== null ? `~${Math.round(r.avgGapDays)}d` : '—'}
                  </td>
                  <td className="py-1.5 text-slate-700 dark:text-slate-300">{r.readySignalCount || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {summary.sessionRows.length > 0 && (
        <Card className="overflow-x-auto">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Sessions in this period ({summary.sessionRows.length})
          </h2>
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-1.5 pr-3 font-medium">Date</th>
                <th className="py-1.5 pr-3 font-medium">Hierarchy</th>
                <th className="py-1.5 pr-3 font-medium">Rung</th>
                <th className="py-1.5 pr-3 font-medium">Peak → End</th>
                <th className="py-1.5 font-medium">Resistance</th>
              </tr>
            </thead>
            <tbody>
              {summary.sessionRows.map((s, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0 dark:border-slate-900">
                  <td className="py-1.5 pr-3 whitespace-nowrap text-slate-700 dark:text-slate-300">{s.date}</td>
                  <td className="py-1.5 pr-3">
                    <HierarchyBadge hierarchy={s.hierarchy} />
                  </td>
                  <td className="py-1.5 pr-3 text-slate-700 dark:text-slate-300">
                    {s.rung ?? '—'}
                    {s.variation ? ` (${s.variation})` : ''}
                  </td>
                  <td className="py-1.5 pr-3 text-slate-700 dark:text-slate-300">
                    {s.peakSuds ?? '—'} → {s.endSuds ?? '—'}
                  </td>
                  <td className="py-1.5 text-slate-700 dark:text-slate-300">
                    {s.resisted === true ? 'Fully resisted' : s.resisted === false ? 'Partial' : 'Unknown'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {summary.focusPlanRows.length > 0 && (
        <Card className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Focus Plan debriefs</h2>
          {summary.focusPlanRows.map((p, i) => (
            <div key={i} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0 dark:border-slate-900">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {p.taskDescription || 'Untitled task'}
                </span>
                <span className="text-xs text-slate-400">
                  {p.date} · {p.completed === 'yes' ? 'Completed' : p.completed === 'partial' ? 'Partially completed' : 'Not completed'}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Peak {p.peakSuds ?? '—'} → End {p.endSuds ?? '—'}
              </p>
              {p.whatWorked.trim() && (
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-medium">What worked: </span>
                  {p.whatWorked}
                </p>
              )}
              {p.whatWouldDoDifferently.trim() && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-medium">Would do differently: </span>
                  {p.whatWouldDoDifferently}
                </p>
              )}
            </div>
          ))}
        </Card>
      )}

      {summary.ladderRows.length > 0 && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Planned fear ladders</h2>
          <div className="flex flex-wrap gap-2">
            {summary.ladderRows.map((l) => (
              <span
                key={l.hierarchy}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {l.hierarchy} — {l.rungCount} rung{l.rungCount === 1 ? '' : 's'} planned
              </span>
            ))}
          </div>
        </Card>
      )}

      <p className="text-xs text-slate-400">
        This is a descriptive summary of self-reported data — not a diagnosis or treatment recommendation.
      </p>
    </div>
  )
}
