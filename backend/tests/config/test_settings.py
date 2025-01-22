import unittest
import os
from pathlib import Path
from unittest.mock import patch
import tempfile
import shutil

from config.settings import Settings

class TestSettings(unittest.TestCase):
    def setUp(self):
        """Set up test environment variables."""
        self.env_vars = {
            "APP_NAME": "AISTM7_TEST",
            "SECRET_KEY": "test_secret_key",
            "DATABASE_URL": "postgresql://user:pass@localhost:5432/test_db",
            "REDIS_URL": "redis://localhost:6379/1"
        }
        self.patcher = patch.dict(os.environ, self.env_vars)
        self.patcher.start()
        
        # Create temporary directories for testing
        self.temp_dir = tempfile.mkdtemp()
        self.model_path = Path(self.temp_dir) / "models"
        self.data_path = Path(self.temp_dir) / "data"

    def tearDown(self):
        """Clean up test environment."""
        self.patcher.stop()
        shutil.rmtree(self.temp_dir)

    def test_basic_settings(self):
        """Test basic settings initialization."""
        settings = Settings()
        self.assertEqual(settings.APP_NAME, "AISTM7_TEST")
        self.assertEqual(settings.SECRET_KEY, "test_secret_key")
        self.assertTrue(settings.DEBUG)  # Default for development

    def test_database_url_validation(self):
        """Test database URL validation."""
        # Valid PostgreSQL URL
        settings = Settings()
        self.assertEqual(
            settings.DATABASE_URL,
            "postgresql://user:pass@localhost:5432/test_db"
        )

        # Invalid database URL
        with patch.dict(os.environ, {"DATABASE_URL": "mysql://localhost/db"}):
            with self.assertRaises(ValueError):
                Settings()

    def test_environment_specific_settings(self):
        """Test environment-specific settings."""
        # Test production settings
        with patch.dict(os.environ, {"APP_ENV": "production"}):
            settings = Settings()
            self.assertFalse(settings.DEBUG)
            self.assertEqual(settings.LOG_LEVEL, "info")
            self.assertGreaterEqual(settings.WORKERS, 4)

        # Test staging settings
        with patch.dict(os.environ, {"APP_ENV": "staging"}):
            settings = Settings()
            self.assertTrue(settings.DEBUG)
            self.assertEqual(settings.LOG_LEVEL, "debug")
            self.assertEqual(settings.WORKERS, 2)

    def test_ai_ml_settings_validation(self):
        """Test AI/ML settings validation."""
        settings = Settings()
        
        # Test confidence threshold validation
        self.assertGreaterEqual(settings.CONFIDENCE_THRESHOLD, 0.0)
        self.assertLessEqual(settings.CONFIDENCE_THRESHOLD, 1.0)
        
        # Test sequence length
        self.assertGreater(settings.SEQUENCE_LENGTH, 0)
        
        # Test batch size
        self.assertGreater(settings.BATCH_SIZE, 0)

    def test_risk_analysis_settings(self):
        """Test risk analysis settings validation."""
        settings = Settings()
        
        # Test VaR confidence level
        self.assertGreaterEqual(settings.VAR_CONFIDENCE_LEVEL, 0.0)
        self.assertLessEqual(settings.VAR_CONFIDENCE_LEVEL, 1.0)
        
        # Test Monte Carlo simulations
        self.assertGreaterEqual(settings.MONTE_CARLO_SIMULATIONS, 1000)

    def test_stress_test_scenarios_validation(self):
        """Test stress test scenarios validation."""
        # Valid scenarios
        valid_settings = Settings()
        self.assertIn("market_crash", valid_settings.STRESS_TEST_SCENARIOS)
        
        # Invalid scenarios
        with patch.dict(os.environ, {
            "STRESS_TEST_SCENARIOS": "invalid_scenario,market_crash"
        }):
            with self.assertRaises(ValueError):
                Settings()

    def test_anomaly_features_validation(self):
        """Test anomaly detection features validation."""
        # Valid features
        valid_settings = Settings()
        self.assertIn("returns", valid_settings.ANOMALY_FEATURES)
        
        # Invalid features
        with patch.dict(os.environ, {
            "ANOMALY_FEATURES": "returns,invalid_feature"
        }):
            with self.assertRaises(ValueError):
                Settings()

    def test_directory_creation(self):
        """Test automatic directory creation."""
        with patch.dict(os.environ, {
            "MODEL_PATH": str(self.model_path),
            "DATA_PATH": str(self.data_path)
        }):
            settings = Settings()
            self.assertTrue(self.model_path.exists())
            self.assertTrue(self.data_path.exists())

    def test_market_data_validation(self):
        """Test market data settings validation."""
        # Valid market data source
        settings = Settings()
        self.assertIn(settings.MARKET_DATA_SOURCE, ["ibkr", "alpha_vantage", "yahoo"])
        
        # Invalid market data source
        with patch.dict(os.environ, {"MARKET_DATA_SOURCE": "invalid_source"}):
            with self.assertRaises(ValueError):
                Settings()

        # Valid market data interval
        self.assertIn(settings.MARKET_DATA_INTERVAL, ["1m", "5m", "1h", "1d"])
        
        # Invalid market data interval
        with patch.dict(os.environ, {"MARKET_DATA_INTERVAL": "invalid_interval"}):
            with self.assertRaises(ValueError):
                Settings()

    def test_performance_settings(self):
        """Test performance-related settings."""
        settings = Settings()
        
        # Test batch processing size
        self.assertGreater(settings.BATCH_PROCESSING_SIZE, 0)
        
        # Test worker timeout
        self.assertGreater(settings.WORKER_TIMEOUT, 0)
        
        # Test max concurrent training
        self.assertGreater(settings.MAX_CONCURRENT_TRAINING, 0)

    def test_model_versioning_settings(self):
        """Test model versioning settings."""
        settings = Settings()
        
        # Test minimum model accuracy
        self.assertGreaterEqual(settings.MIN_MODEL_ACCURACY, 0.0)
        self.assertLessEqual(settings.MIN_MODEL_ACCURACY, 1.0)
        
        # Test model version control flags
        self.assertIsInstance(settings.MODEL_VERSION_CONTROL, bool)
        self.assertIsInstance(settings.MODEL_REVIEW_REQUIRED, bool)
        self.assertIsInstance(settings.MODEL_BACKUP_ENABLED, bool)

if __name__ == '__main__':
    unittest.main()