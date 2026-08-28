import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { HYDERABAD_CENTER, TRAFFIC_COLORS, TRAFFIC_LABELS } from '../data/mockData'

/* Leaflet's default marker images don't resolve under a bundler, so every
   marker here uses a divIcon instead. */
const pin = (label, color) =>
  L.divIcon({
    className: '',
    html: `<div class="marker-pin" style="background:${color};box-shadow:0 0 14px ${color}">${label}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })

const incidentIcon = (color) =>
  L.divIcon({
    className: '',
    html: `<div class="incident-pin" style="background:${color}22;border:2px solid ${color}">
             <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${color}"
                  stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
               <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
               <path d="M12 9v4"/><path d="M12 17h.01"/>
             </svg>
           </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })

const TILES = {
  standard: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  humanitarian: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
}

/** Keeps the viewport framed on whatever is currently being shown. */
function FitBounds({ routes, fallbackCenter }) {
  const map = useMap()

  useEffect(() => {
    if (!routes?.length) {
      map.setView(fallbackCenter, 12, { animate: true })
      return
    }
    const pts = routes.flatMap((r) => r.path)
    if (!pts.length) return
    map.flyToBounds(L.latLngBounds(pts).pad(0.18), { duration: 0.85 })
  }, [routes, map, fallbackCenter])

  return null
}

/** Leaflet mis-measures its container when it mounts inside an animating
 *  element; this nudges it once the layout has settled. */
function InvalidateOnMount() {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 180)
    return () => clearTimeout(t)
  }, [map])
  return null
}

export default function MapView({
  routes = [],
  selectedRouteId = null,
  segments = [],
  incidents = [],
  startPoint = null,
  endPoint = null,
  showTraffic = true,
  showIncidents = true,
  highlightCoords = null,
  onSelectRoute,
  mapStyle = 'standard',
  center = HYDERABAD_CENTER,
  zoom = 12,
}) {
  const ordered = useMemo(() => {
    // Draw the selected route last so it sits on top of the alternatives.
    const sel = routes.filter((r) => r.id === selectedRouteId)
    const rest = routes.filter((r) => r.id !== selectedRouteId)
    return [...rest, ...sel]
  }, [routes, selectedRouteId])

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      zoomControl
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url={TILES[mapStyle] || TILES.standard}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />

      <InvalidateOnMount />
      <FitBounds routes={routes} fallbackCenter={center} />

      {/* congestion overlay */}
      {showTraffic &&
        segments.map((s) => (
          <Polyline
            key={s.id}
            positions={s.path}
            pathOptions={{
              color: TRAFFIC_COLORS[s.level],
              weight: 7,
              opacity: 0.36,
              lineCap: 'round',
            }}
          >
            <Popup>
              <strong>{s.name}</strong>
              <br />
              {TRAFFIC_LABELS[s.level]} · {Math.round(s.congestion * 100)}% congestion
            </Popup>
          </Polyline>
        ))}

      {/* routes */}
      {ordered.map((r) => {
        const selected = r.id === selectedRouteId
        return (
          <div key={r.id}>
            {/* soft glow beneath the active route */}
            {selected && (
              <Polyline
                positions={r.path}
                pathOptions={{ color: r.color, weight: 15, opacity: 0.18, lineCap: 'round' }}
              />
            )}
            <Polyline
              positions={r.path}
              eventHandlers={{ click: () => onSelectRoute?.(r.id) }}
              pathOptions={{
                color: r.color,
                weight: selected ? 5.5 : 3.5,
                opacity: selected ? 1 : 0.5,
                dashArray: selected ? null : '9 9',
                lineCap: 'round',
                className: selected ? 'route-flow' : undefined,
              }}
            >
              <Popup>
                <strong>{r.label}</strong>
                <br />
                {r.distanceKm} km · {r.etaMin} min · {Math.round(r.congestion * 100)}% congestion
                {r.via && (
                  <>
                    <br />
                    <em>{r.via}</em>
                  </>
                )}
              </Popup>
            </Polyline>
          </div>
        )
      })}

      {/* endpoints */}
      {startPoint && (
        <Marker position={startPoint.coords} icon={pin('A', '#22d3ee')}>
          <Popup>Start · {startPoint.name}</Popup>
        </Marker>
      )}
      {endPoint && (
        <Marker position={endPoint.coords} icon={pin('B', '#a855f7')}>
          <Popup>Destination · {endPoint.name}</Popup>
        </Marker>
      )}

      {/* incidents */}
      {showIncidents &&
        incidents.map((i) => (
          <Marker key={i.id} position={i.coords} icon={incidentIcon(TRAFFIC_COLORS[i.severity])}>
            <Popup>
              <strong>{i.name}</strong>
              <br />
              {i.location} · {i.reportedAt}
              <br />
              {i.description}
            </Popup>
          </Marker>
        ))}

      {/* the road a predictive alert is about */}
      {highlightCoords && (
        <Marker position={highlightCoords} icon={incidentIcon('#ef4444')}>
          <Popup>Predicted congestion spike</Popup>
        </Marker>
      )}
    </MapContainer>
  )
}
