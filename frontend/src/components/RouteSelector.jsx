import { ArrowUpDown, MapPin, Navigation, Play, RotateCcw, Zap } from 'lucide-react'
import { ALGORITHMS, LOCATIONS, OPTIMIZATION_MODES } from '../data/mockData'
import { useApp } from '../store/AppContext'

export default function RouteSelector({ onOptimize, busy }) {
  const {
    start, setStart, end, setEnd,
    algorithm, setAlgorithm, mode, setMode,
    demoMode, startDemo, stopDemo, resetScenario,
  } = useApp()

  const swap = () => {
    setStart(end)
    setEnd(start)
  }

  const activeAlgo = ALGORITHMS.find((a) => a.id === algorithm)

  return (
    <div className="card">
      <div className="card-title">
        <Navigation size={13} />
        Route Planner
      </div>

      <div className="field">
        <label htmlFor="start">Start location</label>
        <select
          id="start"
          className="select"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        >
          {LOCATIONS.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '-4px 0 4px' }}>
        <button className="icon-btn" onClick={swap} aria-label="Swap start and destination">
          <ArrowUpDown size={14} />
        </button>
      </div>

      <div className="field">
        <label htmlFor="end">Destination</label>
        <select
          id="end"
          className="select"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        >
          {LOCATIONS.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="algo">Algorithm</label>
        <select
          id="algo"
          className="select"
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value)}
        >
          {ALGORITHMS.map((a) => (
            <option key={a.id} value={a.id}>{a.full}</option>
          ))}
        </select>
        {activeAlgo?.quantum && (
          <div className="badge badge-quantum" style={{ marginTop: 7 }}>
            <Zap size={9} /> Quantum-inspired
          </div>
        )}
      </div>

      <div className="field">
        <label>Optimization objective</label>
        <div className="segmented">
          {OPTIMIZATION_MODES.map((m) => (
            <button
              key={m.id}
              data-active={mode === m.id}
              onClick={() => setMode(m.id)}
              title={`time ${m.weights.time} · distance ${m.weights.distance} · congestion ${m.weights.congestion}`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <button
        className="btn btn-primary btn-block"
        onClick={onOptimize}
        disabled={busy || start === end}
        style={{ marginTop: 4 }}
      >
        <MapPin size={15} />
        {busy ? 'Optimizing…' : 'Optimize Route'}
      </button>

      {start === end && (
        <p style={{ fontSize: 11, color: 'var(--moderate)', marginTop: 8, textAlign: 'center' }}>
          Start and destination must differ.
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 9 }}>
        <button
          className={`btn btn-sm ${demoMode ? '' : 'btn-quantum'}`}
          style={{ flex: 1 }}
          onClick={demoMode ? stopDemo : startDemo}
        >
          <Play size={13} />
          {demoMode ? 'Stop Demo' : 'Demo Mode'}
        </button>
        <button className="btn btn-sm" onClick={resetScenario} aria-label="Reset scenario">
          <RotateCcw size={13} />
        </button>
      </div>
    </div>
  )
}
