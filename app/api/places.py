"""
Place search — turns typed text into a routable coordinate.

The UI used to offer a fixed dropdown of 18 landmarks. Users can now type any
place name, so something has to resolve free text to a lat/lon. Two sources,
tried in order:

  1. The curated presets in config/places.yaml. Instant, offline, and already
     known to sit on the graph.
  2. Nominatim (OpenStreetMap's geocoder), restricted to the Hyderabad metro
     bounding box so a search for "airport" cannot return Frankfurt.

Every OSM candidate is checked against the routing graph before it is offered.
A place 8 km from the nearest road node in our extract would produce a route
that silently starts somewhere else, which is worse than no result — so those
are dropped rather than returned.

Nominatim is a free community service. Its usage policy asks for at most one
request per second and a descriptive User-Agent, both of which are honoured
below, and results are cached so repeated keystrokes cost nothing. Before this
is deployed publicly, put a contact address in CONTACT and consider running a
local Nominatim instance or switching to a paid geocoder.
"""

from __future__ import annotations

import threading
import time
from functools import lru_cache

import requests
from fastapi import APIRouter, Query

from app.core.logging import get_logger
from app.models.route_models import Coordinate

router = APIRouter(prefix="/places", tags=["places"])
_logger = get_logger("api.places")

# The box the graph was built with (preprocessing/osm_processor.METRO_BBOX).
# Order: lon_min, lat_min, lon_max, lat_max
METRO_BBOX = (78.15, 17.15, 78.75, 17.70)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
CONTACT = ""          # add a contact address before any public deployment
USER_AGENT = "QRoute/0.1 (SIH PS26137 quantum-inspired route optimizer)"
_MIN_INTERVAL_S = 1.1  # Nominatim asks for no more than 1 request/second

# A candidate further than this from any road node in our extract is not
# routable: the optimizer would silently start somewhere else.
SNAP_LIMIT_M = 1500.0

_throttle_lock = threading.Lock()
_last_call = 0.0


# ---------------------------------------------------------------- presets

@lru_cache(maxsize=1)
def _presets() -> list[dict]:
    """config/places.yaml as a flat, search-ready list."""
    from graph.graph_loader import load_places

    out = []
    for key, p in load_places().items():
        out.append({
            "id": key,
            "name": p["name"],
            "address": "Hyderabad, Telangana",
            "lat": float(p["lat"]),
            "lon": float(p["lon"]),
            "source": "preset",
            "snap_m": None,
        })
    return sorted(out, key=lambda r: r["name"])


def _match_presets(q: str, limit: int) -> list[dict]:
    """Substring match, with prefix matches ranked first."""
    if not q:
        return _presets()[:limit]

    ql = q.lower()
    starts, contains = [], []
    for p in _presets():
        nl = p["name"].lower()
        if nl.startswith(ql):
            starts.append(p)
        elif ql in nl:
            contains.append(p)
    return (starts + contains)[:limit]


# ---------------------------------------------------------------- geocoding

def _inside_bbox(lat: float, lon: float) -> bool:
    lon_min, lat_min, lon_max, lat_max = METRO_BBOX
    return lat_min <= lat <= lat_max and lon_min <= lon <= lon_max


def _snap_metres(lat: float, lon: float) -> float | None:
    """
    Distance from this point to the nearest road node, or None when the graph
    is not loaded yet.

    Deliberately does NOT trigger the ~30 s graph load. A search box has to
    stay responsive, and the bounding-box test above is a good enough filter
    until the engine happens to be warm.
    """
    from app.integrations import engine_bridge

    engine = engine_bridge._engine
    if engine is None:
        return None

    import osmnx as ox

    node = engine_bridge._nearest(engine, Coordinate(lat=lat, lon=lon))
    return float(ox.distance.great_circle(
        lat, lon, float(engine.G.nodes[node]["y"]), float(engine.G.nodes[node]["x"])
    ))


