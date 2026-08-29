/**
 * Translation between the FastAPI backend and the React components.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The two halves were built independently and settled on different
 * conventions. The backend speaks snake_case DTOs shaped around its own
 * models — `{ route: { coordinates: [{lat, lon}], distance_km,
 * travel_time_minutes }, congestion, fitness }`. The components read
 * camelCase route objects — `{ distanceKm, etaMin, congestion, path: [[lat,
 * lon]] }`.
 *
 * Rather than change forty components or ask the backend author to rewrite
 * their models, the mapping lives here, in the one place that already exists
 * to be the boundary. Everything above this file is unchanged whether the data
 * came from a mock or from a live server.
 *
 * Every mapper is defensive: the backend may legitimately omit optional fields
 * (alternatives, predictions, alerts), and a missing field must degrade the UI
 * rather than crash it.
 */

const ROUTE_COLORS = ['#34d399', '#fbbf24', '#fb923c', '#2dd4bf', '#e879f9']

/** Backend coordinates are [{lat, lon}]; Leaflet wants [[lat, lon]]. */
function toPath(coordinates) {
  if (!Array.isArray(coordinates)) return []
  return coordinates
    .map((c) => (Array.isArray(c) ? c : [c?.lat, c?.lon]))
    .filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))
}

/**
 * Score a route out of 100 for the UI gauge.
 * Fitness 0.7 is the free-flow reference; higher fitness means a worse route.
 */
function toScore(fitness) {
  if (!Number.isFinite(fitness)) return 85
  return Math.max(0, Math.min(100, Math.round(100 - (fitness - 0.7) * 22)))
}

/** One backend route payload -> one frontend route object. */
export function mapRoute(payload, index = 0, opts = {}) {
  const r = payload?.route ?? payload ?? {}
  const path = toPath(r.coordinates ?? r.path)
  const etaMin = r.travel_time_minutes ?? r.etaMin ?? 0
  const distanceKm = r.distance_km ?? r.distanceKm ?? 0

  return {
    id: payload?.request_id ? `${payload.request_id}-${index}` : `r${index + 1}`,
    label: opts.label ?? `Route ${index + 1}`,
    algorithm: (payload?.algorithm ?? opts.algorithm ?? 'QPSO').toUpperCase(),
    recommended: opts.recommended ?? index === 0,
    fastest: opts.fastest ?? index === 0,
    distanceKm: Number(distanceKm.toFixed ? distanceKm.toFixed(2) : distanceKm),
    etaMin: Number(etaMin.toFixed ? etaMin.toFixed(1) : etaMin),
    congestion: payload?.congestion ?? r.congestion ?? 0,
    score: toScore(payload?.fitness),
    timeSavedMin: opts.timeSavedMin ?? 0,
    via: opts.via ?? '',
    color: ROUTE_COLORS[index % ROUTE_COLORS.length],
    fitness: payload?.fitness ?? null,
    runtimeMs: payload?.execution_time_ms ?? null,
    hops: Array.isArray(r.nodes) ? r.nodes.length : path.length,
    path,
  }
}

/** POST /api/routes/optimize (+ optional alternatives) -> what Dashboard reads. */
export function mapOptimizeResponse(primary, alternatives = [], meta = {}) {
  const routes = [mapRoute(primary, 0, { label: 'Route 1', recommended: true, fastest: true })]

  // The /alternatives endpoint returns the primary route as its first entry, so
  // without this the UI lists the same road twice. Identity is (distance, ETA)
  // rounded — two genuinely different corridors effectively never tie on both.
  const seen = new Set([`${routes[0].distanceKm}|${routes[0].etaMin}`])

  alternatives.forEach((alt) => {
    const mapped = mapRoute(alt, routes.length, { label: `Route ${routes.length + 1}` })
    const key = `${mapped.distanceKm}|${mapped.etaMin}`
    if (seen.has(key)) return
    seen.add(key)
    routes.push(mapped)
  })

  // "Time saved" is only meaningful against something: use the slowest option.
  const slowest = Math.max(...routes.map((r) => r.etaMin))
  if (routes.length > 1) routes[0].timeSavedMin = Number((slowest - routes[0].etaMin).toFixed(1))

  return {
    routes,
    recommended: routes[0],
    meta: {
      ...meta,
      requestId: primary?.request_id,
      algorithm: primary?.algorithm,
      computeMs: primary?.execution_time_ms,
      eta: primary?.eta,
      dataSource: primary?.metadata?.data_source,
      isDemoData: false,
    },
  }
}

const LEVEL_COLORS = {
  low: '#34d399',
  moderate: '#fbbf24',
  heavy: '#fb923c',
  severe: '#f43f5e',
}

function levelFor(congestion) {
  if (congestion < 0.3) return 'low'
  if (congestion < 0.5) return 'moderate'
  if (congestion < 0.7) return 'heavy'
  return 'severe'
}

/** GET /api/traffic/current -> map overlay segments. */
export function mapTrafficResponse(payload) {
  const records = payload?.records ?? payload?.data ?? payload ?? []
  const list = Array.isArray(records) ? records : []

  const segments = list.map((rec, i) => {
    const congestion = rec.congestion ?? 0
    const level = rec.level ?? levelFor(congestion)
    const lat = rec.location?.lat ?? rec.coordinate?.lat
    const lon = rec.location?.lon ?? rec.coordinate?.lon
    return {
      id: rec.segment_id ?? `seg${i}`,
      name: rec.road_name ?? rec.segment_id ?? 'Road segment',
      level,
      congestion,
      color: LEVEL_COLORS[level],
      speedKph: rec.speed_kmh ?? null,
      // A point record has no geometry; give Leaflet a degenerate two-point
      // line so the overlay still renders rather than silently vanishing.
      path: Number.isFinite(lat) && Number.isFinite(lon)
        ? [[lat, lon], [lat + 0.0008, lon + 0.0008]]
        : [],
    }
  }).filter((s) => s.path.length)

  return {
    segments,
    incidents: payload?.incidents ?? [],
    updatedAt: payload?.updated_at ?? new Date().toISOString(),
    isDemoData: false,
  }
}

