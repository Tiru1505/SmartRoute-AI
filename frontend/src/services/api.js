/**
 * The single boundary between the UI and the backend.
 *
 * Right now every function resolves mock data after a small artificial delay so
 * loading states are real and visible. When FastAPI is ready, flip USE_MOCK to
 * false (or set VITE_USE_MOCK=false) and only this file changes — no component
 * needs touching, because the response shapes are identical.
 *
 * Expected backend, once it exists:
 *   POST /optimize-route   POST /reroute      GET /traffic
 *   GET  /prediction       GET  /benchmark    GET /convergence
 */
import {
  ALERTS, BENCHMARK, CONVERGENCE, CONVERGENCE_CHART_DATA, INCIDENTS,
  PREDICTION_SERIES, REROUTED_ROUTE, ROUTES, SCALABILITY, TRAFFIC_SEGMENTS,
  ROUTE_HISTORY, TRAFFIC_TREND, TRAFFIC_DISTRIBUTION, ROUTE_PERFORMANCE,
  ANALYTICS_STATS,
} from '../data/mockData'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const BASE = import.meta.env.VITE_API_BASE || '/api'

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

/** Deep-clones mock payloads so callers can never mutate the shared store. */
const clone = (v) => JSON.parse(JSON.stringify(v))

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(path, options = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    if (!res.ok) throw new ApiError(`Request failed: ${res.statusText}`, res.status)
    return await res.json()
  } catch (err) {
    if (err instanceof ApiError) throw err
    throw new ApiError('Cannot reach the optimization backend.', 0)
  }
}

/* ------------------------------------------------------------------ routes */

/**
 * Run the optimizer.
 * @returns {{ routes: Array, recommended: Object, meta: Object }}
 */
export async function getRouteOptimization({ start, end, algorithm = 'qpso', mode = 'balanced' } = {}) {
  if (!USE_MOCK) {
    return request('/optimize-route', {
      method: 'POST',
      body: JSON.stringify({ start, end, algorithm, mode }),
    })
  }
  await delay(400)
  const routes = clone(ROUTES)
  return {
    routes,
    recommended: routes.find((r) => r.recommended) || routes[0],
    meta: {
      algorithm,
      mode,
      isDemoData: true,
      computedAt: new Date().toISOString(),
    },
  }
}

export async function getAlternativeRoutes({ start, end } = {}) {
  if (!USE_MOCK) return request(`/alternatives?start=${start}&end=${end}`)
  await delay(250)
  return clone(ROUTES.filter((r) => !r.recommended))
}

/** Recompute after a congestion spike on the active route. */
export async function reroute({ routeId, reason = 'congestion_spike' } = {}) {
  if (!USE_MOCK) {
    return request('/reroute', { method: 'POST', body: JSON.stringify({ routeId, reason }) })
  }
  await delay(600)
  const oldRoute = clone(ROUTES[0])
  const newRoute = clone(REROUTED_ROUTE)
  return {
    oldRoute,
    newRoute,
    previousEtaMin: 24,
    newEtaMin: newRoute.etaMin > 24 ? 17 : 17,
    timeSavedMin: 7,
    reason,
    isDemoData: true,
  }
}

/* ----------------------------------------------------------------- traffic */

export async function getTrafficData() {
  if (!USE_MOCK) return request('/traffic')
  await delay(300)
  return {
    segments: clone(TRAFFIC_SEGMENTS),
    incidents: clone(INCIDENTS),
    updatedAt: new Date().toISOString(),
    isDemoData: true,
  }
}

export async function getPrediction() {
  if (!USE_MOCK) return request('/prediction')
  await delay(300)
  return { series: clone(PREDICTION_SERIES), isDemoData: true }
}

export async function getAlerts() {
  if (!USE_MOCK) return request('/alerts')
  await delay(250)
  return clone(ALERTS)
}

/* --------------------------------------------------------------- analytics */

export async function getAnalytics() {
  if (!USE_MOCK) return request('/analytics')
  await delay(350)
  return {
    stats: clone(ANALYTICS_STATS),
    trend: clone(TRAFFIC_TREND),
    prediction: clone(PREDICTION_SERIES),
    performance: clone(ROUTE_PERFORMANCE),
    distribution: clone(TRAFFIC_DISTRIBUTION),
    isDemoData: true,
  }
}

export async function getBenchmark() {
  if (!USE_MOCK) return request('/benchmark')
  await delay(400)
  return clone(BENCHMARK)
}

export async function getConvergence() {
  if (!USE_MOCK) return request('/convergence')
  await delay(400)
  return {
    ...clone(CONVERGENCE),
    chartData: clone(CONVERGENCE_CHART_DATA),
  }
}

export async function getScalability() {
  if (!USE_MOCK) return request('/scalability')
  await delay(400)
  return clone(SCALABILITY)
}

export async function getRouteHistory() {
  if (!USE_MOCK) return request('/history')
  await delay(250)
  return clone(ROUTE_HISTORY)
}

export async function getHealth() {
  if (!USE_MOCK) return request('/health')
  await delay(120)
  return { status: 'ok', backend: 'mock' }
}

export { ApiError, USE_MOCK }
