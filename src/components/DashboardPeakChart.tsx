import { CartesianGrid, Legend, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { colorForHierarchy } from '../lib/colors'
import { Card } from './ui'

export default function DashboardPeakChart({
  scatterData,
  hierarchies,
}: {
  scatterData: { date: string; peak: number | null; hierarchy: string }[]
  hierarchies: string[]
}) {
  return (
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
  )
}
