import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { TrendingUp } from 'lucide-react'

/**
 * Congestion now, plus a forward curve.
 *
 * `note` says how that curve was produced and is supplied by the backend. It
 * matters: today the projection is current congestion grown at a fixed rate,
 * not the output of a trained model, and a chart titled "Actual vs Predicted"
 * with no caveat oversells that. When a real forecaster is wired in, the
 * backend changes the note and this card follows.
 */
export default function PredictionCard({ series = [], title = 'Congestion Forecast', note = null }) {
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
                color: 'var(--text)',
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
          <span className="legend-swatch" style={{ background: '#2dd4bf' }} /> Measured now
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-dim)' }}>
          <span className="legend-swatch" style={{ background: '#e879f9' }} /> Projected
        </span>
      </div>

      {note && (
        <p style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 7, lineHeight: 1.45 }}>
          {note}
        </p>
      )}
    </div>
  )
}
