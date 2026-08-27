import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

const tooltipStyle = {
  background: 'var(--panel-solid)',
  border: '1px solid var(--border-strong)',
  borderRadius: 10,
  fontSize: 12,
}

export function TrafficTrendChart({ data = [], height = 260 }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gTrend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" vertical={false} />
          <XAxis dataKey="hour" axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} unit="%" />
          <Tooltip contentStyle={tooltipStyle} />
          <Area
            type="monotone" dataKey="congestion" name="Congestion"
            stroke="#22d3ee" strokeWidth={2} fill="url(#gTrend)"
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function RoutePerformanceChart({ data = [], height = 260 }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" vertical={false} />
          <XAxis dataKey="route" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} interval={0} angle={-12} height={44} />
          <YAxis axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="distance" name="Distance (km)" fill="#3b82f6" radius={[4, 4, 0, 0]} animationDuration={900} />
          <Bar dataKey="time" name="Time (min)" fill="#a855f7" radius={[4, 4, 0, 0]} animationDuration={900} animationBegin={160} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TrafficDistributionChart({ data = [], height = 260 }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="52%"
            outerRadius="78%"
            paddingAngle={3}
            stroke="none"
            animationDuration={900}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ScalabilityChart({ data = [], height = 280 }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 6, right: 8, left: -12, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" vertical={false} />
          <XAxis
            dataKey="nodes" axisLine={false} tickLine={false}
            label={{ value: 'Network size (nodes)', position: 'insideBottom', offset: -2, fill: 'var(--text-faint)', fontSize: 11 }}
          />
          <YAxis axisLine={false} tickLine={false} unit="ms" />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="dijkstra" name="Dijkstra" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="qpso" name="QPSO" fill="#a855f7" radius={[4, 4, 0, 0]} />
          <Bar dataKey="pso" name="PSO" fill="#22d3ee" radius={[4, 4, 0, 0]} />
          <Bar dataKey="ga" name="GA" fill="#f97316" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
