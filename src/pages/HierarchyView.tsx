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
import { habituationTrend, peakSudsTrend, rungProgression } from '../lib/insights'
import { colorForHierarchy } from '../lib/colors'
import { Card, EmptyState, Badge } from '../components/ui'

export default function HierarchyView() {
  const { name } = useParams<{ name: string }>()
  const hierarchy = decodeURIComponent(name ?? '')
  const { sessions, loading } = useSessions()

  if (loading) return <p className="py-10 text-center text-sm text-slate-400">Loading…</p>

  const hierarchySessions = sessions.filter((s) => (s.hierarchy || 'Unlabeled') === hierarchy)

  if (hierarchySessions.length === 0) {
    return <EmptyState title="No sessions found" body="This hierarchy has no logged sessions." />
  }

  const color = colorForHierarchy(hierarchy)
  const progression = rungProgression(hierarchySessions)
  const peakTrend = peakSudsTrend(hierarchySessions).map((p) => ({ ...p, label: `${p.date} · rung ${p.rung ?? '—'}` }))
  const habTrend = habituationTrend(hierarchySessions)
    .filter((h) => h.minutesToHabituate !== null)
    .map((h) => ({ ...h, label: `${h.date} · rung ${h.rung ?? '—'}` }))

  const sorted = [...hierarchySessions].sort((a, b) => b.date.localeCompare(a.date))

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
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Rung ladder</h2>
        <div className="flex flex-col gap-2">
          {progression.map((row) => (
            <Card key={row.rung} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white" style={{ backgroundColor: color.hex }}>
                  {row.rung}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {row.attempts} attempt{row.attempts === 1 ? '' : 's'}
                    {row.target_suds_range ? ` · target ${row.target_suds_range[0]}–${row.target_suds_range[1]}` : ''}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Last attempted {row.lastAttemptDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {row.fullResistanceStreak > 0 && (
                  <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {row.fullResistanceStreak}-session resistance streak
                  </Badge>
                )}
                {row.readySignal && (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    Readiness signal
                  </Badge>
                )}
              </div>
            </Card>
          ))}
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
    </div>
  )
}
