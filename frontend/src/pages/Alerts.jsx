import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { BellOff, Filter } from 'lucide-react'
import TrafficAlert from '../components/TrafficAlert'
import { useApp } from '../store/AppContext'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'predictive', label: 'Predictive' },
  { id: 'incident', label: 'Incidents' },
  { id: 'reroute', label: 'Route changes' },
]

export default function Alerts() {
  const { alerts, dismissAlert, runReroute } = useApp()
  const [filter, setFilter] = useState('all')

  const visible = useMemo(
    () => (filter === 'all' ? alerts : alerts.filter((a) => a.kind === filter)),
    [alerts, filter]
  )

  const counts = useMemo(() => {
    const c = { severe: 0, heavy: 0, moderate: 0 }
    alerts.forEach((a) => { if (c[a.severity] !== undefined) c[a.severity] += 1 })
    return c
  }, [alerts])

  return (
    <>
      <div className="row-between page-head">
        <div>
          <h1>Alerts</h1>
          <p>Predictive warnings, incidents and route-change notifications.</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span className="badge badge-red">{counts.severe} severe</span>
          <span className="badge badge-orange">{counts.heavy} heavy</span>
          <span className="badge badge-yellow">{counts.moderate} moderate</span>
        </div>
      </div>

      <div className="card" style={{ padding: 10, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
          <Filter size={13} style={{ color: 'var(--text-faint)' }} />
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className="btn btn-sm"
              onClick={() => setFilter(f.id)}
              style={
                filter === f.id
                  ? {
                      background: 'rgba(34,211,238,.13)',
                      borderColor: 'rgba(34,211,238,.4)',
                      color: 'var(--cyan)',
                    }
                  : undefined
              }
            >
              {f.label}
              {f.id !== 'all' && (
                <span style={{ color: 'var(--text-faint)' }}>
                  {alerts.filter((a) => a.kind === f.id).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="card">
          <div className="empty">
            <BellOff size={30} />
            <strong style={{ fontSize: 13, color: 'var(--text-dim)' }}>No alerts</strong>
            <span style={{ fontSize: 12 }}>
              {alerts.length === 0
                ? "You've dismissed everything. Run Demo Mode to generate new alerts."
                : 'Nothing matches this filter.'}
            </span>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AnimatePresence mode="popLayout">
            {visible.map((a) => (
              <TrafficAlert
                key={a.id}
                alert={a}
                onDismiss={dismissAlert}
                onAction={a.kind !== 'incident' ? runReroute : undefined}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  )
}
