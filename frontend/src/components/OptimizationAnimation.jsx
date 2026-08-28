import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Loader2, Zap, Activity } from 'lucide-react'
import { OPTIMIZATION_STAGES } from '../data/mockData'

const STAGE_MS = 650

export default function OptimizationAnimation({
  running,
  onComplete,
  algorithmName = 'QPSO',
}) {
  const [stage, setStage] = useState(0)
  const [iteration, setIteration] = useState(0)
  const [fitness, setFitness] = useState(0.82)

  useEffect(() => {
    if (!running) {
      setStage(0)
      setIteration(0)
      setFitness(0.82)
      return
    }

    setStage(0)
    setIteration(0)
    setFitness(0.82)

    const timers = OPTIMIZATION_STAGES.map((_, i) =>
      setTimeout(() => {
        setStage(i + 1)
      }, (i + 1) * STAGE_MS)
    )

    const iterationTimer = setInterval(() => {
      setIteration((prev) => {
        if (prev >= 100) return 100
        return prev + 2
      })

      setFitness((prev) =>
        Math.max(
          0.18,
          prev - 0.012 + (Math.random() - 0.5) * 0.006
        )
      )
    }, 90)

    const done = setTimeout(
      onComplete,
      (OPTIMIZATION_STAGES.length + 0.8) * STAGE_MS
    )

    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(done)
      clearInterval(iterationTimer)
    }
  }, [running, onComplete])

  const progress = Math.round(
    (stage / OPTIMIZATION_STAGES.length) * 100
  )

  return (
    <AnimatePresence>
      {running && (
        <motion.div
          className="card qro-optimization-card"
          initial={{
            opacity: 0,
            y: 15,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: -10,
            scale: 0.98,
          }}
          transition={{
            duration: 0.3,
          }}
          style={{
            borderColor: 'rgba(168,85,247,.38)',
          }}
        >

          {/* HEADER */}
          <div
            className="card-title quantum qro-optimization-header"
            style={{
              marginBottom: 14,
            }}
          >
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <Loader2 size={14} />
            </motion.div>

            <span>
              {algorithmName} Optimization Running
            </span>

            <span className="qro-live-badge">
              LIVE
            </span>
          </div>


          {/* QPSO VISUALIZATION */}
          <div className="qro-particle-box">

            <div className="qro-particle-grid" />

            <div className="qro-particle-label">
              <Zap size={10} />
              SEARCHING SOLUTION SPACE
            </div>

            {/* PARTICLES */}

            {Array.from({ length: 12 }).map((_, i) => (
              <motion.span
                key={i}
                className="qro-particle"
                initial={{
                  x: `${10 + Math.random() * 80}%`,
                  y: `${20 + Math.random() * 60}%`,
                  opacity: 0,
                }}
                animate={{
                  x: [
                    `${10 + Math.random() * 80}%`,
                    `${25 + Math.random() * 55}%`,
                    `${35 + Math.random() * 45}%`,
                  ],
                  y: [
                    `${20 + Math.random() * 60}%`,
                    `${15 + Math.random() * 65}%`,
                    `${30 + Math.random() * 50}%`,
                  ],
                  opacity: [0.3, 1, 0.5],
                  scale: [0.7, 1.2, 0.8],
                }}
                transition={{
                  duration: 1.8 + i * 0.12,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}

            {/* BEST POSITION */}

            <motion.div
              className="qro-best-position"
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
              }}
            >
              <span />
            </motion.div>

          </div>


          {/* METRICS */}

          <div className="qro-optimization-metrics">

            <div className="qro-optimization-metric">
              <span>ITERATION</span>

              <strong>
                {iteration}
                <small> / 100</small>
              </strong>
            </div>

            <div className="qro-optimization-metric">
              <span>BEST FITNESS</span>

              <strong>
                {fitness.toFixed(4)}
              </strong>
            </div>

            <div className="qro-optimization-metric">
              <span>PARTICLES</span>

              <strong>
                30
              </strong>
            </div>

          </div>


          {/* STAGES */}

          <div className="stage-list qro-stage-list">

            {OPTIMIZATION_STAGES.map((label, i) => {

              const state =
                i < stage
                  ? 'done'
                  : i === stage
                    ? 'active'
                    : 'pending'

              return (
                <motion.div
                  key={label}
                  className="stage"
                  data-state={state}
                  initial={{
                    opacity: 0,
                    x: -8,
                  }}
                  animate={{
                    opacity:
                      state === 'pending'
                        ? 0.35
                        : 1,

                    x: 0,
                  }}
                  transition={{
                    duration: 0.25,
                  }}
                >

                  <span className="stage-icon">

                    {state === 'done' ? (

                      <motion.span
                        initial={{
                          scale: 0,
                        }}
                        animate={{
                          scale: 1,
                        }}
                      >
                        <Check
                          size={9}
                          strokeWidth={3}
                        />
                      </motion.span>

                    ) : state === 'active' ? (

                      <motion.span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background:
                            'currentColor',
                          display: 'block',
                        }}
                        animate={{
                          scale: [
                            1,
                            1.5,
                            1,
                          ],
                          opacity: [
                            1,
                            0.5,
                            1,
                          ],
                        }}
                        transition={{
                          duration: 0.9,
                          repeat: Infinity,
                        }}
                      />

                    ) : null}

                  </span>

                  {label}

                </motion.div>
              )
            })}

          </div>


          {/* PROGRESS */}

          <div className="progress-track qro-optimization-progress">

            <motion.div
              className="progress-fill"
              initial={{
                width: 0,
              }}
              animate={{
                width: `${progress}%`,
              }}
              transition={{
                duration: 0.4,
              }}
            />

          </div>


          <div
            className="row-between mono"
            style={{
              fontSize: 10,
              color: 'var(--text-faint)',
              marginTop: 6,
            }}
          >

            <span>
              <Activity
                size={10}
                style={{
                  verticalAlign: -1,
                  marginRight: 4,
                }}
              />

              quantum search convergence
            </span>

            <span>
              {progress}%
            </span>

          </div>

        </motion.div>
      )}
    </AnimatePresence>
  )
}