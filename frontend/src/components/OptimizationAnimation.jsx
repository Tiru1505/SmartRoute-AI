import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'
import { OPTIMIZATION_STAGES } from '../data/mockData'

const STAGE_MS = 340

/**
 * Steps through the optimizer's stages, then calls onComplete.
 * Purely presentational — the real request runs in parallel via the store.
 */
export default function OptimizationAnimation({ running, onComplete, algorithmName = 'QPSO' }) {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    if (!running) {
      setStage(0)
      return
    }
    setStage(0)
    const timers = OPTIMIZATION_STAGES.map((_, i) =>
      setTimeout(() => setStage(i + 1), (i + 1) * STAGE_MS)
    )
    const done = setTimeout(onComplete, (OPTIMIZATION_STAGES.length + 0.6) * STAGE_MS)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(done)
    }
  }, [running, onComplete])

  const progress = Math.round((stage / OPTIMIZATION_STAGES.length) * 100)

  return (
    <AnimatePresence>
      {running && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.24 }}
          style={{ borderColor: 'rgba(168,85,247,.32)' }}
        >
          <div className="card-title quantum" style={{ marginBottom: 12 }}>
            <Loader2 size={13} className="spin-icon" />
            {algorithmName} Optimization Running
          </div>

          <div className="stage-list">
            {OPTIMIZATION_STAGES.map((label, i) => {
              const state = i < stage ? 'done' : i === stage ? 'active' : 'pending'
              return (
                <motion.div
                  key={label}
                  className="stage"
                  data-state={state}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: state === 'pending' ? 0.4 : 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="stage-icon">
                    {state === 'done' ? (
                      <Check size={9} strokeWidth={3} />
                    ) : state === 'active' ? (
                      <motion.span
                        style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: 'currentColor', display: 'block',
                        }}
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 0.9, repeat: Infinity }}
                      />
                    ) : null}
                  </span>
                  {label}
                </motion.div>
              )
            })}
          </div>

          <div className="progress-track">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div
            className="row-between mono"
            style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 6 }}
          >
            <span>searching solution space</span>
            <span>{progress}%</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
