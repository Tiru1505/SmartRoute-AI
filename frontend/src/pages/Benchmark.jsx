import { useEffect, useState } from 'react'
import { AlertOctagon, FlaskConical, Info, Scaling } from 'lucide-react'
import BenchmarkTable from '../components/BenchmarkTable'
import ConvergenceChart from '../components/ConvergenceChart'
import { ScalabilityChart } from '../components/TrafficChart'
import { CardSkeleton } from '../components/LoadingScreen'
import { getBenchmark, getConvergence, getScalability } from '../services/api'

export default function Benchmark() {
  const [bench, setBench] = useState(null)
  const [conv, setConv] = useState(null)
  const [scale, setScale] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getBenchmark(), getConvergence(), getScalability()])
      .then(([b, c, s]) => {
        if (cancelled) return
        setBench(b)
        setConv(c)
        setScale(s)
      })
      .catch((e) => !cancelled && setError(e.message))
    return () => { cancelled = true }
  }, [])

  if (error) {
    return (
      <div className="card" style={{ borderColor: 'rgba(239,68,68,.3)' }}>
        <div className="empty">
          <AlertOctagon size={26} style={{ color: 'var(--severe)' }} />
          <strong style={{ fontSize: 13 }}>Could not load benchmark results</strong>
          <span style={{ fontSize: 12 }}>{error}</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="page-head">
        <h1>Benchmark</h1>
        <p>QPSO measured against Dijkstra, PSO and GA on identical problem instances.</p>
      </div>

      <div className="demo-notice">
        <Info size={13} />
        Demo data — these are placeholder figures, not a validated benchmark run.
        Replace them with real results from <code>benchmarking/benchmark.py</code>.
      </div>

      <div style={{ marginBottom: 14 }}>
        {bench ? <BenchmarkTable data={bench} /> : <CardSkeleton height={300} />}
      </div>

      <div style={{ marginBottom: 14 }}>
        {conv ? (
          <ConvergenceChart data={conv.chartData} summary={conv.summary} />
        ) : (
          <CardSkeleton height={340} />
        )}
      </div>

      <div className="card chart-card">
        <div className="row-between" style={{ marginBottom: 12 }}>
          <div className="card-title" style={{ margin: 0 }}>
            <Scaling size={13} />
            Scalability — Network Size vs Execution Time
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>log-ish growth expected</span>
        </div>

        {scale ? (
          <>
            <ScalabilityChart data={scale.rows} />
            <div className="table-wrap" style={{ marginTop: 14 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Nodes</th>
                    <th>Dijkstra</th>
                    <th>QPSO</th>
                    <th>PSO</th>
                    <th>GA</th>
                    <th>QPSO solution quality</th>
                  </tr>
                </thead>
                <tbody>
                  {scale.rows.map((r) => (
                    <tr key={r.nodes}>
                      <td className="mono">{r.nodes.toLocaleString()}</td>
                      <td className="mono">{r.dijkstra} ms</td>
                      <td className="mono" style={{ color: 'var(--quantum)' }}>{r.qpso} ms</td>
                      <td className="mono">{r.pso} ms</td>
                      <td className="mono">{r.ga} ms</td>
                      <td>
                        <span className={`badge ${r.qpsoQuality >= 99 ? 'badge-green' : 'badge-yellow'}`}>
                          {r.qpsoQuality}% of optimal
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 10, lineHeight: 1.5 }}>
              "Solution quality" is the metaheuristic's objective value relative to Dijkstra's
              proven optimum on the same instance — 100% means it found the optimal route.
            </p>
          </>
        ) : (
          <CardSkeleton height={280} />
        )}
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-title">
          <FlaskConical size={13} />
          Experimental Protocol
        </div>
        <ul style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7, paddingLeft: 18, margin: 0 }}>
          <li>All four algorithms receive the same graph, endpoints, traffic state and objective weights.</li>
          <li>Stochastic algorithms (QPSO, PSO, GA) are run for 30 independent trials; mean, standard deviation, best and worst are reported.</li>
          <li>Dijkstra is deterministic — a single run, and its objective value is the proven optimum for this problem class.</li>
          <li>Route validity is the share of trials that produced a connected, cycle-free path satisfying all constraints.</li>
          <li>Runtime excludes graph loading, which is shared across all algorithms.</li>
        </ul>
      </div>
    </>
  )
}
