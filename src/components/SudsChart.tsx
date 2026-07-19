import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function SudsChart({
  points,
  isTimeBased,
  targetRange,
  colorHex,
  heightClassName = 'h-56',
}: {
  points: { x: number; suds: number; label: string }[]
  isTimeBased: boolean
  targetRange: [number, number] | null
  colorHex: string
  heightClassName?: string
}) {
  return (
    <div className={`${heightClassName} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
          {targetRange && <ReferenceArea y1={targetRange[0]} y2={targetRange[1]} fill={colorHex} fillOpacity={0.08} />}
          <XAxis
            dataKey="x"
            tick={{ fontSize: 11 }}
            label={{ value: isTimeBased ? 'minutes' : 'reading order', position: 'insideBottom', offset: -4, fontSize: 11 }}
          />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ borderRadius: 12, fontSize: 12 }}
            formatter={(value) => [`${value} SUDs`, '']}
            labelFormatter={(x, payload) =>
              isTimeBased ? `${payload?.[0]?.payload?.label ?? ''} · ${x} min` : `${payload?.[0]?.payload?.label ?? ''}`
            }
          />
          <Line type="monotone" dataKey="suds" stroke={colorHex} strokeWidth={2.5} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
