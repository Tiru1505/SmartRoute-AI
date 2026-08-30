import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

/* Recharts defaults its legend and label text to a near-black (#333) that
   disappears against a dark panel — this was why the traffic-distribution
   legend was unreadable. Every chart passes an explicit colour instead. */
const legendStyle = { fontSize: 11, color: 'var(--text-dim)' }
const axisTick = { fill: 'var(--text-faint)', fontSize: 11 }

const tooltipStyle = {
  background: 'var(--panel-solid)',
  border: '1px solid var(--border-strong)',
  borderRadius: 10,
  fontSize: 12,
  color: 'var(--text)',
}

export function TrafficTrendChart({ data = [], height = 260 }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gTrend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" vertical={false} />
          <XAxis dataKey="hour" axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} unit="%" />
          <Tooltip contentStyle={tooltipStyle} />
          <Area
            type="monotone" dataKey="congestion" name="Congestion"
            stroke="#2dd4bf" strokeWidth={2} fill="url(#gTrend)"
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function RoutePerformanceChart({ data = [], height = 260 }) {
  // These are real optimisation results now, so before any route has been run
  // there is genuinely nothing to plot. Say so, rather than drawing empty axes
  // that look like a loading failure.
  if (!data.length) {
    return (
      <div
        style={{
          width: '100%', height, display: 'grid', placeItems: 'center',
          textAlign: 'center', padding: 16,
        }}
      >
        <p style={{ fontSize: 11.5, color: 'var(--text-faint)', lineHeight: 1.5 }}>
          No routes optimised yet.<br />
          Run the optimiser and recent routes will appear here.
        </p>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        {/* Angled labels are anchored at their right end, so they extend to the
            LEFT of their tick. A negative left margin clipped the first one to
            "…d - RGIA Airport"; this gives them the room they need. */}
        <BarChart data={data} margin={{ top: 6, right: 8, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" vertical={false} />
          {/* Route names are "Hitec City → Charminar", not short codes, so they
              need real room. Angled at 30 degrees with a taller axis and an
              explicit anchor, otherwise the labels overlap and get clipped. */}
          <XAxis
            dataKey="route"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10 }}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={86}
          />
          <YAxis axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: 'rgba(255,255,255,.04)' }}
            labelFormatter={(v) => v}
          />
          <Legend wrapperStyle={legendStyle} />
          <Bar dataKey="distance" name="Distance (km)" fill="#6366f1" radius={[4, 4, 0, 0]} animationDuration={900} />
          <Bar dataKey="time" name="Time (min)" fill="#e879f9" radius={[4, 4, 0, 0]} animationDuration={900} animationBegin={160} />
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
            label={({ name, value }) => `${name} ${value}%`}
            labelLine={{ stroke: 'var(--border-strong)' }}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
          <Legend wrapperStyle={legendStyle} />
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
          <Legend wrapperStyle={legendStyle} />
          <Bar dataKey="dijkstra" name="Dijkstra" fill="#34d399" radius={[4, 4, 0, 0]} />
          <Bar dataKey="qpso" name="QPSO" fill="#e879f9" radius={[4, 4, 0, 0]} />
          <Bar dataKey="pso" name="PSO" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
          <Bar dataKey="ga" name="GA" fill="#fb923c" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
