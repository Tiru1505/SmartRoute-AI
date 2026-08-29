import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity } from 'lucide-react'

const SERIES = [
  { key: 'QPSO', color: '#e879f9', width: 2.4 },
  { key: 'PSO', color: '#2dd4bf', width: 1.8 },
  { key: 'GA', color: '#fb923c', width: 1.8 },
]

export default function ConvergenceChart({ data = [], summary = {}, height = 300 }) {
  return (
    <div className="card chart-card">
      <div className="row-between" style={{ marginBottom: 12 }}>
        <div className="card-title quantum" style={{ margin: 0 }}>
          <Activity size={13} />
          Convergence — Iteration vs Best Fitness
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>lower is better</span>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 10, left: -18, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
            <XAxis
              dataKey="iteration"
              axisLine={false}
              tickLine={false}
              label={{ value: 'Iteration', position: 'insideBottom', offset: -2, fill: 'var(--text-faint)', fontSize: 11 }}
            />
            <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: 'var(--panel-solid)',
                border: '1px solid var(--border-strong)',
                borderRadius: 10,
                fontSize: 12,
                color: 'var(--text)',
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-dim)' }} />
            {SERIES.map((s, i) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={s.width}
                dot={false}
                isAnimationActive
                animationDuration={1100}
                animationBegin={i * 220}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {Object.keys(summary).length > 0 && (
        <div className="grid grid-3" style={{ marginTop: 12, gap: 10 }}>
          {SERIES.map((s) => {
            const d = summary[s.key]
            if (!d) return null
            return (
              <div
                key={s.key}
                style={{
                  padding: 11,
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(0,0,0,.2)',
                  border: `1px solid ${s.color}33`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                  <span className="dot" style={{ background: s.color }} />
                  <strong style={{ fontSize: 12 }}>{s.key}</strong>
                </div>
                <div className="row-between" style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                  <span>Iterations</span>
                  <span className="mono" style={{ color: 'var(--text)' }}>{d.iterations}</span>
                </div>
                <div className="row-between" style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                  <span>Best fitness</span>
                  <span className="mono" style={{ color: 'var(--text)' }}>{d.bestFitness}</span>
                </div>
                <div className="row-between" style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                  <span>Execution</span>
                  <span className="mono" style={{ color: 'var(--text)' }}>{d.executionMs} ms</span>
                </div>
                {/* The engine reports convergedAt: the mean iteration at which the
                    best solution was found, so lower is faster. It was being read
                    as `converged` and rendered with a % sign, which printed a bare
                    "%" — wrong field and wrong unit. */}
                <div className="row-between" style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                  <span>Best found at</span>
                  <span className="mono" style={{ color: 'var(--text)' }}>
                    {d.convergedAt === null || d.convergedAt === undefined
                      ? '—'
                      : `iter ${Number(d.convergedAt).toFixed(1)}`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