def _throttled_get(params: dict) -> list[dict]:
    """One Nominatim call, never faster than the usage policy allows."""
    global _last_call

    with _throttle_lock:
        wait = _MIN_INTERVAL_S - (time.monotonic() - _last_call)
        if wait > 0:
            time.sleep(wait)
        _last_call = time.monotonic()

    headers = {"User-Agent": USER_AGENT}
    if CONTACT:
        headers["From"] = CONTACT

    res = requests.get(NOMINATIM_URL, params=params, headers=headers, timeout=6)
    res.raise_for_status()
    return res.json()


def _geocode(q: str, limit: int) -> list[dict]:
    lon_min, lat_min, lon_max, lat_max = METRO_BBOX
    raw = _throttled_get({
        "q": q,
        "format": "jsonv2",
        "limit": limit,
        "viewbox": f"{lon_min},{lat_max},{lon_max},{lat_min}",
        "bounded": 1,
        "countrycodes": "in",
        "addressdetails": 1,
    })

    out = []
    for item in raw:
        try:
            lat, lon = float(item["lat"]), float(item["lon"])
        except (KeyError, TypeError, ValueError):
            continue
        if not _inside_bbox(lat, lon):
            continue

        snap = _snap_metres(lat, lon)
        if snap is not None and snap > SNAP_LIMIT_M:
            _logger.debug("dropping %s: %.0f m from the graph", item.get("name"), snap)
            continue

        display = item.get("display_name", "")
        head = item.get("name") or display.split(",")[0]
        tail = ", ".join(part.strip() for part in display.split(",")[1:4])

        out.append({
            "id": f"osm:{item.get('osm_type', 'n')}{item.get('osm_id', '')}",
            "name": head,
            "address": tail or "Hyderabad, Telangana",
            "lat": lat,
            "lon": lon,
            "source": "osm",
            "snap_m": round(snap, 1) if snap is not None else None,
        })
    return out


# ---------------------------------------------------------------- cache

_cache: dict[tuple[str, int], list[dict]] = {}
_CACHE_MAX = 512


def _cached_geocode(q: str, limit: int) -> tuple[list[dict], bool]:
    """Returns (results, degraded); degraded=True means the geocoder failed."""
    key = (q.lower(), limit)
    if key in _cache:
        return _cache[key], False

    try:
        results = _geocode(q, limit)
    except Exception as exc:                    # network, timeout, 429, bad JSON
        _logger.warning("geocoder unavailable for %r: %s", q, exc)
        return [], True

    if len(_cache) >= _CACHE_MAX:
        _cache.clear()
    _cache[key] = results
    return results, False


# ---------------------------------------------------------------- endpoint

@router.get(
    "/search",
    summary="Search for a routable place",
    description=(
        "Free-text place search restricted to the Hyderabad metro area. "
        "Curated landmarks come first, then OpenStreetMap matches. Only "
        "places that sit on the routing graph are returned."
    ),
)
def search_places(
    q: str = Query(default="", description="What the user typed"),
    limit: int = Query(default=8, ge=1, le=20),
) -> dict:
    q = q.strip()
    presets = _match_presets(q, limit)

    # One- and two-letter fragments match half the city. Hitting the network on
    # every keystroke is not worth it; presets answer these well enough.
    if len(q) < 3:
        return {"query": q, "results": presets, "degraded": False}

    remaining = limit - len(presets)
    geocoded, degraded = [], False
    if remaining > 0:
        geocoded, degraded = _cached_geocode(q, remaining)

    seen = {(round(p["lat"], 4), round(p["lon"], 4)) for p in presets}
    merged = list(presets)
    for g in geocoded:
        gkey = (round(g["lat"], 4), round(g["lon"], 4))
        if gkey not in seen:
            seen.add(gkey)
            merged.append(g)

    return {"query": q, "results": merged[:limit], "degraded": degraded}
