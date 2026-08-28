import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import {
  Clock,
  Gauge,
  Route as RouteIcon,
  Star,
  TrendingDown,
  Zap,
} from 'lucide-react'
import { useCountUp } from './StatCard'
import { TRAFFIC_COLORS } from '../data/mockData'

function congestionLevel(c) {
  if (c < 0.3) return 'low'
  if (c < 0.5) return 'moderate'
  if (c < 0.7) return 'heavy'
  return 'severe'
}

/* forwardRef so AnimatePresence's popLayout mode can measure this card. */
const RouteCard = forwardRef(function RouteCard({ route }, ref) {
  const distance = useCountUp(route.distanceKm)
  const eta = useCountUp(route.etaMin)
  const cong = useCountUp(route.congestion * 100)
  const score = useCountUp(route.score)

  const level = congestionLevel(route.congestion)

  const scoreColor =
    route.score >= 85
      ? 'var(--low)'
      : route.score >= 70
        ? 'var(--moderate)'
        : 'var(--heavy)'

  return (
    <motion.div
      ref={ref}
      className="card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{
        borderColor: 'rgba(16,185,129,.3)',
        overflow: 'hidden',
      }}
    >

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 10,
          width: '100%',
        }}
      >

        {/* TITLE */}

        <div
          className="card-title"
          style={{
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flex: '1 1 auto',
            minWidth: 0,
            lineHeight: 1.3,
          }}
        >
          <RouteIcon
            size={13}
            style={{
              flexShrink: 0,
            }}
          />

          <span
            style={{
              whiteSpace: 'normal',
            }}
          >
            Recommended Route
          </span>
        </div>

        {/* BADGES */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
            gap: 5,
            flex: '0 1 auto',
            minWidth: 0,
          }}
        >

          {route.recommended && (
            <span
              className="badge badge-green"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
                flexShrink: 1,
                fontSize: 10,
              }}
            >
              <Star size={9} />
              Recommended
            </span>
          )}

          {route.fastest && (
            <span
              className="badge badge-cyan"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                fontSize: 10,
              }}
            >
              Fastest
            </span>
          )}

        </div>
      </div>

      {/* =====================================================
          ALGORITHM
          ===================================================== */}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          marginBottom: 4,
          minWidth: 0,
        }}
      >

        <span
          className="badge badge-quantum"
          style={{
            flexShrink: 0,
          }}
        >
          <Zap size={9} />
          {route.algorithm}
        </span>

        {route.via && (
          <span
            style={{
              fontSize: 11,
              color: 'var(--text-faint)',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            via {route.via}
          </span>
        )}

      </div>

      {/* =====================================================
          METRICS
          ===================================================== */}

      <div className="route-metrics">

        <div className="metric">
          <b>{distance.toFixed(1)}</b>
          <span>km</span>
        </div>

        <div className="metric">
          <b
            style={{
              color: 'var(--cyan)',
            }}
          >
            {Math.round(eta)}
          </b>

          <span>min ETA</span>
        </div>

        <div className="metric">
          <b
            style={{
              color: TRAFFIC_COLORS[level],
            }}
          >
            {Math.round(cong)}%
          </b>

          <span>congestion</span>
        </div>

      </div>

      {/* =====================================================
          ROUTE SCORE
          ===================================================== */}

      <div
        className="row-between"
        style={{
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-faint)',
          }}
        >
          Route score
        </span>

        <span
          className="mono"
          style={{
            fontSize: 12,
            color: scoreColor,
          }}
        >
          {Math.round(score)} / 100
        </span>
      </div>

      <div className="score-bar">

        <motion.div
          className="score-fill"
          style={{
            background: scoreColor,
          }}
          initial={{
            width: 0,
          }}
          animate={{
            width: `${route.score}%`,
          }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        />

      </div>

      {/* =====================================================
          TIME SAVED
          ===================================================== */}

      {route.timeSavedMin > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            marginTop: 12,
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(16,185,129,.1)',
            border:
              '1px solid rgba(16,185,129,.24)',
            minWidth: 0,
          }}
        >

          <TrendingDown
            size={14}
            style={{
              color: 'var(--low)',
              flexShrink: 0,
            }}
          />

          <span
            style={{
              fontSize: 12,
              minWidth: 0,
            }}
          >
            Saves{' '}

            <strong
              style={{
                color: 'var(--low)',
              }}
            >
              {route.timeSavedMin} min
            </strong>{' '}
            
            versus the next best route
          </span>

        </div>
      )}

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          marginTop: 12,
          paddingTop: 11,
          borderTop:
            '1px solid var(--border)',
          fontSize: 11,
          color: 'var(--text-faint)',
        }}
      >

        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            minWidth: 0,
          }}
        >

          <Clock
            size={11}
            style={{
              flexShrink: 0,
            }}
          />

          Arrives{' '}

          {new Date(
            Date.now() +
              route.etaMin * 60000
          ).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}

        </span>

        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >

          <Gauge size={11} />

          {(
            route.distanceKm /
            (route.etaMin / 60)
          ).toFixed(0)}{' '}
          km/h avg

        </span>

      </div>

    </motion.div>
  )
})

export default RouteCard