/** GET /api/benchmark/results -> comparison table. */
export function mapBenchmarkResponse(payload) {
  const rows = payload?.results ?? payload?.rows ?? []
  return {
    isDemoData: false,
    problem: payload?.problem ?? 'Algorithm comparison',
    budget: payload?.budget ?? null,
    exactOptimum: payload?.exact_optimum ?? null,
    classical: payload?.classical ?? [],
    rows: (Array.isArray(rows) ? rows : []).map((r) => ({
      algorithm: r.algorithm ?? r.name ?? '?',
      deterministic: (r.algorithm ?? '').toLowerCase() === 'dijkstra',
      distanceKm: r.distance_km ?? r.distanceKm ?? 0,
      timeMin: r.travel_time_minutes ?? r.timeMin ?? 0,
      congestion: r.congestion ?? 0,
      runtimeMs: r.execution_time_ms ?? r.runtimeMs ?? 0,
      fitness: r.fitness ?? r.mean ?? 0,
      fitnessStd: r.std ?? 0,
      fitnessBest: r.best ?? r.fitness ?? 0,
      fitnessWorst: r.worst ?? r.fitness ?? 0,
      iterations: r.iterations ?? null,
      validity: r.validity ?? 100,
    })),
  }
}

/** GET /api/benchmark/convergence -> Recharts series. */
export function mapConvergenceResponse(payload) {
  // /benchmark/convergence/all already returns { chartData, summary } ready for
  // Recharts. The single-algorithm /convergence endpoint returns
  // { algorithm, iterations, fitness_values } instead, so both are handled.
  if (Array.isArray(payload?.chartData)) {
    return { chartData: payload.chartData, summary: payload.summary ?? {}, isDemoData: false }
  }
  if (Array.isArray(payload?.fitness_values)) {
    const name = (payload.algorithm ?? 'QPSO').toUpperCase()
    return {
      chartData: payload.fitness_values.map((v, i) => ({ iteration: i, [name]: v })),
      summary: {
        [name]: {
          iterations: payload.fitness_values.length,
          bestFitness: Math.min(...payload.fitness_values),
          executionMs: payload.execution_time_ms ?? 0,
          converged: 100,
        },
      },
      isDemoData: false,
    }
  }

  const series = payload?.convergence ?? payload?.series ?? payload ?? {}
  const names = Object.keys(series).filter((k) => Array.isArray(series[k]))
  if (!names.length) return { chartData: [], summary: {}, isDemoData: false }

  const longest = Math.max(...names.map((n) => series[n].length))
  const chartData = Array.from({ length: longest }, (_, i) => {
    const point = { iteration: i }
    names.forEach((n) => {
      const arr = series[n]
      point[n.toUpperCase()] = arr[Math.min(i, arr.length - 1)]
    })
    return point
  })

  const summary = {}
  names.forEach((n) => {
    const arr = series[n]
    summary[n.toUpperCase()] = {
      iterations: arr.length,
      bestFitness: Math.min(...arr),
      executionMs: payload?.execution_time_ms ?? 0,
      converged: 100,
    }
  })

  return { chartData, summary, isDemoData: false }
}

/** GET /api/alerts/ -> alert cards. */
export function mapAlertsResponse(payload) {
  const list = payload?.alerts ?? payload ?? []
  return (Array.isArray(list) ? list : []).map((a, i) => ({
    id: a.id ?? a.alert_id ?? `a${i}`,
    kind: a.kind ?? a.type ?? 'incident',
    severity: a.severity ?? 'moderate',
    title: a.title ?? 'Traffic alert',
    location: a.location ?? a.road_name ?? 'Hyderabad',
    time: a.created_at ?? a.time ?? 'just now',
    description: a.message ?? a.description ?? '',
    action: a.action ?? a.recommended_action ?? '',
    current: a.current_congestion ?? a.current,
    predicted: a.predicted_congestion ?? a.predicted,
    etaMinutes: a.eta_minutes ?? a.etaMinutes,
  }))
}


/** GET /api/analytics -> the Analytics page. */
export function mapAnalyticsResponse(payload) {
  return {
    stats: payload?.stats ?? [],
    trend: payload?.trend ?? [],
    prediction: payload?.prediction ?? [],
    performance: payload?.performance ?? [],
    distribution: payload?.distribution ?? [],
    isDemoData: false,
  }
}

/** GET /api/routes/history -> the History table. */
export function mapHistoryResponse(payload) {
  const rows = payload?.results ?? payload ?? []
  return (Array.isArray(rows) ? rows : []).map((r, i) => ({
    id: r.request_id ?? `h${i}`,
    date: (r.eta ?? r.created_at ?? '').toString().replace('T', ' ').slice(0, 16),
    start: r.source_name ?? 'Start',
    end: r.destination_name ?? 'Destination',
    algorithm: (r.algorithm ?? 'qpso').toUpperCase(),
    distanceKm: r.route?.distance_km ?? 0,
    etaMin: Math.round(r.route?.travel_time_minutes ?? 0),
    traffic: (r.congestion ?? 0) < 0.3 ? 'low'
      : (r.congestion ?? 0) < 0.5 ? 'moderate'
      : (r.congestion ?? 0) < 0.7 ? 'heavy' : 'severe',
    status: 'completed',
  }))
}
