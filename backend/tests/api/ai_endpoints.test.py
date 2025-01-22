import unittest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
import json
import pandas as pd
import numpy as np
from unittest.mock import patch, MagicMock

from api.ai_endpoints import router
from services.aiService import AIService
from services.ibkrService import IBKRService

class TestAIEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Set up test client and mock data."""
        from fastapi import FastAPI
        app = FastAPI()
        app.include_router(router)
        cls.client = TestClient(app)
        
        # Create mock user
        cls.mock_user = MagicMock()
        cls.mock_user.id = "test_user_id"
        
        # Create mock historical data
        dates = pd.date_range(start='2024-01-01', end='2024-12-31', freq='D')
        cls.mock_data = pd.DataFrame({
            'date': dates,
            'symbol': 'AAPL',
            'price': np.random.normal(100, 10, len(dates)),
            'volume': np.random.normal(1000000, 200000, len(dates))
        })

    def setUp(self):
        """Set up test dependencies."""
        self.ai_service_patcher = patch('api.ai_endpoints.AIService')
        self.ibkr_service_patcher = patch('api.ai_endpoints.IBKRService')
        
        self.mock_ai_service = self.ai_service_patcher.start()
        self.mock_ibkr_service = self.ibkr_service_patcher.start()
        
        # Configure mock IBKR service
        self.mock_ibkr_instance = MagicMock()
        self.mock_ibkr_service.return_value = self.mock_ibkr_instance
        self.mock_ibkr_instance.get_historical_prices.return_value = self.mock_data.to_dict('records')

    def tearDown(self):
        """Clean up patches."""
        self.ai_service_patcher.stop()
        self.ibkr_service_patcher.stop()

    def test_predict_price_movement(self):
        """Test price prediction endpoint."""
        # Mock prediction result
        mock_prediction = {
            'current_price': 150.0,
            'predicted_price': 155.0,
            'predicted_change_percent': 3.33,
            'prediction_confidence': 0.85
        }
        self.mock_ai_service.return_value.predict_price_movement.return_value = mock_prediction
        
        response = self.client.post(
            "/predict/AAPL",
            params={'days': 60},
            headers={'Authorization': 'Bearer test_token'}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['data'], mock_prediction)

    def test_train_prediction_model(self):
        """Test model training endpoint."""
        # Mock training metrics
        mock_metrics = {
            'training_loss': 0.001,
            'validation_loss': 0.002
        }
        self.mock_ai_service.return_value.train_prediction_model.return_value = mock_metrics
        
        response = self.client.post(
            "/train/AAPL",
            params={'days': 252},
            headers={'Authorization': 'Bearer test_token'}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['data'], mock_metrics)

    def test_get_market_sentiment(self):
        """Test market sentiment endpoint."""
        # Mock sentiment analysis
        mock_sentiment = {
            'sentiment_score': 0.75,
            'rsi': 65.5,
            'macd': 2.5,
            'volume_trend': 1
        }
        self.mock_ai_service.return_value.analyze_market_sentiment.return_value = mock_sentiment
        
        response = self.client.get(
            "/sentiment/AAPL",
            params={'days': 14},
            headers={'Authorization': 'Bearer test_token'}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['data'], mock_sentiment)

    def test_detect_anomalies(self):
        """Test anomaly detection endpoint."""
        # Mock anomaly detection
        mock_anomalies = {
            'AAPL': {
                'anomaly_dates': ['2024-01-15', '2024-02-01'],
                'anomaly_count': 2,
                'latest_anomaly': '2024-02-01'
            }
        }
        self.mock_ai_service.return_value.detect_anomalies.return_value = np.array([True, False])
        
        response = self.client.post(
            "/anomalies/detect",
            json={'symbols': ['AAPL'], 'days': 30},
            headers={'Authorization': 'Bearer test_token'}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('AAPL', data['data'])

    def test_analyze_portfolio(self):
        """Test portfolio analysis endpoint."""
        # Mock portfolio positions
        mock_positions = [
            {'symbol': 'AAPL', 'quantity': 100},
            {'symbol': 'GOOGL', 'quantity': 50}
        ]
        self.mock_ibkr_instance.get_portfolio_positions.return_value = mock_positions
        
        # Mock analysis results
        mock_analysis = {
            'predictions': {
                'AAPL': {'predicted_change_percent': 2.5},
                'GOOGL': {'predicted_change_percent': 1.8}
            },
            'sentiment': {
                'AAPL': {'sentiment_score': 0.8},
                'GOOGL': {'sentiment_score': 0.6}
            },
            'anomalies': {
                'AAPL': {'has_recent_anomaly': False},
                'GOOGL': {'has_recent_anomaly': True}
            }
        }
        self.mock_ai_service.return_value.predict_price_movement.side_effect = [
            mock_analysis['predictions']['AAPL'],
            mock_analysis['predictions']['GOOGL']
        ]
        self.mock_ai_service.return_value.analyze_market_sentiment.side_effect = [
            mock_analysis['sentiment']['AAPL'],
            mock_analysis['sentiment']['GOOGL']
        ]
        
        response = self.client.get(
            "/portfolio/analysis",
            params={'days': 30},
            headers={'Authorization': 'Bearer test_token'}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('predictions', data['data'])
        self.assertIn('sentiment', data['data'])
        self.assertIn('anomalies', data['data'])

    def test_get_model_status(self):
        """Test model status endpoint."""
        # Mock portfolio positions
        mock_positions = [
            {'symbol': 'AAPL', 'quantity': 100},
            {'symbol': 'GOOGL', 'quantity': 50}
        ]
        self.mock_ibkr_instance.get_portfolio_positions.return_value = mock_positions
        
        # Mock model status
        mock_status = {
            'AAPL': {'has_model': True, 'last_trained': '2024-01-22T10:00:00'},
            'GOOGL': {'has_model': False, 'last_trained': None}
        }
        
        response = self.client.get(
            "/models/status",
            headers={'Authorization': 'Bearer test_token'}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('AAPL', data['data'])
        self.assertIn('GOOGL', data['data'])

    def test_error_handling(self):
        """Test error handling in endpoints."""
        # Mock error in IBKR service
        self.mock_ibkr_instance.get_historical_prices.side_effect = Exception("API Error")
        
        response = self.client.post(
            "/predict/AAPL",
            params={'days': 60},
            headers={'Authorization': 'Bearer test_token'}
        )
        
        self.assertEqual(response.status_code, 500)
        data = response.json()
        self.assertIn('detail', data)

if __name__ == '__main__':
    unittest.main()