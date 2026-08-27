import { useEffect, useState } from 'react'
import { Activity, AlertOctagon, BarChart3, Clock, Route as RouteIcon, TrendingUp } from 'lucide-react'
import StatCard from '../components/StatCard'
import PredictionCard from '../components/PredictionCard'
import { CardSkeleton } from '../components/LoadingScreen'
import {
  RoutePerformanceChart, TrafficDistributionChart, TrafficTrendChart,
} from '../components/TrafficChart'
import { getAnalytics } from '../services/api'

const ICONS = [Activity, Clock, BarChart3, TrendingUp, AlertOctagon, RouteIcon]

export default function Analytics() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    getAnalytics()
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message))
    return () => { cancelled = true }
  }, [])

  if (error) {
    return (
      <div className="card" style={{ borderColor: 'rgba(239,68,68,.3)' }}>
        <div className="empty">
          <AlertOctagon size={26} style={{ color: 'var(--severe)' }} />
          <strong style={{ fontSize: 13 }}>Could not load analytics</strong>
          <span style={{ fontSize: 12 }}>{error}</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="page-head">
        <h1>Analytics</h1>
        <p>Traffic patterns, prediction accuracy and route performance.</p>
      </div>

      {data?.isDemoData && (
        <div className="demo-notice">
          <Activity size={13} />
          Demo data — replace via <code>src/services/api.js</code> once the backend is live.
        </div>
      )}

      <div className="grid grid-3" style={{ marginBottom: 14 }}>
        {data
          ? data.stats.map((s, i) => (
              <StatCard key={s.label} {...s} icon={ICONS[i]} delay={i * 0.05} />
            ))
          : Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} height={104} />)}
      </div>

      <div className="grid grid-2" style={{ marginBottom: 14 }}>
        <div className="card chart-card">
          <div className="card-title">
            <TrendingUp size={13} />
            Traffic Trend — 24 hours
          </div>
          {data ? <TrafficTrendChart data={data.trend} /> : <CardSkeleton height={260} />}
        </div>

        {data ? (
          <PredictionCard series={data.prediction} title="Actual vs Predicted Congestion" />
        ) : (
          <CardSkeleton height={300} />
        )}
      </div>

      <div className="grid grid-2">
        <div className="card chart-card">
          <div className="card-title">
            <RouteIcon size={13} />
            Route Performance
          </div>
          {data ? <RoutePerformanceChart data={data.performance} /> : <CardSkeleton height={260} />}
        </div>

        <div className="card chart-card">
          <div className="card-title">
            <BarChart3 size={13} />
            Traffic Distribution
          </div>
          {data ? (
            <TrafficDistributionChart data={data.distribution} />
          ) : (
            <CardSkeleton height={260} />
          )}
        </div>
      </div>
    </>
  )
}
