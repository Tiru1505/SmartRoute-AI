"""Tests for alert endpoints."""


def test_get_alerts_empty(client):
    response = client.get("/api/alerts/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_subscribe_to_alerts(client, sample_subscription):
    response = client.post("/api/alerts/subscribe", json=sample_subscription)
    assert response.status_code == 200
    data = response.json()
    assert "subscription_id" in data
    assert data["status"] == "subscribed"


def test_subscribe_missing_user_id(client):
    response = client.post("/api/alerts/subscribe", json={
        "endpoint": "https://example.com/webhook",
    })
    assert response.status_code == 422


def test_subscribe_missing_endpoint(client):
    response = client.post("/api/alerts/subscribe", json={
        "user_id": "test-user-001",
    })
    assert response.status_code == 422
