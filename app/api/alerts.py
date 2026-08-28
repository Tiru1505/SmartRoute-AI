"""Alert and notification API endpoints."""

from fastapi import APIRouter, Query

from app.models.alert_models import Alert, AlertSubscription
from app.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["alerts"])
_service = AlertService()


@router.get(
    "/",
    response_model=list[Alert],
    summary="Get alerts",
    description="Retrieve active alerts. Optionally filter by user_id.",
)
def alerts(
    user_id: str | None = Query(default=None, description="Filter by user ID"),
    limit: int = Query(default=50, ge=1, le=200, description="Max alerts to return"),
) -> list[Alert]:
    return _service.get_alerts(user_id=user_id, limit=limit)


@router.post(
    "/subscribe",
    summary="Subscribe to alerts",
    description="Register a webhook or FCM token to receive push alerts.",
    responses={
        200: {
            "description": "Subscription created",
            "content": {
                "application/json": {
                    "example": {"subscription_id": "uuid-here", "status": "subscribed"}
                }
            },
        }
    },
)
def subscribe(subscription: AlertSubscription) -> dict:
    return _service.subscribe(subscription)
