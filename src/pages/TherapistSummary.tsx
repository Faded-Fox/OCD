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
import { urgeResponseLabel } from '../lib/session'

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
        <StatTile label="Rungs attempted" value={summary.totalRungsAttempted} />
        <StatTile label="Journal entries" value={summary.journalEntryCount} sub="logged in this period" />
      </div>

      {summary.hierarchyRows.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">By hierarchy</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {summary.hierarchyRows.map((r) => (
              <Card key={r.hierarchy} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <HierarchyBadge hierarchy={r.hierarchy} />
                  <span className="text-xs text-slate-400">
                    {r.sessionCount} session{r.sessionCount === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-semibold text-slate-900 dark:text-white">{r.rungsAttempted}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    rung{r.rungsAttempted === 1 ? '' : 's'} attempted
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Avg peak {fmtSuds(r.avgPeakSuds)} SUDS</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Last attempted {r.lastSessionDate ?? '—'}</p>
                {r.avgGapDays !== null && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ~{Math.round(r.avgGapDays)} day avg gap
                  </p>
                )}
                {r.readySignalCount > 0 && (
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    {r.readySignalCount} rung{r.readySignalCount === 1 ? '' : 's'} showing readiness to progress
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {summary.sessionRows.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Sessions in this period ({summary.sessionRows.length})
          </h2>
          <div className="flex flex-col gap-2">
            {summary.sessionRows.map((s, i) => (
              <Card key={i} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="flex items-center gap-3">
                  <HierarchyBadge hierarchy={s.hierarchy} />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Rung {s.rung ?? '—'}
                    {s.variation ? ` (${s.variation})` : ''}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span>{s.date}</span>
                  <span>
                    Peak {s.peakSuds ?? '—'} → End {s.endSuds ?? '—'}
                  </span>
                  <span>{urgeResponseLabel(s.resisted)}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
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
