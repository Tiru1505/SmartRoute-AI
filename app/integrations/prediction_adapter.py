"""Prediction adapter — interface boundary for LSTM/GRU traffic prediction.

╔══════════════════════════════════════════════════════════════════════╗
║  TEAM INTEGRATION POINT — Person 3 (Traffic & Prediction Engineer) ║
║                                                                     ║
║  Replace ``MockPredictionAdapter`` with your real implementation.   ║
║  Your class MUST inherit from ``BasePredictionAdapter``.            ║
║                                                                     ║
║  Expected responsibilities:                                         ║
║    - Accept a coordinate and prediction horizon (minutes)           ║
║    - Return predicted congestion (0–1) and confidence score         ║
║    - Use LSTM/GRU or another model for time-series prediction       ║
╚══════════════════════════════════════════════════════════════════════╝
"""

import random
from abc import ABC, abstractmethod

from app.core.logging import get_logger
from app.models.route_models import Coordinate

_logger = get_logger("integrations.prediction")


class BasePredictionAdapter(ABC):
    """Abstract interface that the prediction module must follow."""

    @abstractmethod
    def predict(self, location: Coordinate, horizon_minutes: int) -> dict:
        """Return a dict with 'predicted_congestion' and optional 'confidence'."""
        ...


class MockPredictionAdapter(BasePredictionAdapter):
    """Development-only placeholder — returns random predictions.

    This is NOT a real traffic prediction model.
    """

    def predict(self, location: Coordinate, horizon_minutes: int) -> dict:
        congestion = round(random.uniform(0.1, 0.9), 2)
        confidence = round(random.uniform(0.4, 0.85), 2)
        _logger.debug(
            "MockPredictionAdapter: predicted %.2f congestion (confidence %.2f) "
            "for (%.4f, %.4f) at +%d min",
            congestion, confidence, location.lat, location.lon, horizon_minutes,
        )
        return {
            "predicted_congestion": congestion,
            "confidence": confidence,
            "data_source": "mock",
        }


# Default adapter instance
PredictionAdapter = MockPredictionAdapter
