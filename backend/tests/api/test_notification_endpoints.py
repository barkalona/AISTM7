import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime

from api.notification_endpoints import router, NotificationService
from utils.auth import get_current_user

# Mock user for testing
mock_user = MagicMock(
    id="test_user_id",
    email="test@example.com"
)

# Mock auth dependency
@pytest.fixture
def client():
    """Create test client with mocked auth."""
    app = TestClient(router)
    app.dependency_overrides[get_current_user] = lambda: mock_user
    return app

@pytest.fixture
def mock_notification_service():
    """Mock notification service."""
    with patch('api.notification_endpoints.notification_service') as mock:
        mock.queue_notification = AsyncMock()
        mock.send_risk_alert = AsyncMock()
        mock.send_anomaly_alert = AsyncMock()
        mock.send_model_alert = AsyncMock()
        mock.send_portfolio_summary = AsyncMock()
        yield mock

class TestNotificationEndpoints:
    """Test notification API endpoints."""

    def test_set_preferences(self, client):
        """Test setting notification preferences."""
        preferences = {
            "email_enabled": True,
            "sms_enabled": False,
            "email": "test@example.com",
            "phone": None,
            "risk_alerts": True,
            "anomaly_alerts": True,
            "model_alerts": True,
            "portfolio_summaries": True
        }
        
        response = client.post("/preferences", json=preferences)
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "success"
        assert data["data"] == preferences

    def test_get_preferences(self, client):
        """Test getting notification preferences."""
        response = client.get("/preferences")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "success"
        assert "email_enabled" in data["data"]
        assert data["data"]["email"] == mock_user.email

    async def test_send_notification(
        self,
        client,
        mock_notification_service
    ):
        """Test sending a notification."""
        notification = {
            "type": "test",
            "title": "Test Notification",
            "message": "Test message",
            "data": {"key": "value"},
            "priority": "high",
            "email": "test@example.com"
        }
        
        response = client.post("/send", json=notification)
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "success"
        
        # Verify notification was queued
        mock_notification_service.queue_notification.assert_called_once()
        call_args = mock_notification_service.queue_notification.call_args[1]
        assert call_args["notification_type"] == notification["type"]
        assert call_args["title"] == notification["title"]
        assert call_args["user_id"] == mock_user.id

    async def test_send_risk_alert(
        self,
        client,
        mock_notification_service
    ):
        """Test sending a risk alert."""
        risk_data = {
            "var": 0.15,
            "sharpe_ratio": 1.2,
            "volatility": 0.25
        }
        
        response = client.post("/risk-alert", json=risk_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "success"
        
        # Verify alert was queued
        mock_notification_service.send_risk_alert.assert_called_once()
        call_args = mock_notification_service.send_risk_alert.call_args[1]
        assert call_args["user_id"] == mock_user.id
        assert call_args["risk_data"] == risk_data

    async def test_send_anomaly_alert(
        self,
        client,
        mock_notification_service
    ):
        """Test sending an anomaly alert."""
        anomaly_data = {
            "symbol": "AAPL",
            "confidence": 0.95,
            "type": "price_spike"
        }
        
        response = client.post("/anomaly-alert", json=anomaly_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "success"
        
        # Verify alert was queued
        mock_notification_service.send_anomaly_alert.assert_called_once()
        call_args = mock_notification_service.send_anomaly_alert.call_args[1]
        assert call_args["user_id"] == mock_user.id
        assert call_args["anomaly_data"] == anomaly_data

    async def test_send_model_alert(
        self,
        client,
        mock_notification_service
    ):
        """Test sending a model alert."""
        model_data = {
            "model_name": "price_prediction",
            "metrics": {
                "accuracy": 0.92,
                "loss": 0.08
            }
        }
        
        response = client.post("/model-alert", json=model_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "success"
        
        # Verify alert was queued
        mock_notification_service.send_model_alert.assert_called_once()
        call_args = mock_notification_service.send_model_alert.call_args[1]
        assert call_args["user_id"] == mock_user.id
        assert call_args["model_data"] == model_data

    async def test_send_portfolio_summary(
        self,
        client,
        mock_notification_service
    ):
        """Test sending a portfolio summary."""
        portfolio_data = {
            "total_value": 100000,
            "daily_return": 0.025,
            "risk_metrics": {
                "var": 0.12,
                "sharpe": 1.5
            }
        }
        
        response = client.post("/portfolio-summary", json=portfolio_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "success"
        
        # Verify summary was queued
        mock_notification_service.send_portfolio_summary.assert_called_once()
        call_args = mock_notification_service.send_portfolio_summary.call_args[1]
        assert call_args["user_id"] == mock_user.id
        assert call_args["portfolio_data"] == portfolio_data

    def test_invalid_notification(self, client):
        """Test sending an invalid notification."""
        # Missing required fields
        notification = {
            "type": "test"
        }
        
        response = client.post("/send", json=notification)
        assert response.status_code == 422  # Validation error

    def test_invalid_email(self, client):
        """Test notification with invalid email."""
        notification = {
            "type": "test",
            "title": "Test",
            "message": "Test",
            "email": "invalid-email"  # Invalid email format
        }
        
        response = client.post("/send", json=notification)
        assert response.status_code == 422  # Validation error

    @pytest.mark.parametrize("endpoint", [
        "/risk-alert",
        "/anomaly-alert",
        "/model-alert",
        "/portfolio-summary"
    ])
    def test_missing_data(self, client, endpoint):
        """Test endpoints with missing data."""
        response = client.post(endpoint, json={})
        assert response.status_code == 422  # Validation error

    def test_preferences_validation(self, client):
        """Test notification preferences validation."""
        # Invalid email
        preferences = {
            "email_enabled": True,
            "email": "invalid-email",
            "sms_enabled": False
        }
        
        response = client.post("/preferences", json=preferences)
        assert response.status_code == 422  # Validation error
        
        # Invalid phone number format (if we add validation)
        preferences = {
            "email_enabled": False,
            "sms_enabled": True,
            "phone": "invalid-phone"
        }
        
        response = client.post("/preferences", json=preferences)
        assert response.status_code == 422  # Validation error