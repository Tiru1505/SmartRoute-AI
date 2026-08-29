"""System health and status endpoints."""

from fastapi import APIRouter

from app.core.config import get_settings
from app.database.mongodb import check_health

router = APIRouter(tags=["system"])


@router.get(
    "/health",
    summary="Health check",
    description="Basic liveness probe. Returns 200 if the server is running.",
    responses={200: {"description": "Service is alive"}},
)
def health() -> dict[str, str]:
    return {"status": "ok", "service": "smartroute-backend"}


@router.get(
    "/status",
    summary="Detailed system status",
    description="Returns server status including MongoDB connectivity, environment, and version.",
    responses={200: {"description": "Detailed status information"}},
)
def status() -> dict:
    settings = get_settings()
    db_status = check_health()
    return {
        "status": "ready",
        "version": settings.app_version,
        "environment": settings.app_env,
        "database": db_status,
        # Reported from the adapters actually wired in, not hardcoded. graph,
        # optimization and traffic run on the real OSM engine now; prediction
        # is still a placeholder and says so.
        "adapters": _adapter_status(),
    }


def _adapter_status() -> dict[str, str]:
    """Which implementation is behind each adapter right now."""
    from app.integrations.graph_adapter import get_graph_adapter
    from app.integrations.qpso_adapter import get_optimization_adapter
    from app.integrations.traffic_adapter import get_traffic_adapter

    def label(obj) -> str:
        return getattr(obj, "data_source", "unknown")

    try:
        return {
            "graph": label(get_graph_adapter()),
            "optimization": label(get_optimization_adapter("qpso")),
            "traffic": label(get_traffic_adapter()),
            "prediction": "mock",          # no LSTM/GRU wired in yet
            "benchmark": "osm",            # served from real benchmark runs
        }
    except Exception:                      # never let /status fail on this
        return {"graph": "unknown", "optimization": "unknown",
                "traffic": "unknown", "prediction": "mock",
                "benchmark": "unknown"}
