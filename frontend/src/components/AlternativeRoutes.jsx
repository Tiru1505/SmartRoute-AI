import { motion } from 'framer-motion'
import { GitBranch } from 'lucide-react'

export default function AlternativeRoutes({ routes, selectedId, onSelect }) {
  if (!routes.length) return null

  return (
    <div className="card">
      <div className="card-title">
        <GitBranch size={13} />
        All Routes ({routes.length})
      </div>

      {routes.map((r, i) => (
        <motion.div
          key={r.id}
          className="alt-route"
          data-active={r.id === selectedId}
          onClick={() => onSelect(r.id)}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.28, delay: i * 0.07 }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelect(r.id)}
        >
          <span
            className="alt-swatch"
            style={{ background: r.color, boxShadow: `0 0 8px ${r.color}` }}
          />
          <div className="alt-body">
            <strong>
              {r.label}
              {r.recommended && (
                <span className="badge badge-green" style={{ marginLeft: 6, padding: '1px 6px' }}>
                  Best
                </span>
              )}
            </strong>
            <span>{r.via}</span>
          </div>
          <div className="alt-nums">
            <div className="mono" style={{ color: 'var(--text)' }}>{r.etaMin} min</div>
            <div>{r.distanceKm} km · {Math.round(r.congestion * 100)}%</div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
