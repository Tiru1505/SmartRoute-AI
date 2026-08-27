import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Loader2, Navigation, TriangleAlert } from 'lucide-react'

/**
 * Three states:
 *   detecting  — congestion spike found, nothing computed yet
 *   rerouting  — optimizer re-running
 *   result     — old vs new comparison with the switch action
 */
export default function ReroutingPanel({ state, result, onReroute, onAccept }) {
  // NOTE: deliberately not mode="wait". The demo drives
  // detecting → rerouting → result faster than the exit animations complete,
  // and "wait" deadlocks on the queued exit, leaving the panel blank.
  return (
    <AnimatePresence>
      {state === 'detecting' && (
        <motion.div
          key="detecting"
          className="card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          style={{ borderColor: 'rgba(239,68,68,.32)', background: 'rgba(239,68,68,.06)' }}
        >
          <div className="alert-head" style={{ marginBottom: 8 }}>
            <motion.span
              style={{
                width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                display: 'grid', placeItems: 'center',
                background: 'rgba(239,68,68,.16)', color: 'var(--severe)',
              }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <TriangleAlert size={15} />
            </motion.span>
            <div>
              <h4 style={{ fontSize: 13 }}>Congestion detected</h4>
              <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                Congestion on your current route has increased sharply.
              </p>
            </div>
          </div>
          <button className="btn btn-primary btn-block btn-sm" onClick={onReroute}>
            <Navigation size={13} /> Recalculate Route
          </button>
        </motion.div>
      )}

      {state === 'rerouting' && (
        <motion.div
          key="rerouting"
          className="card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          style={{ borderColor: 'rgba(168,85,247,.32)' }}
        >
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              justifyContent: 'center', padding: '14px 0',
            }}
          >
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ display: 'grid', placeItems: 'center', color: 'var(--quantum)' }}
            >
              <Loader2 size={17} />
            </motion.span>
            <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>
              Recalculating optimal route…
            </span>
          </div>
        </motion.div>
      )}

      {state === 'result' && result && (
        <motion.div
          key="result"
          className="card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.34 }}
          style={{ borderColor: 'rgba(16,185,129,.32)' }}
        >
          <div className="card-title" style={{ color: 'var(--low)' }}>
            <Navigation size={13} style={{ color: 'var(--low)' }} />
            New Route Found
          </div>

          <div className="reroute-compare">
            <div className="reroute-side reroute-old">
              <small>Previous ETA</small>
              <b className="mono">{result.previousEtaMin}m</b>
            </div>
            <ArrowRight size={17} style={{ color: 'var(--text-faint)' }} />
            <div className="reroute-side reroute-new">
              <small>New ETA</small>
              <b className="mono">{result.newEtaMin}m</b>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              textAlign: 'center', marginTop: 11, padding: '9px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.24)',
            }}
          >
            <span style={{ fontSize: 12 }}>
              Time saved:{' '}
              <strong style={{ color: 'var(--low)', fontSize: 15 }}>
                {result.timeSavedMin} min
              </strong>
            </span>
          </motion.div>

          <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 9 }}>
            New route via {result.newRoute.via}
          </p>

          {onAccept && (
            <button
              className="btn btn-primary btn-block"
              style={{ marginTop: 11 }}
              onClick={onAccept}
            >
              Reroute Now
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
