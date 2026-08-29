"""Pydantic models for alert and notification endpoints."""

from enum import Enum

from pydantic import BaseModel, Field

from app.models.route_models import Coordinate


class AlertType(str, Enum):
    congestion = "congestion"
    incident = "incident"
    weather = "weather"
    route_deviation = "route_deviation"
    general = "general"


class AlertSeverity(str, Enum):
    info = "info"
    warning = "warning"
    critical = "critical"


class AlertSubscription(BaseModel):
    user_id: str
    endpoint: str = Field(..., min_length=1, description="Webhook or FCM token")
    fcm_token: str | None = None
    enabled: bool = True


class Alert(BaseModel):
    alert_id: str
    alert_type: AlertType = AlertType.general
    message: str
    severity: AlertSeverity = AlertSeverity.info
    user_id: str | None = None
    location: Coordinate | None = None
    created_at: str | None = None
    expires_at: str | None = None
