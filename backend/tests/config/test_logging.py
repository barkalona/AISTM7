import unittest
import logging
import json
import os
import tempfile
import shutil
from pathlib import Path
from unittest.mock import patch, MagicMock

from config.logging import (
    setup_logging,
    get_logger,
    ModelTrainingLogger,
    PerformanceLogger,
    CustomJsonFormatter
)

class TestLogging(unittest.TestCase):
    def setUp(self):
        """Set up test environment with temporary log directory."""
        self.temp_dir = tempfile.mkdtemp()
        self.log_dir = Path(self.temp_dir) / "logs"
        self.log_dir.mkdir()
        
        # Patch settings
        self.settings_patcher = patch('config.logging.settings')
        self.mock_settings = self.settings_patcher.start()
        self.mock_settings.LOG_LEVEL = 'DEBUG'
        self.mock_settings.APP_ENV = 'test'
        
        # Patch log directory
        self.path_patcher = patch('config.logging.log_dir', self.log_dir)
        self.path_patcher.start()
        
        # Set up logging
        setup_logging()

    def tearDown(self):
        """Clean up temporary directory and patches."""
        shutil.rmtree(self.temp_dir)
        self.settings_patcher.stop()
        self.path_patcher.stop()
        
        # Reset root logger
        logging.getLogger().handlers = []

    def test_json_formatter(self):
        """Test custom JSON formatter output."""
        formatter = CustomJsonFormatter()
        logger = logging.getLogger("test_formatter")
        
        # Create a mock record
        record = logging.LogRecord(
            name="test_formatter",
            level=logging.INFO,
            pathname="test.py",
            lineno=1,
            msg="Test message",
            args=(),
            exc_info=None
        )
        
        # Add custom fields
        record.correlation_id = "test-123"
        record.model_metrics = {"accuracy": 0.95}
        
        # Format record
        output = formatter.format(record)
        log_dict = json.loads(output)
        
        # Verify fields
        self.assertEqual(log_dict['level'], 'INFO')
        self.assertEqual(log_dict['message'], 'Test message')
        self.assertEqual(log_dict['correlation_id'], 'test-123')
        self.assertEqual(log_dict['model_metrics'], {"accuracy": 0.95})
        self.assertIn('timestamp', log_dict)
        self.assertEqual(log_dict['environment'], 'test')

    def test_file_handlers(self):
        """Test that log files are created and written to."""
        logger = get_logger("test_handlers")
        
        # Log messages
        logger.info("Test info message")
        logger.error("Test error message")
        
        # Check main log file
        main_log = self.log_dir / 'aistm7.log'
        self.assertTrue(main_log.exists())
        with open(main_log) as f:
            logs = [json.loads(line) for line in f]
            self.assertEqual(len(logs), 2)
            self.assertEqual(logs[0]['message'], 'Test info message')
            self.assertEqual(logs[1]['message'], 'Test error message')
        
        # Check error log file
        error_log = self.log_dir / 'error.log'
        self.assertTrue(error_log.exists())
        with open(error_log) as f:
            logs = [json.loads(line) for line in f]
            self.assertEqual(len(logs), 1)
            self.assertEqual(logs[0]['message'], 'Test error message')

    def test_model_training_logger(self):
        """Test model training logger functionality."""
        logger = ModelTrainingLogger("test_model")
        
        # Log training metrics
        logger.log_metrics(
            epoch=1,
            metrics={'loss': 0.5, 'accuracy': 0.8},
            validation_metrics={'val_loss': 0.6, 'val_accuracy': 0.75}
        )
        
        # Check model training log file
        model_log = self.log_dir / 'model_training.log'
        self.assertTrue(model_log.exists())
        with open(model_log) as f:
            log = json.loads(f.readline())
            self.assertEqual(log['model_metrics']['epoch'], 1)
            self.assertEqual(log['model_metrics']['training']['loss'], 0.5)
            self.assertEqual(log['model_metrics']['validation']['val_accuracy'], 0.75)

    def test_performance_logger(self):
        """Test performance logger functionality."""
        logger = PerformanceLogger("test_component")
        
        # Log performance metrics
        logger.log_timing("test_operation", 1.5, {"batch_size": 100})
        logger.log_resource_usage(cpu_percent=50.0, memory_mb=1024.0, gpu_utilization=80.0)
        
        # Check performance log file
        perf_log = self.log_dir / 'performance.log'
        self.assertTrue(perf_log.exists())
        with open(perf_log) as f:
            logs = [json.loads(line) for line in f]
            self.assertEqual(len(logs), 2)
            
            # Check timing log
            timing = logs[0]['performance_metrics']
            self.assertEqual(timing['operation'], 'test_operation')
            self.assertEqual(timing['duration_ms'], 1500.0)
            self.assertEqual(timing['batch_size'], 100)
            
            # Check resource usage log
            resources = logs[1]['performance_metrics']
            self.assertEqual(resources['cpu_percent'], 50.0)
            self.assertEqual(resources['memory_mb'], 1024.0)
            self.assertEqual(resources['gpu_utilization'], 80.0)

    def test_correlation_id(self):
        """Test correlation ID propagation."""
        setup_logging(correlation_id="test-correlation")
        logger = get_logger("test_correlation")
        
        # Log message
        logger.info("Test correlated message")
        
        # Check log file
        main_log = self.log_dir / 'aistm7.log'
        with open(main_log) as f:
            log = json.loads(f.readline())
            self.assertEqual(log['correlation_id'], 'test-correlation')

    def test_log_rotation(self):
        """Test log file rotation."""
        logger = get_logger("test_rotation")
        
        # Create large log messages
        large_msg = "x" * 1024 * 1024  # 1MB message
        for _ in range(15):  # Should trigger rotation
            logger.info(large_msg)
        
        # Check that backup files were created
        main_log = self.log_dir / 'aistm7.log'
        backup_logs = list(self.log_dir.glob('aistm7.log.*'))
        self.assertTrue(main_log.exists())
        self.assertGreater(len(backup_logs), 0)

    def test_batch_processing_logs(self):
        """Test batch processing logging."""
        logger = PerformanceLogger("batch_processor")
        
        # Log batch processing metrics
        logger.log_batch_processing(
            batch_size=100,
            processing_time=2.5,
            success_count=95,
            error_count=5
        )
        
        # Check performance log
        perf_log = self.log_dir / 'performance.log'
        with open(perf_log) as f:
            log = json.loads(f.readline())
            metrics = log['performance_metrics']
            self.assertEqual(metrics['batch_size'], 100)
            self.assertEqual(metrics['processing_time_ms'], 2500.0)
            self.assertEqual(metrics['success_count'], 95)
            self.assertEqual(metrics['error_count'], 5)
            self.assertEqual(metrics['success_rate'], 0.95)

    def test_model_prediction_logs(self):
        """Test model prediction logging."""
        logger = ModelTrainingLogger("prediction_model")
        
        # Log prediction metrics
        logger.log_prediction(
            input_shape=(32, 128),
            prediction_time=0.05,
            confidence=0.92
        )
        
        # Check model training log
        model_log = self.log_dir / 'model_training.log'
        with open(model_log) as f:
            log = json.loads(f.readline())
            metrics = log['model_metrics']['prediction']
            self.assertEqual(metrics['input_shape'], [32, 128])
            self.assertEqual(metrics['prediction_time_ms'], 50.0)
            self.assertEqual(metrics['confidence'], 0.92)

if __name__ == '__main__':
    unittest.main()