import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSessions } from '../lib/useSessions'
import { useJournalEntries } from '../lib/useJournalEntries'
import { useFocusPlanEntries } from '../lib/useFocusPlanEntries'
import { useFearLadders } from '../lib/useFearLadders'
import { useFlareGuide } from '../lib/useFlareGuide'
import { isFlareGuideEmpty } from '../lib/flareGuide'
import {
  compulsionResistanceRate,
  compulsionResistanceRateByHierarchy,
  rungProgression,
  sessionFrequency,
} from '../lib/insights'
import { downloadBackup } from '../lib/export'
import { isExportOverdue, snoozeExportReminder } from '../lib/exportReminder'
import { Card, EmptyState, PrimaryButton, SecondaryButton, StatTile } from '../components/ui'
import HierarchyBadge from '../components/HierarchyBadge'

// Recharts is a heavy dependency, and a session-less Dashboard never renders this
// chart at all — deferring it keeps the very first (empty-state) load from paying
// for it, and every later load only pays for it once, from cache.
const DashboardPeakChart = lazy(() => import('../components/DashboardPeakChart'))

export default function Dashboard() {
  const { sessions, loading } = useSessions()
  const { entries: journalEntries } = useJournalEntries()
  const { entries: focusPlans } = useFocusPlanEntries()
  const { ladders: fearLadders } = useFearLadders()
  const { guide: flareGuide } = useFlareGuide()
  const [showReminder, setShowReminder] = useState(false)
  const [reminderExporting, setReminderExporting] = useState(false)

  useEffect(() => {
    if (!loading) setShowReminder(isExportOverdue(sessions.length > 0))
  }, [loading, sessions.length])

  const dismissReminder = () => {
    snoozeExportReminder()
    setShowReminder(false)
  }

  const exportNow = async () => {
    setReminderExporting(true)
    await downloadBackup()
    setReminderExporting(false)
    setShowReminder(false)
  }

  if (loading) return <p className="py-10 text-center text-sm text-slate-400">Loading…</p>

  if (sessions.length === 0) {
    return (
      <EmptyState
        title="No sessions yet"
        body="Run a live session, or import a conversation export or pasted session text to start seeing trends and patterns here."
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

  const hierarchies = Array.from(new Set(sessions.map((s) => s.hierarchy || 'Unlabeled'))).sort()
  const overallRate = compulsionResistanceRate(sessions)
  const rateByHierarchy = compulsionResistanceRateByHierarchy(sessions)
  const progression = rungProgression(sessions)
  const gaps = sessionFrequency(sessions)
  const recent = [...sessions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)

  const scatterData = sessions
    .filter((s) => s.peak_suds !== null)
    .map((s) => ({ date: s.date, peak: s.peak_suds, hierarchy: s.hierarchy || 'Unlabeled', session: s }))

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const journalThisWeek = journalEntries.filter((e) => e.date >= sevenDaysAgo).length
  const focusPlansPending = focusPlans.filter((e) => e.completed === null).length
  const flareGuideReady = Boolean(flareGuide && !isFlareGuideEmpty(flareGuide))

  const readySignals = progression.filter((r) => r.readySignal)

  return (
    <div className="flex flex-col gap-6 py-4">
      {showReminder && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            It's been about a week since your last backup. Export your data in case this app ever gets
            deleted or reinstalled.
          </p>
          <div className="flex shrink-0 gap-2">
            <SecondaryButton
              onClick={dismissReminder}
              className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-900"
            >
              Remind me later
            </SecondaryButton>
            <PrimaryButton onClick={exportNow} disabled={reminderExporting}>
              {reminderExporting ? 'Exporting…' : 'Export now'}
            </PrimaryButton>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            A descriptive summary of logged sessions — not a diagnosis or a treatment recommendation.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/live">
            <PrimaryButton>Start live session</PrimaryButton>
          </Link>
          <Link to="/import">
            <SecondaryButton>Import more</SecondaryButton>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Sessions logged" value={sessions.length} />
        <StatTile label="Hierarchies" value={hierarchies.length} />
        <StatTile
          label="Full resistance rate"
          value={overallRate.rate !== null ? `${Math.round(overallRate.rate * 100)}%` : '—'}
          sub={overallRate.knownTotal ? `${overallRate.fullyResistedCount}/${overallRate.knownTotal} sessions` : undefined}
        />
        <StatTile label="Readiness signals" value={readySignals.length} sub="rungs showing two-in-a-row full resistance" />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Elsewhere in the app</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <LinkStatTile to="/journal" label="Journal" value={journalThisWeek} sub="entries this week" />
          <LinkStatTile
            to="/focus-plan"
            label="Focus Plan"
            value={focusPlansPending}
            sub={focusPlansPending === 1 ? 'plan awaiting debrief' : 'plans awaiting debrief'}
          />
          <LinkStatTile
            to="/ladders"
            label="Ladders"
            value={fearLadders.length}
            sub={fearLadders.length === 1 ? 'hierarchy planned' : 'hierarchies planned'}
          />
          <LinkStatTile
            to="/flare-guide"
            label="Flare Guide"
            value={flareGuideReady ? 'Ready' : 'Not set up'}
          />
        </div>
      </div>

      {scatterData.length > 0 && (
        <Suspense fallback={<Card className="h-[21.5rem]">{null}</Card>}>
          <DashboardPeakChart scatterData={scatterData} hierarchies={hierarchies} />
        </Suspense>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">By hierarchy</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {hierarchies.map((h) => {
            const rate = rateByHierarchy[h]
            const count = sessions.filter((s) => (s.hierarchy || 'Unlabeled') === h).length
            const gapInfo = gaps.find((g) => g.hierarchy === h)
            return (
              <Link key={h} to={`/hierarchy/${encodeURIComponent(h)}`}>
                <Card className="h-full">
                  <div className="flex items-center justify-between">
                    <HierarchyBadge hierarchy={h} />
                    <span className="text-xs text-slate-400">{count} session{count === 1 ? '' : 's'}</span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-xl font-semibold text-slate-900 dark:text-white">
                      {rate.rate !== null ? `${Math.round(rate.rate * 100)}%` : '—'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">full resistance</span>
                  </div>
                  {gapInfo?.avgGapDays !== null && gapInfo?.avgGapDays !== undefined && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      ~{Math.round(gapInfo.avgGapDays)} day avg gap between sessions
                    </p>
                  )}
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Recent sessions</h2>
          <Link to="/sessions" className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            Search all sessions
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {recent.map((s) => (
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
                  <span>Peak {s.peak_suds ?? '—'} → End {s.end_suds ?? '—'}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function LinkStatTile({
  to,
  label,
  value,
  sub,
}: {
  to: string
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <Link to={to}>
      <StatTile label={label} value={value} sub={sub} />
    </Link>
  )
}
