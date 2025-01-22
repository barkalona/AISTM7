import unittest
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from services.aiService import AIService

class TestAIService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Set up test data and AI service instance."""
        # Create sample historical data
        dates = pd.date_range(start='2024-01-01', end='2024-12-31', freq='D')
        symbols = ['AAPL', 'GOOGL', 'MSFT']
        
        data = []
        for symbol in symbols:
            # Generate synthetic price data
            prices = np.random.normal(100, 10, len(dates))
            prices = np.exp(np.cumsum(np.random.normal(0, 0.02, len(dates))))  # Random walk
            prices *= 100  # Scale prices
            
            # Generate synthetic volume data
            volumes = np.random.normal(1000000, 200000, len(dates))
            volumes = np.abs(volumes)  # Ensure positive volumes
            
            for i, date in enumerate(dates):
                data.append({
                    'date': date,
                    'symbol': symbol,
                    'price': prices[i],
                    'volume': volumes[i],
                    'high': prices[i] * (1 + np.random.uniform(0, 0.02)),
                    'low': prices[i] * (1 - np.random.uniform(0, 0.02)),
                    'close': prices[i]
                })
        
        cls.test_data = pd.DataFrame(data)
        cls.ai_service = AIService(model_path='test_models')

    def test_prepare_sequence_data(self):
        """Test sequence data preparation for LSTM."""
        X, y = self.ai_service.prepare_sequence_data(
            self.test_data[self.test_data['symbol'] == 'AAPL'],
            sequence_length=30
        )
        
        self.assertEqual(X.shape[1], 30)  # Check sequence length
        self.assertEqual(X.shape[2], 1)   # Check number of features
        self.assertEqual(y.shape[1], 1)   # Check target dimension

    def test_build_lstm_model(self):
        """Test LSTM model architecture."""
        model = self.ai_service.build_lstm_model(
            sequence_length=30,
            n_features=1
        )
        
        # Check model structure
        self.assertEqual(len(model.layers), 5)  # Input LSTM, Dropout, LSTM, Dropout, Dense
        self.assertEqual(model.input_shape, (None, 30, 1))
        self.assertEqual(model.output_shape, (None, 1))

    def test_train_prediction_model(self):
        """Test model training process."""
        symbol_data = self.test_data[self.test_data['symbol'] == 'AAPL']
        
        metrics = self.ai_service.train_prediction_model(
            symbol_data,
            'AAPL',
            sequence_length=30,
            epochs=2  # Small number for testing
        )
        
        self.assertIn('training_loss', metrics)
        self.assertIn('validation_loss', metrics)
        self.assertTrue(metrics['training_loss'] > 0)

    def test_detect_anomalies(self):
        """Test anomaly detection."""
        symbol_data = self.test_data[self.test_data['symbol'] == 'AAPL']
        
        anomalies = self.ai_service.detect_anomalies(
            symbol_data,
            contamination=0.1
        )
        
        # Check anomaly detection results
        self.assertEqual(len(anomalies), len(symbol_data))
        self.assertTrue(np.sum(anomalies) > 0)  # Should detect some anomalies
        self.assertTrue(np.sum(anomalies) < len(anomalies) * 0.2)  # Not too many anomalies

    def test_analyze_market_sentiment(self):
        """Test market sentiment analysis."""
        symbol_data = self.test_data[self.test_data['symbol'] == 'AAPL']
        
        sentiment = self.ai_service.analyze_market_sentiment(
            symbol_data,
            window_size=14
        )
        
        # Check sentiment metrics
        self.assertIn('sentiment_score', sentiment)
        self.assertIn('rsi', sentiment)
        self.assertIn('macd', sentiment)
        self.assertTrue(-1 <= sentiment['sentiment_score'] <= 1)
        self.assertTrue(0 <= sentiment['rsi'] <= 100)

    def test_calculate_rsi(self):
        """Test RSI calculation."""
        prices = pd.Series(self.test_data[self.test_data['symbol'] == 'AAPL']['close'])
        rsi = self.ai_service._calculate_rsi(prices)
        
        self.assertTrue(all(0 <= x <= 100 for x in rsi.dropna()))
        self.assertEqual(len(rsi), len(prices))

    def test_calculate_macd(self):
        """Test MACD calculation."""
        prices = pd.Series(self.test_data[self.test_data['symbol'] == 'AAPL']['close'])
        macd = self.ai_service._calculate_macd(prices)
        
        self.assertIn('macd', macd.columns)
        self.assertIn('signal', macd.columns)
        self.assertIn('histogram', macd.columns)
        self.assertEqual(len(macd), len(prices))

    def test_predict_price_movement(self):
        """Test price movement prediction."""
        symbol_data = self.test_data[self.test_data['symbol'] == 'AAPL']
        
        # First train a model
        self.ai_service.train_prediction_model(
            symbol_data,
            'AAPL',
            sequence_length=30,
            epochs=2
        )
        
        # Then test prediction
        prediction = self.ai_service.predict_price_movement(
            'AAPL',
            symbol_data.tail(31)  # Need sequence_length + 1 data points
        )
        
        self.assertIn('current_price', prediction)
        self.assertIn('predicted_price', prediction)
        self.assertIn('predicted_change_percent', prediction)
        self.assertIn('prediction_confidence', prediction)
        self.assertTrue(0 <= prediction['prediction_confidence'] <= 1)

    def test_calculate_prediction_confidence(self):
        """Test prediction confidence calculation."""
        symbol_data = self.test_data[self.test_data['symbol'] == 'AAPL']
        X, _ = self.ai_service.prepare_sequence_data(symbol_data)
        
        # Train model first
        model = self.ai_service.build_lstm_model(X.shape[1], X.shape[2])
        confidence = self.ai_service._calculate_prediction_confidence(
            model,
            X[0:1],  # Single sample
            n_iterations=10
        )
        
        self.assertTrue(0 <= confidence <= 1)

    @classmethod
    def tearDownClass(cls):
        """Clean up after tests."""
        import shutil
        import os
        
        # Remove test model directory
        if os.path.exists('test_models'):
            shutil.rmtree('test_models')

if __name__ == '__main__':
    unittest.main()