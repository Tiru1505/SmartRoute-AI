import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Atom } from 'lucide-react'

const PARTICLES = 22

/**
 * Illustrative only.
 *
 * Shows particles contracting toward a global best to convey what "swarm
 * converging on an optimum" means. It is NOT running QPSO and the numbers are
 * demo values — do not present this as computed output.
 */
export default function QPSOVisualization({ active = false, iterations = 48, bestFitness = 0.418 }) {
  const [t, setT] = useState(0)
  const raf = useRef()

  const seeds = useMemo(
    () =>
      Array.from({ length: PARTICLES }, (_, i) => ({
        angle: (i / PARTICLES) * Math.PI * 2 + Math.random() * 0.6,
        radius: 30 + Math.random() * 34,
        speed: 0.5 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
      })),
    []
  )

  useEffect(() => {
    if (!active) {
      setT(0)
      return
    }
    let start
    const loop = (now) => {
      if (!start) start = now
      setT(((now - start) / 1000) % 4)
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf.current)
  }, [active])

  // 1 → fully dispersed, 0 → fully converged
  const spread = active ? Math.max(0.12, 1 - (t % 4) / 4) : 1
  const convergence = Math.round((1 - spread) * 100)

  return (
    <div className="card">
      <div className="card-title quantum">
        <Atom size={13} />
        QPSO Optimization
      </div>

      <div className="qpso-canvas">
        {seeds.map((s, i) => {
          const wobble = Math.sin(t * s.speed * 2 + s.phase) * 6
          const r = (s.radius + wobble) * spread
          const x = 50 + (r * Math.cos(s.angle + t * 0.35 * s.speed)) / 2.4
          const y = 50 + (r * Math.sin(s.angle + t * 0.35 * s.speed)) / 1.5
          return (
            <motion.span
              key={i}
              className="qpso-particle"
              animate={{ opacity: active ? [0.45, 1, 0.45] : 0.35 }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.04 }}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                background: i % 5 === 0 ? 'var(--quantum)' : 'var(--cyan)',
                boxShadow: `0 0 8px ${i % 5 === 0 ? 'var(--quantum)' : 'var(--cyan)'}`,
              }}
            />
          )
        })}

        <motion.span
          className="qpso-target"
          animate={{ scale: active ? [1, 1.35, 1] : 1 }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
      </div>

      <div className="qpso-stats">
        <div className="qpso-stat">
          <b className="mono">{iterations}</b>
          <span>Iterations</span>
        </div>
        <div className="qpso-stat">
          <b className="mono" style={{ color: 'var(--low)' }}>{bestFitness.toFixed(3)}</b>
          <span>Best fitness</span>
        </div>
        <div className="qpso-stat">
          <b className="mono" style={{ color: 'var(--quantum)' }}>
            {active ? convergence : 0}%
          </b>
          <span>Convergence</span>
        </div>
      </div>

      <p style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 10, lineHeight: 1.45 }}>
        Illustration of swarm convergence. Values shown are demo data, not a live
        computation.
      </p>
    </div>
  )
}
