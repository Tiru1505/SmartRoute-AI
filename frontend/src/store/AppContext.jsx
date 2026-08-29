/**
 * Shared application state.
 *
 * Deliberately small: routing results, traffic, alerts, and the demo-mode
 * script. Anything a single page owns stays in that page's own useState.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_END, DEFAULT_START, REROUTED_ROUTE, ROUTES, TRAFFIC_SEGMENTS,
} from '../data/mockData'
import * as api from '../services/api'

const AppContext = createContext(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}

const read = (key, fallback) => {
  try {
    const v = localStorage.getItem(key)
    return v === null ? fallback : JSON.parse(v)
  } catch {
    return fallback
  }
}
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* private mode / blocked storage — the UI still works, it just won't persist */
  }
}

export function AppProvider({ children }) {
  /* --- auth ------------------------------------------------------------
   * DEMO AUTHENTICATION ONLY.
   *
   * There is no auth backend, so nothing here validates a credential. Any
   * well-formed input is accepted, the password is never stored, and the
   * "session" is just a name/email in localStorage. Before this is deployed
   * anywhere real, replace signIn/signUp with calls to a backend that hashes
   * passwords server-side and returns a signed token.
   */
  const [user, setUser] = useState(() => read('qro.user', null))

  useEffect(() => {
    if (user) write('qro.user', user)
    else {
      try {
        localStorage.removeItem('qro.user')
      } catch { /* storage blocked — session just won't persist */ }
    }
  }, [user])

  const signIn = useCallback(async ({ email, name }) => {
    await new Promise((r) => setTimeout(r, 650))     // make the loading state real
    const handle = (email || '').split('@')[0] || 'user'
    setUser({
      email: email || 'guest@qro.local',
      name: name || handle.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      initials: (name || handle).slice(0, 2).toUpperCase(),
      signedInAt: new Date().toISOString(),
      guest: false,
    })
    return true
  }, [])

  const continueAsGuest = useCallback(() => {
    setUser({
      email: 'guest@qro.local',
      name: 'Guest',
      initials: 'GU',
      signedInAt: new Date().toISOString(),
      guest: true,
    })
  }, [])

  const signOut = useCallback(() => setUser(null), [])

  /* --- preferences ------------------------------------------------------ */
  const [theme, setTheme] = useState(() => read('qro.theme', 'dark'))
  const [collapsed, setCollapsed] = useState(() => read('qro.sidebar', false))
  const [settings, setSettings] = useState(() =>
    read('qro.settings', {
      mapStyle: 'standard',
      preferredAlgorithm: 'qpso',
      avoidTolls: false,
      avoidHighways: false,
      congestionSensitivity: 60,
      alertThresholdMin: 5,
      notifyPredictive: true,
      notifyIncidents: true,
      notifyReroute: true,
    })
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    write('qro.theme', theme)
  }, [theme])
  useEffect(() => write('qro.sidebar', collapsed), [collapsed])
  useEffect(() => write('qro.settings', settings), [settings])

  /* --- routing ---------------------------------------------------------- */
  const [start, setStart] = useState(DEFAULT_START)
  const [end, setEnd] = useState(DEFAULT_END)
  const [algorithm, setAlgorithm] = useState('qpso')
  const [mode, setMode] = useState('balanced')

  const [routes, setRoutes] = useState([])
  const [selectedRouteId, setSelectedRouteId] = useState(null)
  const [optimizing, setOptimizing] = useState(false)
  const [error, setError] = useState(null)

  /* --- live traffic + alerts ------------------------------------------- */
  const [segments, setSegments] = useState(TRAFFIC_SEGMENTS)
  const [incidents, setIncidents] = useState([])
  const [alerts, setAlerts] = useState([])
  const [predictiveAlert, setPredictiveAlert] = useState(null)

  /* --- rerouting -------------------------------------------------------- */
  const [rerouting, setRerouting] = useState(false)
  const [rerouteResult, setRerouteResult] = useState(null)

  /* --- demo mode -------------------------------------------------------- */
  const [demoMode, setDemoMode] = useState(false)
  const [demoStep, setDemoStep] = useState(null)
  const timers = useRef([])

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  useEffect(() => {
    let cancelled = false
    api.getTrafficData().then((d) => {
      if (cancelled) return
      setSegments(d.segments)
      setIncidents(d.incidents)
    })
    api.getAlerts().then((a) => !cancelled && setAlerts(a))
    return () => {
      cancelled = true
    }
  }, [])

  const selectedRoute = useMemo(
    () => routes.find((r) => r.id === selectedRouteId) || routes[0] || null,
    [routes, selectedRouteId]
  )

  /** Runs the optimizer. The staged animation is owned by the Dashboard; this
   *  only resolves the data and flips the loading flag. */
  const optimize = useCallback(async () => {
    // Endpoints come from a free-text search box now, so "nothing picked yet"
    // is a real state the optimizer has to refuse rather than crash on.
    if (!start || !end) {
      setError('Choose a start and a destination first.')
      return null
    }
    setOptimizing(true)
    setError(null)
    setRerouteResult(null)
    setPredictiveAlert(null)
    try {
      const res = await api.getRouteOptimization({ start, end, algorithm, mode })
      setRoutes(res.routes)
      setSelectedRouteId(res.recommended.id)
      return res
    } catch (err) {
      setError(err.message || 'Optimization failed.')
      return null
    } finally {
      setOptimizing(false)
    }
  }, [start, end, algorithm, mode])

  /** Spikes congestion on the active corridor — the trigger for rerouting. */
  const injectCongestion = useCallback(() => {
    setSegments((prev) =>
      prev.map((s) =>
        s.id === 't3' || s.id === 't4'
          ? { ...s, level: 'severe', congestion: 0.94 }
          : s
      )
    )
    setPredictiveAlert({
      id: 'live-1',
      location: 'Mehdipatnam – Masab Tank',
      current: 0.62,
      predicted: 0.94,
      etaMinutes: 15,
      coords: [17.395, 78.436],
    })
  }, [])

  const runReroute = useCallback(async () => {
    setRerouting(true)
    try {
      const res = await api.reroute({ routeId: selectedRoute?.id })
      setRerouteResult(res)
      setRoutes((prev) => [res.newRoute, ...prev.filter((r) => r.id !== 'r1')])
      setSelectedRouteId(res.newRoute.id)
      return res
    } catch (err) {
      setError(err.message || 'Rerouting failed.')
      return null
    } finally {
      setRerouting(false)
    }
  }, [selectedRoute])

  const resetScenario = useCallback(() => {
    clearTimers()
    setRoutes([])
    setSelectedRouteId(null)
    setRerouteResult(null)
    setPredictiveAlert(null)
    setSegments(TRAFFIC_SEGMENTS)
    setDemoMode(false)
    setDemoStep(null)
  }, [clearTimers])

  /**
   * Deterministic demo: optimize → congestion spike → predictive alert →
   * reroute → done. Fixed timings so it plays identically every run.
   */
  const startDemo = useCallback(async () => {
    clearTimers()
    setDemoMode(true)
    setRerouteResult(null)
    setPredictiveAlert(null)
    setSegments(TRAFFIC_SEGMENTS)
    setRoutes([])

    setDemoStep('optimizing')
    const res = await api.getRouteOptimization({ start, end, algorithm: 'qpso', mode })
    setRoutes(res.routes)
    setSelectedRouteId(res.recommended.id)

    const at = (ms, fn) => timers.current.push(setTimeout(fn, ms))

    at(3600, () => {
      setDemoStep('traffic-rising')
      injectCongestion()
    })
    at(6600, () => setDemoStep('alert'))
    at(9600, async () => {
      setDemoStep('rerouting')
      setRerouting(true)
      const r = await api.reroute({ routeId: 'r1' })
      setRerouteResult(r)
      setRoutes((prev) => [r.newRoute, ...prev.filter((x) => x.id !== 'r1')])
      setSelectedRouteId(r.newRoute.id)
      setRerouting(false)
      setDemoStep('done')
    })
  }, [clearTimers, injectCongestion, start, mode])

  const stopDemo = useCallback(() => {
    clearTimers()
    setDemoMode(false)
    setDemoStep(null)
  }, [clearTimers])

  const dismissAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const value = {
    user, signIn, signUp: signIn, continueAsGuest, signOut,
    theme, setTheme,
    collapsed, setCollapsed,
    settings, setSettings,
    start, setStart, end, setEnd,
    algorithm, setAlgorithm, mode, setMode,
    routes, selectedRoute, selectedRouteId, setSelectedRouteId,
    optimizing, optimize, error,
    segments, incidents, alerts, dismissAlert,
    predictiveAlert, injectCongestion,
    rerouting, rerouteResult, runReroute,
    demoMode, demoStep, startDemo, stopDemo, resetScenario,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export { ROUTES, REROUTED_ROUTE }
