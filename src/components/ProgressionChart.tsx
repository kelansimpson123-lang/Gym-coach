import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { ExercisePerformance } from '../models'

interface ProgressionChartProps {
  history: ExercisePerformance[]
}

export default function ProgressionChart({ history }: ProgressionChartProps) {
  const numeric = history
    .filter((h): h is ExercisePerformance & { workingWeight: number } =>
      typeof h.workingWeight === 'number',
    )
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))

  if (numeric.length < 2) {
    return null
  }

  const data = numeric.map((entry) => ({
    date: entry.date.slice(5), // MM-DD, keeps axis labels short
    weight: entry.workingWeight,
  }))

  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#6B7280' }}
            axisLine={{ stroke: '#2A2F37' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1C2026',
              border: '1px solid #2A2F37',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: '#A2ABB8' }}
            itemStyle={{ color: '#8FBF6B' }}
            formatter={(value) => [`${value}kg`, 'Weight']}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#8FBF6B"
            strokeWidth={2}
            dot={{ r: 3, fill: '#8FBF6B' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
