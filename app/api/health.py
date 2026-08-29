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
        "adapters": {
            "graph": "mock",
            "optimization": "mock",
            "traffic": "mock",
            "prediction": "mock",
            "benchmark": "mock",
        },
    }
