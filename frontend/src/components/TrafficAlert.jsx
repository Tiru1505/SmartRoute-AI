import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Bell, MapPin, TriangleAlert, X } from 'lucide-react'
import { TRAFFIC_COLORS } from '../data/mockData'

const KIND_ICON = { predictive: Bell, incident: TriangleAlert, reroute: ArrowRight }

/* forwardRef so AnimatePresence's popLayout mode can measure the card as it
   exits — without it React warns and the exit animation misbehaves. */
const TrafficAlert = forwardRef(function TrafficAlert(
  { alert, onDismiss, onAction, compact = false },
  ref
) {
  const Icon = KIND_ICON[alert.kind] || TriangleAlert
  const color = TRAFFIC_COLORS[alert.severity] || 'var(--moderate)'

  return (
    <motion.div
      ref={ref}
      className={`alert-card alert-${alert.severity}`}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.22 } }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="alert-head">
        <motion.span
          style={{
            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
            display: 'grid', placeItems: 'center',
            background: `color-mix(in srgb, ${color} 16%, transparent)`, color,
          }}
          animate={alert.kind === 'predictive' ? { scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          <Icon size={15} />
        </motion.span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h4>{alert.title}</h4>
          <p style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={10} /> {alert.location} · {alert.time}
          </p>
        </div>

        <span className="badge" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color, borderColor: color }}>
          {alert.severity}
        </span>

        {onDismiss && (
          <button
            className="icon-btn"
            style={{ width: 26, height: 26 }}
            onClick={() => onDismiss(alert.id)}
            aria-label="Dismiss alert"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {!compact && (
        <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>{alert.description}</p>
      )}

      {alert.current !== undefined && (
        <div className="congestion-jump">
          <div>
            <div style={{ fontSize: 9.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
              Current
            </div>
            <b className="mono">{Math.round(alert.current * 100)}%</b>
          </div>
          <ArrowRight size={15} style={{ color: 'var(--text-faint)' }} />
          <div>
            <div style={{ fontSize: 9.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
              Predicted
            </div>
            <b className="mono" style={{ color: 'var(--severe)' }}>
              {Math.round(alert.predicted * 100)}%
            </b>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 9.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
              Expected in
            </div>
            <b className="mono">{alert.etaMinutes} min</b>
          </div>
        </div>
      )}

      {alert.action && (
        <div className="row-between" style={{ marginTop: 10 }}>
          <span style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>{alert.action}</span>
          {onAction && (
            <button className="btn btn-sm btn-primary" onClick={() => onAction(alert)}>
              Reroute
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
})

export default TrafficAlert
