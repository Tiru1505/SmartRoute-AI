import { TRAFFIC_COLORS, TRAFFIC_LABELS } from '../data/mockData'

export default function TrafficLegend({ showRoutes = true }) {
  return (
    <div className="legend-card">
      <div className="legend-title">Traffic</div>
      {Object.keys(TRAFFIC_COLORS).map((k) => (
        <div key={k} className="legend-row">
          <span className="legend-swatch" style={{ background: TRAFFIC_COLORS[k] }} />
          <span style={{ color: 'var(--text-dim)' }}>{TRAFFIC_LABELS[k]}</span>
        </div>
      ))}

      {showRoutes && (
        <>
          <div className="legend-title" style={{ marginTop: 11 }}>Routes</div>
          <div className="legend-row">
            <span
              className="legend-swatch"
              style={{ background: 'var(--low)', height: 4, boxShadow: '0 0 8px var(--low)' }}
            />
            <span style={{ color: 'var(--text-dim)' }}>Recommended</span>
          </div>
          <div className="legend-row">
            <span
              className="legend-swatch"
              style={{
                background:
                  'repeating-linear-gradient(90deg,var(--text-faint) 0 4px,transparent 4px 8px)',
              }}
            />
            <span style={{ color: 'var(--text-dim)' }}>Alternative</span>
          </div>
        </>
      )}
    </div>
  )
}
