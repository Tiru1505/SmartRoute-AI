"""Prediction service — wraps the prediction adapter with caching and error handling."""

from app.core.errors import PredictionError
from app.core.logging import get_logger
from app.integrations.prediction_adapter import BasePredictionAdapter, MockPredictionAdapter
from app.models.route_models import Coordinate
from app.models.traffic_models import TrafficPrediction

_logger = get_logger("services.prediction")


class PredictionService:
    """Service for traffic prediction operations."""

    def __init__(self, adapter: BasePredictionAdapter | None = None):
        self.adapter = adapter or MockPredictionAdapter()

    def predict(self, location: Coordinate, horizon_minutes: int = 30) -> TrafficPrediction:
        """Generate a traffic prediction for the given location and time horizon."""
        try:
            result = self.adapter.predict(location, horizon_minutes)
            prediction = TrafficPrediction(
                location=location,
                horizon_minutes=horizon_minutes,
                predicted_congestion=result["predicted_congestion"],
                confidence=result.get("confidence"),
                metadata={"data_source": result.get("data_source", "mock")},
            )
            _logger.info(
                "Prediction for (%.4f, %.4f) +%d min: congestion=%.2f",
                location.lat, location.lon, horizon_minutes,
                prediction.predicted_congestion,
            )
            return prediction
        except PredictionError:
            raise
        except Exception as exc:
            _logger.error("Prediction failed: %s", exc)
            raise PredictionError(str(exc)) from exc
