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

/**
 * A place -> {lat, lon}, since the backend routes by coordinate.
 *
 * Places are now resolved by the search box rather than picked from a fixed
 * list, so they arrive as objects. The `coords` fallback covers the curated
 * landmarks in mockData, which still use the [lat, lon] tuple shape.
 */
function coordsFor(place) {
  if (!place) throw new ApiError('No location selected', 400)
  const lat = place.lat ?? place.coords?.[0]
  const lon = place.lon ?? place.coords?.[1]
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    throw new ApiError(`Location has no coordinates: ${place.name || place.id}`, 400)
  }
  return { lat, lon }
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

/* ------------------------------------------------------------------ places */

/**
 * Free-text place search.
 *
 * The backend merges the curated Hyderabad landmarks with OpenStreetMap
 * results and drops anything that is not on the routing graph, so every result
 * here is safe to route from. In mock mode we filter the curated list locally,
 * which keeps the UI usable with the backend switched off.
 *
 * @returns {Promise<Array<{id, name, address, lat, lon, source}>>}
 */
export async function searchPlaces(query = '', limit = 8) {
  const q = query.trim()

  if (!USE_MOCK) {
    try {
      const res = await request(`/places/search?q=${encodeURIComponent(q)}&limit=${limit}`)
      return Array.isArray(res?.results) ? res.results : []
    } catch {
      // A dead geocoder should not empty the box — fall through to the
      // curated landmarks so the demo still works offline.
    }
  }

  await delay(USE_MOCK ? 160 : 0)
  const ql = q.toLowerCase()
  return LOCATIONS
    .filter((l) => !ql || l.name.toLowerCase().includes(ql))
    .slice(0, limit)
    .map((l) => ({
      id: l.id,
      name: l.name,
      address: 'Hyderabad, Telangana',
      lat: l.coords[0],
      lon: l.coords[1],
      source: 'preset',
    }))
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
      // Sent so the history page can show where the trip actually went.
      // Endpoints are free text now, so the name cannot be looked up from a
      // coordinate after the fact.
      source_name: start?.name ?? null,
      destination_name: end?.name ?? null,
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

    const mapped = mapOptimizeResponse(primary, alternatives, {
      from: start?.name ?? start,
      to: end?.name ?? end,
      mode,
    })
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

/**
 * Recompute from where the driver is now.
 *
 * Hits POST /routes/reroute, which advances the active trip, congests the road
 * ahead and re-solves with Dijkstra from the current position. It needs a route
 * to have been optimised first — that call is what creates the trip.
 *
 * The backend already answers in the shape the UI wants (camelCase, with the
 * new route serialised for the map), so only the old route is added here.
 */
export async function reroute({ progress = 0.4, spike = true, force = false, oldRoute = null } = {}) {
  if (!USE_MOCK) {
    const res = await request('/routes/reroute', {
      method: 'POST',
      body: JSON.stringify({ progress, spike, force }),
    })
    return {
      ...res,
      oldRoute,
      // shouldReroute false is a real answer — the current route is still best.
      // The panel needs newRoute to exist before it renders a comparison.
      newRoute: res.newRoute ?? null,
      isDemoData: false,
    }
  }
  await delay(600)
  const mockNew = clone(REROUTED_ROUTE)
  return {
    shouldReroute: true,
    oldRoute: oldRoute ?? clone(ROUTES[0]),
    newRoute: mockNew,
    // Kept internally consistent: 24 - 17 = 7.
    previousEtaMin: 24,
    newEtaMin: 17,
    timeSavedMin: 7,
    savedPct: 29.2,
    algorithm: 'Dijkstra',
    reason: 'congestion ahead on the current corridor',
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
