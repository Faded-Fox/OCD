import { Link, useParams } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useSessions } from '../lib/useSessions'
import { useFearLadders } from '../lib/useFearLadders'
import { habituationTrend, peakSudsTrend, rungProgression, type RungProgressionRow } from '../lib/insights'
import { colorForHierarchy } from '../lib/colors'
import { Card, EmptyState, Badge } from '../components/ui'

export default function HierarchyView() {
  const { name } = useParams<{ name: string }>()
  const hierarchy = decodeURIComponent(name ?? '')
  const { sessions, loading } = useSessions()
  const { ladders, loading: laddersLoading } = useFearLadders()

  if (loading || laddersLoading) return <p className="py-10 text-center text-sm text-slate-400">Loading…</p>

  const hierarchySessions = sessions.filter((s) => (s.hierarchy || 'Unlabeled') === hierarchy)
  const ladder = ladders.find((l) => l.hierarchy === hierarchy)

  if (hierarchySessions.length === 0 && !ladder) {
    return <EmptyState title="No sessions found" body="This hierarchy has no logged sessions or planned ladder." />
  }

  const color = colorForHierarchy(hierarchy)
  const progression = rungProgression(hierarchySessions)
  const peakTrend = peakSudsTrend(hierarchySessions).map((p) => ({ ...p, label: `${p.date} · rung ${p.rung ?? '—'}` }))
  const habTrend = habituationTrend(hierarchySessions)
    .filter((h) => h.minutesToHabituate !== null)
    .map((h) => ({ ...h, label: `${h.date} · rung ${h.rung ?? '—'}` }))

  const sorted = [...hierarchySessions].sort((a, b) => b.date.localeCompare(a.date))

  // Merge the planned ladder (may include rungs never attempted) with actual
  // session-derived progress (may include rungs logged without a formal plan) —
  // union by rung number, sorted ascending.
  const rungNumbers = Array.from(
    new Set([...(ladder?.rungs.map((r) => r.rung) ?? []), ...progression.map((p) => p.rung)]),
  ).sort((a, b) => a - b)
  const mergedRungs = rungNumbers.map((rung) => ({
    rung,
    description: ladder?.rungs.find((r) => r.rung === rung)?.description || null,
    plannedTarget: ladder?.rungs.find((r) => r.rung === rung)?.targetSudsRange ?? null,
    progress: progression.find((p) => p.rung === rung) as RungProgressionRow | undefined,
  }))

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <Link to="/" className="text-sm text-violet-600 hover:underline dark:text-violet-400">
          ← Dashboard
        </Link>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold text-slate-900 dark:text-white">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color.hex }} />
          {hierarchy}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {hierarchySessions.length} session{hierarchySessions.length === 1 ? '' : 's'} logged
          {ladder && (
            <>
              {' · '}
              <Link to="/ladders" className="text-violet-600 hover:underline dark:text-violet-400">
                {ladder.rungs.length} rung{ladder.rungs.length === 1 ? '' : 's'} planned
              </Link>
            </>
          )}
          {!ladder && (
            <>
              {' · '}
              <Link to="/ladders" className="text-violet-600 hover:underline dark:text-violet-400">
                Plan this ladder
              </Link>
            </>
          )}
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Rung ladder</h2>
        <div className="flex flex-col gap-2">
          {mergedRungs.map(({ rung, description, plannedTarget, progress }) => {
            const targetRange = progress?.target_suds_range ?? plannedTarget
            return (
              <Card key={rung} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white" style={{ backgroundColor: color.hex }}>
                    {rung}
                  </span>
                  <div>
                    {description && (
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{description}</p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {progress
                        ? `${progress.attempts} attempt${progress.attempts === 1 ? '' : 's'} · last ${progress.lastAttemptDate}`
                        : 'Not attempted yet'}
                      {targetRange ? ` · target ${targetRange[0]}–${targetRange[1]}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {progress && progress.fullResistanceStreak > 0 && (
                    <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {progress.fullResistanceStreak}-session resistance streak
                    </Badge>
                  )}
                  {progress?.readySignal && (
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      Readiness signal
                    </Badge>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {peakTrend.length > 1 && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Peak SUDs trend</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={peakTrend} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  labelFormatter={(_l, payload) => payload?.[0]?.payload?.label}
                />
                <Line type="monotone" dataKey="peak_suds" name="Peak SUDs" stroke={color.hex} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {habTrend.length > 1 && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Habituation speed (minutes from peak to back-in-range)
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={habTrend} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  labelFormatter={(_l, payload) => payload?.[0]?.payload?.label}
                />
                <Line type="monotone" dataKey="minutesToHabituate" name="Minutes" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {hierarchySessions.length > 0 ? (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Sessions</h2>
          <div className="flex flex-col gap-2">
            {sorted.map((s) => (
              <Link key={s.id} to={`/session/${s.id}`}>
                <Card className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Rung {s.rung ?? '—'}
                    {s.variation ? ` · ${s.variation}` : ''}
                  </span>
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span>{s.date || 'no date'}</span>
                    <span>Peak {s.peak_suds ?? '—'} → End {s.end_suds ?? '—'}</span>
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
        </div>
      ) : (
        <Card>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No sessions logged for this hierarchy yet — this is just the plan so far. Start a{' '}
            <Link to="/live" className="text-violet-600 hover:underline dark:text-violet-400">
              live session
            </Link>{' '}
            against one of these rungs whenever you're ready.
          </p>
        </Card>
      )}
    </div>
  )
}
