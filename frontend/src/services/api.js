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
  LOCATIONS, PREDICTION_SERIES, REROUTED_ROUTE, ROUTES, SCALABILITY,
  TRAFFIC_SEGMENTS, ROUTE_HISTORY, TRAFFIC_TREND, TRAFFIC_DISTRIBUTION,
  ROUTE_PERFORMANCE, ANALYTICS_STATS,
} from '../data/mockData'
import {
  mapAlertsResponse, mapAnalyticsResponse, mapBenchmarkResponse,
  mapConvergenceResponse, mapHistoryResponse, mapOptimizeResponse,
  mapTrafficResponse,
} from './backendAdapter'

/** Place id -> {lat, lon}, since the backend routes by coordinate. */
function coordsFor(id) {
  const place = LOCATIONS.find((l) => l.id === id)
  if (!place) throw new ApiError(`Unknown location: ${id}`, 400)
  return { lat: place.coords[0], lon: place.coords[1] }
}

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
    const body = JSON.stringify({
      source: coordsFor(start),
      destination: coordsFor(end),
      algorithm,
    })
    const primary = await request('/routes/optimize', { method: 'POST', body })

    // Alternatives are best-effort: the map is still useful with one route.
    let alternatives = []
    try {
      const alt = await request('/routes/alternatives', { method: 'POST', body })
      alternatives = Array.isArray(alt) ? alt : (alt?.alternatives ?? alt?.routes ?? [])
    } catch {
      alternatives = []
    }

    const mapped = mapOptimizeResponse(primary, alternatives, { from: start, to: end, mode })
    if (import.meta.env.DEV) window.__qroLast = { primary, alternatives, mapped }
    return mapped
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
  if (!USE_MOCK) return mapTrafficResponse(await request('/traffic/current'))
  await delay(300)
  return {
    segments: clone(TRAFFIC_SEGMENTS),
    incidents: clone(INCIDENTS),
    updatedAt: new Date().toISOString(),
    isDemoData: true,
  }
}

export async function getPrediction() {
  if (!USE_MOCK) return request('/prediction/status')
  await delay(300)
  return { series: clone(PREDICTION_SERIES), isDemoData: true }
}

export async function getAlerts() {
  if (!USE_MOCK) return mapAlertsResponse(await request('/alerts/'))
  await delay(250)
  return clone(ALERTS)
}

/* --------------------------------------------------------------- analytics */

export async function getAnalytics() {
  if (!USE_MOCK) return mapAnalyticsResponse(await request('/analytics'))
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
  if (!USE_MOCK) return mapBenchmarkResponse(await request('/benchmark/results'))
  await delay(400)
  return clone(BENCHMARK)
}

export async function getConvergence() {
  if (!USE_MOCK) return mapConvergenceResponse(await request('/benchmark/convergence/all'))
  await delay(400)
  return {
    ...clone(CONVERGENCE),
    chartData: clone(CONVERGENCE_CHART_DATA),
  }
}

export async function getScalability() {
  if (!USE_MOCK) return await request('/analytics/scalability')
  await delay(400)
  return clone(SCALABILITY)
}

export async function getRouteHistory() {
  if (!USE_MOCK) return mapHistoryResponse(await request('/routes/history'))
  await delay(250)
  return clone(ROUTE_HISTORY)
}

export async function getHealth() {
  if (!USE_MOCK) return request('/health')  // backend mounts this at /api/health
  await delay(120)
  return { status: 'ok', backend: 'mock' }
}

export { ApiError, USE_MOCK }
