"""Optimization adapters — interface boundary for QPSO, PSO, GA, Dijkstra.

╔══════════════════════════════════════════════════════════════════════╗
║  TEAM INTEGRATION POINTS                                            ║
║                                                                     ║
║  Person 1 (QPSO Engineer):                                         ║
║    Replace ``MockQpsoAdapter`` with your real QPSO implementation.  ║
║    Your class MUST inherit from ``BaseOptimizationAdapter``.        ║
║                                                                     ║
║  Person 4 (Benchmarking & Research Engineer):                       ║
║    Replace ``MockPsoAdapter``, ``MockGaAdapter``, and               ║
║    ``MockDijkstraAdapter`` with your real implementations.          ║
║                                                                     ║
║  Expected inputs:                                                   ║
║    - RouteRequest (source, destination, constraints)                ║
║    - GraphRoute baseline from the graph adapter                     ║
║    - iterations / particles count                                   ║
║  Expected outputs:                                                  ║
║    - OptimizationResult dataclass with the optimized route          ║
║      plus fitness, convergence data, and iterations used            ║
╚══════════════════════════════════════════════════════════════════════╝
"""

import random
from abc import ABC, abstractmethod
from dataclasses import dataclass, field

from app.core.logging import get_logger
from app.integrations.graph_adapter import GraphRoute
from app.models.route_models import RouteRequest

_logger = get_logger("integrations.optimization")


@dataclass
class OptimizationResult:
    """Data transfer object returned by optimization adapters."""
    route: GraphRoute
    fitness: float | None = None
    iterations_used: int | None = None
    convergence_history: list[float] = field(default_factory=list)


class BaseOptimizationAdapter(ABC):
    """Abstract interface that all optimization implementations must follow."""

    algorithm: str = "unknown"

    @abstractmethod
    def optimize(
        self,
        request: RouteRequest,
        baseline: GraphRoute,
        iterations: int = 100,
        particles: int = 30,
    ) -> OptimizationResult:
        """Run the optimization algorithm and return an OptimizationResult."""
        ...

    @abstractmethod
    def get_convergence(self) -> list[float]:
        """Return the convergence history from the last run."""
        ...


# ---------------------------------------------------------------------------
# Mock adapters — each clearly marked as placeholder
# ---------------------------------------------------------------------------

class MockQpsoAdapter(BaseOptimizationAdapter):
    """Development-only placeholder — NOT a QPSO implementation."""

    algorithm = "qpso"

    def __init__(self) -> None:
        self._last_convergence: list[float] = []

    def optimize(
        self, request: RouteRequest, baseline: GraphRoute,
        iterations: int = 100, particles: int = 30,
    ) -> OptimizationResult:
        _logger.debug("MockQpsoAdapter: returning baseline as-is (placeholder)")
        self._last_convergence = [round(1.0 - i * 0.008 + random.uniform(-0.002, 0.002), 4) for i in range(min(iterations, 50))]
        return OptimizationResult(
            route=baseline,
            fitness=round(random.uniform(0.7, 0.95), 4),
            iterations_used=min(iterations, 50),
            convergence_history=self._last_convergence,
        )

    def get_convergence(self) -> list[float]:
        return self._last_convergence


class MockPsoAdapter(BaseOptimizationAdapter):
    """Development-only placeholder — NOT a PSO implementation."""

    algorithm = "pso"

    def __init__(self) -> None:
        self._last_convergence: list[float] = []

    def optimize(
        self, request: RouteRequest, baseline: GraphRoute,
        iterations: int = 100, particles: int = 30,
    ) -> OptimizationResult:
        _logger.debug("MockPsoAdapter: returning baseline as-is (placeholder)")
        self._last_convergence = [round(1.0 - i * 0.01, 4) for i in range(min(iterations, 40))]
        return OptimizationResult(
            route=baseline,
            fitness=round(random.uniform(0.6, 0.9), 4),
            iterations_used=min(iterations, 40),
            convergence_history=self._last_convergence,
        )

    def get_convergence(self) -> list[float]:
        return self._last_convergence


class MockGaAdapter(BaseOptimizationAdapter):
    """Development-only placeholder — NOT a Genetic Algorithm implementation."""

    algorithm = "ga"

    def __init__(self) -> None:
        self._last_convergence: list[float] = []

    def optimize(
        self, request: RouteRequest, baseline: GraphRoute,
        iterations: int = 100, particles: int = 30,
    ) -> OptimizationResult:
        _logger.debug("MockGaAdapter: returning baseline as-is (placeholder)")
        self._last_convergence = [round(1.0 - i * 0.009, 4) for i in range(min(iterations, 45))]
        return OptimizationResult(
            route=baseline,
            fitness=round(random.uniform(0.55, 0.88), 4),
            iterations_used=min(iterations, 45),
            convergence_history=self._last_convergence,
        )

    def get_convergence(self) -> list[float]:
        return self._last_convergence


class MockDijkstraAdapter(BaseOptimizationAdapter):
    """Development-only placeholder — the real Dijkstra runs inside the graph module."""

    algorithm = "dijkstra"

    def __init__(self) -> None:
        self._last_convergence: list[float] = []

    def optimize(
        self, request: RouteRequest, baseline: GraphRoute,
        iterations: int = 100, particles: int = 30,
    ) -> OptimizationResult:
        _logger.debug("MockDijkstraAdapter: returning baseline (Dijkstra is deterministic)")
        return OptimizationResult(
            route=baseline,
            fitness=round(random.uniform(0.5, 0.85), 4),
            iterations_used=1,
            convergence_history=[],
        )

    def get_convergence(self) -> list[float]:
        return self._last_convergence


# ---------------------------------------------------------------------------
# Registry — maps algorithm name → adapter class
# ---------------------------------------------------------------------------

OPTIMIZATION_ADAPTERS: dict[str, type[BaseOptimizationAdapter]] = {
    "qpso": MockQpsoAdapter,
    "pso": MockPsoAdapter,
    "ga": MockGaAdapter,
    "dijkstra": MockDijkstraAdapter,
}


def get_optimization_adapter(algorithm: str) -> BaseOptimizationAdapter:
    """Return an adapter instance for the given algorithm name."""
    adapter_cls = OPTIMIZATION_ADAPTERS.get(algorithm)
    if adapter_cls is None:
        from app.core.errors import InvalidAlgorithmError
        raise InvalidAlgorithmError(algorithm)
    return adapter_cls()
