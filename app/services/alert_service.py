"""Alert service — manages alert subscriptions and alert creation."""

from uuid import uuid4

from app.core.logging import get_logger
from app.models.alert_models import Alert, AlertSubscription, AlertType, AlertSeverity
from app.utils.time_helpers import utc_now_iso

_logger = get_logger("services.alert")


class AlertService:
    """Service for managing alerts and subscriptions."""

    def subscribe(self, subscription: AlertSubscription) -> dict:
        """Register or update an alert subscription."""
        sub_id = str(uuid4())
        try:
            from app.database.collections import get_alert_subscriptions_col
            doc = subscription.model_dump()
            doc["subscription_id"] = sub_id
            doc["created_at"] = utc_now_iso()
            get_alert_subscriptions_col().update_one(
                {"user_id": subscription.user_id},
                {"$set": doc},
                upsert=True,
            )
        except Exception as exc:
            _logger.warning("Failed to persist subscription: %s", exc)

        _logger.info("Subscription %s created for user %s", sub_id, subscription.user_id)
        return {"subscription_id": sub_id, "status": "subscribed"}

    def get_alerts(self, user_id: str | None = None, limit: int = 50) -> list[Alert]:
        """Retrieve alerts, optionally filtered by user_id."""
        try:
            from app.database.collections import get_alerts_col
            query: dict = {}
            if user_id:
                query["user_id"] = user_id
            cursor = get_alerts_col().find(query).sort("created_at", -1).limit(limit)
            alerts = []
            for doc in cursor:
                doc.pop("_id", None)
                alerts.append(Alert(**doc))
            return alerts
        except Exception as exc:
            _logger.warning("Failed to retrieve alerts: %s", exc)
            return []

    def create_alert(
        self,
        message: str,
        alert_type: AlertType = AlertType.general,
        severity: AlertSeverity = AlertSeverity.info,
        user_id: str | None = None,
        location: dict | None = None,
    ) -> Alert:
        """Create and persist a new alert."""
        alert = Alert(
            alert_id=str(uuid4()),
            alert_type=alert_type,
            message=message,
            severity=severity,
            user_id=user_id,
            location=location,
            created_at=utc_now_iso(),
        )
        try:
            from app.database.collections import get_alerts_col
            get_alerts_col().insert_one(alert.model_dump())
        except Exception as exc:
            _logger.warning("Failed to persist alert: %s", exc)

        _logger.info("Alert %s created: %s", alert.alert_id, message)
        return alert
