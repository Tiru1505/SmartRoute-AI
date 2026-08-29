import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { TrendingUp } from 'lucide-react'

/** Actual congestion so far vs. the model's forward projection. */
export default function PredictionCard({ series = [], title = 'Congestion Forecast' }) {
  return (
    <div className="card chart-card">
      <div className="card-title">
        <TrendingUp size={13} />
        {title}
      </div>

      <div className="chart-box-sm">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 4, right: 6, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="gActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.42} />
                <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gPred" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e879f9" stopOpacity={0.36} />
                <stop offset="100%" stopColor="#e879f9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" vertical={false} />
            <XAxis dataKey="time" axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} unit="%" />
            <Tooltip
              contentStyle={{
                background: 'var(--panel-solid)',
                border: '1px solid var(--border-strong)',
                borderRadius: 10,
                fontSize: 12,
              }}
              labelStyle={{ color: 'var(--text)' }}
            />
            <Area
              type="monotone" dataKey="actual" name="Actual"
              stroke="#2dd4bf" strokeWidth={2} fill="url(#gActual)" connectNulls={false}
            />
            <Area
              type="monotone" dataKey="predicted" name="Predicted"
              stroke="#e879f9" strokeWidth={2} strokeDasharray="5 4" fill="url(#gPred)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 11 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-dim)' }}>
          <span className="legend-swatch" style={{ background: '#2dd4bf' }} /> Actual
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-dim)' }}>
          <span className="legend-swatch" style={{ background: '#e879f9' }} /> Predicted
        </span>
      </div>
    </div>
  )
}
