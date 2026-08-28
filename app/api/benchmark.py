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
) -> dict:
    results = _service.get_results(limit=limit)
    return {"results": results}


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
