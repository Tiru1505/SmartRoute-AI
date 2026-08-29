"""Benchmarking API endpoints."""

from fastapi import APIRouter, Query

from app.models.benchmark_models import BenchmarkRequest, BenchmarkResult, ConvergenceResult
from app.services.benchmark_service import BenchmarkService

router = APIRouter(prefix="/benchmark", tags=["benchmark"])
_service = BenchmarkService()


@router.post(
    "/run",
    response_model=BenchmarkResult,
    summary="Run algorithm benchmark",
    description=(
        "Execute a benchmark comparing multiple optimization algorithms on the "
        "same route. Returns execution time, distance, fitness, and convergence "
        "data for each algorithm."
    ),
    responses={
        200: {"description": "Benchmark completed"},
        422: {"description": "Validation error"},
    },
)
def run_benchmark(request: BenchmarkRequest) -> BenchmarkResult:
    return _service.run(request)


@router.get(
    "/results",
    summary="Get benchmark results history",
    description="Retrieve past benchmark results from the database.",
)
def benchmark_results(
    limit: int = Query(default=50, ge=1, le=200, description="Max results"),
    stops: int = Query(default=6, ge=3, le=8, description="Stops in the test problem"),
    trials: int = Query(default=20, ge=1, le=50, description="Trials per algorithm"),
) -> dict:
    """
    Stored results if any exist, otherwise run the real comparison.

    Previously this returned {"results": []} on a fresh database, so the
    Benchmark page — the centrepiece of the project — rendered an empty table.
    Falling back to a live run means the page always has something true to show.
    """
    results = _service.get_results(limit=limit)
    if results:
        return {"results": results}

    from app.api.analytics import _cached

    def build():
        from app.integrations.engine_bridge import get_engine
        data = get_engine().benchmark(stops=stops, trials=trials)
        return {
            "results": [
                {
                    "algorithm": r["algorithm"],
                    "distance_km": r.get("distanceKm"),
                    "travel_time_minutes": r.get("timeMin"),
                    "congestion": r.get("congestion"),
                    "fitness": r["mean"],
                    "best": r["best"],
                    "worst": r["worst"],
                    "std": r["std"],
                    "execution_time_ms": r["runtimeMs"],
                    "iterations": r["iterations"],
                    "optimal_hits": r["optimalHits"],
                    "trials": r["trials"],
                    "gap_pct": r["gapPct"],
                }
                for r in data["rows"]
            ],
            "problem": data["problem"],
            "budget": data["budget"],
            "exact_optimum": data["exactOptimum"],
            "classical": data["classical"],
            "source": "live",
        }

    return _cached(f"benchmark:{stops}:{trials}", build)


@router.get(
    "/convergence",
    response_model=ConvergenceResult,
    summary="Get convergence data",
    description="Retrieve convergence data for a specific algorithm from the last benchmark run.",
)
def convergence(
    algorithm: str = Query(default="qpso", description="Algorithm name"),
) -> ConvergenceResult:
    return _service.get_convergence(algorithm)


@router.get(
    "/convergence/all",
    summary="Convergence curves for every algorithm",
    description=(
        "QPSO, PSO and GA on one chart. /convergence returns a single algorithm, "
        "which cannot show the comparison the project is actually about."
    ),
)
def convergence_all(
    stops: int = Query(default=6, ge=3, le=8),
    trials: int = Query(default=15, ge=1, le=40),
) -> dict:
    from app.api.analytics import _cached

    def build():
        from app.integrations.engine_bridge import get_engine
        engine = get_engine()
        engine.benchmark(stops=stops, trials=trials)
        return engine.convergence(stops=stops, trials=trials)

    return _cached(f"convergence:{stops}:{trials}", build)
