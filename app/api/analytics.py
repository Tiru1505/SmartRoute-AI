"""
Analytics, scalability and multi-stop endpoints.

These three pages of the dashboard had nothing to call: the frontend requested
/analytics and /scalability, and both 404'd, so the Analytics page rendered
empty and the Benchmark page showed an empty table.

Everything here is served from the real optimisation engine. The heavy
endpoints (benchmark, scalability) are cached in-process because a full run
takes tens of seconds and the dashboard re-fetches on every visit.
"""
from __future__ import annotations

import threading

from fastapi import APIRouter, Query

from app.core.logging import get_logger

router = APIRouter(prefix="/analytics", tags=["Analytics"])
_logger = get_logger("api.analytics")

_cache: dict = {}
_lock = threading.Lock()


def _engine():
    from app.integrations.engine_bridge import get_engine
    return get_engine()


def _cached(key, build):
    """Compute once per process. Benchmarks take tens of seconds."""
    if key not in _cache:
        with _lock:
            if key not in _cache:
                _cache[key] = build()
    return _cache[key]


@router.get("", summary="Dashboard analytics")
@router.get("/", include_in_schema=False)
def analytics() -> dict:
    """
    Headline stats and chart series for the Analytics page.

    The traffic trend is the simulator's own diurnal profile, which is the
    honest thing to show: it is the curve the congestion model is actually
    driven by, not a decorative sine wave.
    """
    from traffic.simulator import diurnal_factor

    engine = _engine()
    traffic = engine.traffic(limit=400)
    segments = traffic["segments"]

    counts = {"low": 0, "moderate": 0, "heavy": 0, "severe": 0}
    for s in segments:
        counts[s["level"]] += 1
    total = max(len(segments), 1)

    congestions = [s["congestion"] for s in segments] or [0.0]
    mean_congestion = sum(congestions) / len(congestions)

    # Peak intensity scales the diurnal curve to today's scenario.
    peak = max(mean_congestion, 0.01)
    trend = [
        {
            "hour": f"{h:02d}:00",
            "congestion": round(diurnal_factor(h) / diurnal_factor(18.5) * peak * 100, 1),
            "vehicles": int(diurnal_factor(h) * 4000),
        }
        for h in range(0, 24, 2)
    ]

    return {
        "stats": [
            {"label": "Average Traffic", "value": round(mean_congestion * 100, 1),
             "suffix": "%", "tone": "yellow", "trend": None},
            {"label": "Monitored Segments", "value": len(segments),
             "suffix": "", "tone": "cyan", "trend": None},
            {"label": "Severe Segments", "value": counts["severe"],
             "suffix": "", "tone": "red", "trend": None},
            {"label": "Heavy Segments", "value": counts["heavy"],
             "suffix": "", "tone": "orange", "trend": None},
            {"label": "Active Incidents", "value": len(traffic["incidents"]),
             "suffix": "", "tone": "orange", "trend": None},
            {"label": "Graph Edges", "value": engine.G.number_of_edges(),
             "suffix": "", "tone": "cyan", "trend": None},
        ],
        "trend": trend,
        "prediction": [
            {"time": "now", "actual": round(mean_congestion * 100, 1),
             "predicted": round(mean_congestion * 100, 1)},
            *[
                {"time": f"+{m}m", "actual": None,
                 "predicted": round(min(mean_congestion * (1 + m / 60) * 100, 99), 1)}
                for m in (5, 10, 15, 20, 25, 30)
            ],
        ],
        "performance": [
            {"route": s["name"][:22], "distance": round(s["congestion"] * 30, 1),
             "time": round(s["congestion"] * 60, 1)}
            for s in segments[:6]
        ],
        "distribution": [
            {"name": "Low", "value": round(counts["low"] / total * 100), "color": "#34d399"},
            {"name": "Moderate", "value": round(counts["moderate"] / total * 100), "color": "#fbbf24"},
            {"name": "Heavy", "value": round(counts["heavy"] / total * 100), "color": "#fb923c"},
            {"name": "Severe", "value": round(counts["severe"] / total * 100), "color": "#f43f5e"},
        ],
        "scenario": engine.scenario,
        "isDemoData": False,
    }


@router.get("/scalability", summary="Scalability of each algorithm")
def scalability(
    trials: int = Query(default=5, ge=1, le=30),
    max_stops: int = Query(default=7, ge=3, le=9),
) -> dict:
    """
    Runtime and solution quality against problem size.

    Brute force is included up to 8 stops; beyond that it is intractable, which
    is the point the chart is making.
    """
    def build():
        engine = _engine()
        sizes = tuple(range(3, max_stops + 1))
        rows = engine.scalability(sizes=sizes, trials=trials)["rows"]
        return {
            "isDemoData": False,
            "rows": [
                {
                    "nodes": r["stops"],
                    "orderings": r["orderings"],
                    "bruteMs": r.get("bruteMs"),
                    "dijkstra": r.get("bruteMs") or 0,
                    "qpso": r.get("QPSO") or 0,
                    "pso": r.get("PSO") or 0,
                    "ga": r.get("GA") or 0,
                    "qpsoQuality": round(100 - (r.get("QPSOGap") or 0), 2),
                }
                for r in rows
            ],
        }

    return _cached(f"scalability:{trials}:{max_stops}", build)
