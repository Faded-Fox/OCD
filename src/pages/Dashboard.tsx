import { Link } from 'react-router-dom'
import {
  CartesianGrid,
  Legend,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts'
import { useSessions } from '../lib/useSessions'
import {
  compulsionResistanceRate,
  compulsionResistanceRateByHierarchy,
  rungProgression,
  sessionFrequency,
} from '../lib/insights'
import { colorForHierarchy } from '../lib/colors'
import { Card, EmptyState, PrimaryButton, StatTile } from '../components/ui'
import HierarchyBadge from '../components/HierarchyBadge'

export default function Dashboard() {
  const { sessions, loading } = useSessions()

  if (loading) return <p className="py-10 text-center text-sm text-slate-400">Loading…</p>

  if (sessions.length === 0) {
    return (
      <EmptyState
        title="No sessions yet"
        body="Import a conversation export or pasted session text to start seeing trends and patterns here."
        action={
          <Link to="/import">
            <PrimaryButton>Import sessions</PrimaryButton>
          </Link>
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

  const readySignals = progression.filter((r) => r.readySignal)

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            A descriptive summary of logged sessions — not a diagnosis or a treatment recommendation.
          </p>
        </div>
        <Link to="/import">
          <PrimaryButton>Import more</PrimaryButton>
        </Link>
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

      {scatterData.length > 0 && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Peak SUDs over time</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis dataKey="date" type="category" tick={{ fontSize: 11 }} allowDuplicatedCategory={false} />
                <YAxis dataKey="peak" domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  formatter={(value, _name, payload) => [
                    `${value} SUDs`,
                    (payload?.payload as { hierarchy?: string } | undefined)?.hierarchy ?? '',
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {hierarchies.map((h) => (
                  <Scatter
                    key={h}
                    name={h}
                    data={scatterData.filter((d) => d.hierarchy === h)}
                    fill={colorForHierarchy(h).hex}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Card>
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
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Recent sessions</h2>
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
