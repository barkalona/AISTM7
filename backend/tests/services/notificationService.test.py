import unittest
import asyncio
from unittest.mock import patch, MagicMock, AsyncMock
from datetime import datetime, timedelta
import json

from services.notificationService import NotificationService

class TestNotificationService(unittest.TestCase):
    def setUp(self):
        """Set up test environment."""
        # Mock settings
        self.settings_patcher = patch('services.notificationService.settings')
        self.mock_settings = self.settings_patcher.start()
        
        # Configure mock settings
        self.mock_settings.SMTP_HOST = 'smtp.test.com'
        self.mock_settings.SMTP_PORT = 587
        self.mock_settings.SMTP_USER = 'test@test.com'
        self.mock_settings.SMTP_PASSWORD = 'test_password'
        self.mock_settings.EMAIL_FROM = 'noreply@aistm7.com'
        self.mock_settings.NOTIFICATION_COOLDOWN_MINUTES = 5
        
        # Create service instance
        self.notification_service = NotificationService()
        
        # Set up event loop for async tests
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)

    def tearDown(self):
        """Clean up test environment."""
        self.settings_patcher.stop()
        self.loop.close()

    def test_cooldown_check(self):
        """Test notification cooldown functionality."""
        user_id = 'test_user'
        notification_type = 'test_type'
        
        # First notification should pass cooldown
        self.assertTrue(
            self.notification_service._check_cooldown(user_id, notification_type)
        )
        
        # Update cooldown
        self.notification_service._update_cooldown(user_id, notification_type)
        
        # Second notification should not pass cooldown
        self.assertFalse(
            self.notification_service._check_cooldown(user_id, notification_type)
        )
        
        # Simulate cooldown period passing
        key = f"{user_id}:{notification_type}"
        self.notification_service._last_notification[key] = (
            datetime.now() - timedelta(minutes=10)
        )
        
        # Now should pass cooldown again
        self.assertTrue(
            self.notification_service._check_cooldown(user_id, notification_type)
        )

    @patch('smtplib.SMTP')
    async def test_email_notification(self, mock_smtp):
        """Test email notification sending."""
        # Configure mock SMTP instance
        mock_smtp_instance = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_smtp_instance
        
        notification = {
            'email': 'user@test.com',
            'title': 'Test Notification',
            'message': 'Test message',
            'subject': 'Test Subject',
            'data': {'key': 'value'}
        }
        
        # Send notification
        await self.notification_service._send_email_notification(notification)
        
        # Verify SMTP calls
        mock_smtp_instance.starttls.assert_called_once()
        mock_smtp_instance.login.assert_called_once_with(
            self.mock_settings.SMTP_USER,
            self.mock_settings.SMTP_PASSWORD
        )
        mock_smtp_instance.send_message.assert_called_once()
        
        # Verify email content
        sent_email = mock_smtp_instance.send_message.call_args[0][0]
        self.assertEqual(sent_email['From'], self.mock_settings.EMAIL_FROM)
        self.assertEqual(sent_email['To'], notification['email'])
        self.assertEqual(sent_email['Subject'], notification['subject'])

    async def test_notification_queue(self):
        """Test notification queue processing."""
        # Mock notification sending
        self.notification_service._send_email_notification = AsyncMock()
        self.notification_service._send_sms_notification = AsyncMock()
        
        # Start queue processing
        await self.notification_service.start()
        
        # Queue notifications
        notifications = [
            {
                'type': 'test',
                'user_id': 'user1',
                'title': 'Test 1',
                'message': 'Message 1',
                'email': 'user1@test.com'
            },
            {
                'type': 'test',
                'user_id': 'user2',
                'title': 'Test 2',
                'message': 'Message 2',
                'sms': True,
                'phone': '1234567890'
            }
        ]
        
        for notification in notifications:
            await self.notification_service.queue_notification(
                notification_type=notification['type'],
                user_id=notification['user_id'],
                title=notification['title'],
                message=notification['message'],
                email=notification.get('email'),
                phone=notification.get('phone')
            )
        
        # Wait for queue processing
        await asyncio.sleep(0.1)
        await self.notification_service.stop()
        
        # Verify notifications were processed
        self.assertEqual(
            self.notification_service._send_email_notification.call_count,
            1
        )
        self.assertEqual(
            self.notification_service._send_sms_notification.call_count,
            1
        )

    async def test_risk_alert(self):
        """Test risk alert notification."""
        self.notification_service.queue_notification = AsyncMock()
        
        risk_data = {
            'var': 0.15,
            'sharpe_ratio': 1.2,
            'volatility': 0.25
        }
        
        await self.notification_service.send_risk_alert(
            user_id='test_user',
            risk_data=risk_data,
            email='user@test.com'
        )
        
        # Verify notification was queued
        self.notification_service.queue_notification.assert_called_once()
        call_args = self.notification_service.queue_notification.call_args[1]
        
        self.assertEqual(call_args['notification_type'], 'risk_alert')
        self.assertEqual(call_args['priority'], 'high')
        self.assertEqual(call_args['data'], risk_data)

    async def test_anomaly_alert(self):
        """Test anomaly alert notification."""
        self.notification_service.queue_notification = AsyncMock()
        
        anomaly_data = {
            'symbol': 'AAPL',
            'confidence': 0.95,
            'type': 'price_spike'
        }
        
        await self.notification_service.send_anomaly_alert(
            user_id='test_user',
            anomaly_data=anomaly_data,
            email='user@test.com',
            phone='1234567890'
        )
        
        # Verify notification was queued
        self.notification_service.queue_notification.assert_called_once()
        call_args = self.notification_service.queue_notification.call_args[1]
        
        self.assertEqual(call_args['notification_type'], 'anomaly_alert')
        self.assertEqual(call_args['priority'], 'high')
        self.assertEqual(call_args['data'], anomaly_data)

    def test_notification_formatting(self):
        """Test notification data formatting."""
        test_data = {
            'metrics': {
                'accuracy': 0.95,
                'precision': 0.92,
                'recall': 0.88
            },
            'timestamp': '2025-01-22T12:00:00',
            'status': 'success'
        }
        
        formatted = self.notification_service._format_notification_data(test_data)
        
        # Verify HTML formatting
        self.assertIn('<div style=', formatted)
        self.assertIn('<h3>metrics</h3>', formatted)
        self.assertIn('<strong>status:</strong> success', formatted)
        
    async def test_model_alert(self):
        """Test model performance alert."""
        self.notification_service.queue_notification = AsyncMock()
        
        model_data = {
            'model_name': 'price_prediction',
            'metrics': {
                'accuracy': 0.92,
                'loss': 0.08
            },
            'timestamp': datetime.now().isoformat()
        }
        
        await self.notification_service.send_model_alert(
            user_id='test_user',
            model_data=model_data,
            email='user@test.com'
        )
        
        # Verify notification was queued
        self.notification_service.queue_notification.assert_called_once()
        call_args = self.notification_service.queue_notification.call_args[1]
        
        self.assertEqual(call_args['notification_type'], 'model_alert')
        self.assertEqual(call_args['priority'], 'normal')
        self.assertEqual(call_args['data'], model_data)

    async def test_portfolio_summary(self):
        """Test portfolio summary notification."""
        self.notification_service.queue_notification = AsyncMock()
        
        portfolio_data = {
            'total_value': 100000,
            'daily_return': 0.025,
            'risk_metrics': {
                'var': 0.12,
                'sharpe': 1.5
            }
        }
        
        await self.notification_service.send_portfolio_summary(
            user_id='test_user',
            portfolio_data=portfolio_data,
            email='user@test.com'
        )
        
        # Verify notification was queued
        self.notification_service.queue_notification.assert_called_once()
        call_args = self.notification_service.queue_notification.call_args[1]
        
        self.assertEqual(call_args['notification_type'], 'portfolio_summary')
        self.assertEqual(call_args['priority'], 'normal')
        self.assertEqual(call_args['data'], portfolio_data)

if __name__ == '__main__':
    unittest.main()