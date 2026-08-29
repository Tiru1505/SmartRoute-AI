import {
  ArrowUpDown,
  MapPin,
  Navigation,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react'
import { ALGORITHMS, LOCATIONS, OPTIMIZATION_MODES } from '../data/mockData'
import { useApp } from '../store/AppContext'

export default function RouteSelector({ onOptimize, busy }) {
  const {
    start,
    setStart,
    end,
    setEnd,
    algorithm,
    setAlgorithm,
    mode,
    setMode,
    demoMode,
    startDemo,
    stopDemo,
    resetScenario,
  } = useApp()

  const swap = () => {
    setStart(end)
    setEnd(start)
  }

  const activeAlgo = ALGORITHMS.find((a) => a.id === algorithm)

  return (
    <div className="card route-selector-card">

      {/* HEADER */}
      <div className="card-title route-selector-title">
        <Navigation size={13} />
        <span>Route Planner</span>
      </div>

      {/* START LOCATION */}
      <div className="field route-field">
        <label htmlFor="start">Start location</label>

        <select
          id="start"
          className="select route-select"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        >
          {LOCATIONS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      {/* SWAP BUTTON */}
      <div className="route-swap-wrapper">
        <button
          className="icon-btn route-swap-btn"
          onClick={swap}
          aria-label="Swap start and destination"
          title="Swap locations"
        >
          <ArrowUpDown size={14} />
        </button>
      </div>

      {/* DESTINATION */}
      <div className="field route-field">
        <label htmlFor="end">Destination</label>

        <select
          id="end"
          className="select route-select"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        >
          {LOCATIONS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      {/* ALGORITHM */}
      <div className="field route-field">
        <label htmlFor="algo">Algorithm</label>

        <select
          id="algo"
          className="select route-select"
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value)}
        >
          {ALGORITHMS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.full}
            </option>
          ))}
        </select>

        {activeAlgo?.quantum && (
          <div className="badge badge-quantum quantum-badge">
            <Zap size={9} />
            Quantum-inspired
          </div>
        )}
      </div>

      {/* OPTIMIZATION OBJECTIVE */}
      <div className="field route-field">
        <label>Optimization objective</label>

        <div className="segmented route-segmented">
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

      {/* OPTIMIZE BUTTON */}
      <button
        className="btn btn-primary btn-block optimize-route-btn"
        onClick={onOptimize}
        disabled={busy || start === end}
      >
        <MapPin size={15} />

        <span>
          {busy ? 'Optimizing…' : 'Optimize Route'}
        </span>
      </button>

      {/* SAME LOCATION WARNING */}
      {start === end && (
        <p className="route-warning">
          Start and destination must differ.
        </p>
      )}

      {/* DEMO + RESET */}
      <div className="route-actions">

        <button
          className={`btn btn-sm demo-btn ${
            demoMode ? '' : 'btn-quantum'
          }`}
          onClick={demoMode ? stopDemo : startDemo}
        >
          <Play size={13} />

          <span>
            {demoMode ? 'Stop Demo' : 'Demo Mode'}
          </span>
        </button>

        <button
          className="btn btn-sm reset-btn"
          onClick={resetScenario}
          aria-label="Reset scenario"
          title="Reset scenario"
        >
          <RotateCcw size={13} />
        </button>

      </div>
    </div>
  )
}