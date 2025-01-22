import unittest
import time
import numpy as np
import threading
from unittest.mock import patch, MagicMock
import json
from pathlib import Path

from utils.monitoring import (
    ModelProfiler,
    ResourceMonitor,
    BatchProfiler,
    profile_prediction,
    profile_batch
)

class TestModelProfiler(unittest.TestCase):
    def setUp(self):
        """Set up test environment."""
        self.model_name = "test_model"
        self.profiler = ModelProfiler(self.model_name)

    def test_log_prediction(self):
        """Test prediction logging."""
        input_data = np.random.randn(32, 128)
        prediction_time = 0.1
        confidence = 0.95
        
        # Log prediction
        self.profiler.log_prediction(
            input_data=input_data,
            prediction_time=prediction_time,
            confidence=confidence,
            metadata={"batch_id": "test-1"}
        )
        
        # Check statistics
        stats = self.profiler.get_prediction_stats()
        self.assertEqual(stats['total_predictions'], 1)
        self.assertEqual(stats['mean_prediction_time'], prediction_time)
        self.assertEqual(stats['mean_batch_size'], 32)

    def test_concurrent_logging(self):
        """Test thread-safe prediction logging."""
        def log_predictions():
            for _ in range(100):
                self.profiler.log_prediction(
                    input_data=np.random.randn(16, 64),
                    prediction_time=0.05,
                    confidence=0.9
                )
        
        # Create multiple threads
        threads = [
            threading.Thread(target=log_predictions)
            for _ in range(4)
        ]
        
        # Start and join threads
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        
        # Check total predictions
        stats = self.profiler.get_prediction_stats()
        self.assertEqual(stats['total_predictions'], 400)

    def test_reset_stats(self):
        """Test statistics reset."""
        # Log some predictions
        for _ in range(5):
            self.profiler.log_prediction(
                input_data=np.random.randn(8, 32),
                prediction_time=0.02,
                confidence=0.85
            )
        
        # Reset stats
        self.profiler.reset_stats()
        
        # Check empty stats
        stats = self.profiler.get_prediction_stats()
        self.assertEqual(stats, {})

@profile_prediction("decorated_model")
def dummy_prediction(model, input_data):
    """Dummy prediction function for testing decorator."""
    time.sleep(0.01)  # Simulate computation
    return {
        'prediction': np.random.randn(input_data.shape[0]),
        'confidence': 0.9
    }

class TestPredictionDecorator(unittest.TestCase):
    def test_decorator(self):
        """Test prediction profiling decorator."""
        model = MagicMock()
        input_data = np.random.randn(16, 64)
        
        # Make prediction
        result = dummy_prediction(model, input_data)
        
        self.assertIn('prediction', result)
        self.assertIn('confidence', result)

class TestResourceMonitor(unittest.TestCase):
    def setUp(self):
        """Set up test environment."""
        self.monitor = ResourceMonitor("test_component")

    def test_resource_monitoring(self):
        """Test resource monitoring functionality."""
        # Start monitoring
        self.monitor.start_monitoring(interval=0.1)
        
        # Wait for some measurements
        time.sleep(0.3)
        
        # Stop monitoring
        self.monitor.stop_monitoring()
        
        # Monitor should have stopped
        self.assertFalse(self.monitor.monitoring)
        self.assertIsNone(self.monitor.monitor_thread)

    @patch('psutil.cpu_percent')
    @patch('psutil.Process')
    def test_resource_logging(self, mock_process, mock_cpu):
        """Test resource usage logging."""
        # Mock resource measurements
        mock_cpu.return_value = 50.0
        mock_memory = MagicMock()
        mock_memory.rss = 1024 * 1024 * 100  # 100MB
        mock_process.return_value.memory_info.return_value = mock_memory
        
        # Start monitoring briefly
        self.monitor.start_monitoring(interval=0.1)
        time.sleep(0.15)
        self.monitor.stop_monitoring()
        
        # Should have called resource measurements
        mock_cpu.assert_called()
        mock_process.return_value.memory_info.assert_called()

class TestBatchProfiler(unittest.TestCase):
    def setUp(self):
        """Set up test environment."""
        self.profiler = BatchProfiler("test_component")

    def test_batch_processing(self):
        """Test batch processing metrics."""
        # Record some operations
        for _ in range(80):
            self.profiler.record_success()
        for _ in range(20):
            self.profiler.record_error()
        
        # Complete batch
        self.profiler.complete_batch(batch_size=100)
        
        # Check counts
        self.assertEqual(self.profiler.success_count, 80)
        self.assertEqual(self.profiler.error_count, 20)

    def test_concurrent_recording(self):
        """Test thread-safe operation recording."""
        def record_operations():
            for _ in range(100):
                if np.random.random() > 0.2:
                    self.profiler.record_success()
                else:
                    self.profiler.record_error()
        
        # Create multiple threads
        threads = [
            threading.Thread(target=record_operations)
            for _ in range(4)
        ]
        
        # Start and join threads
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        
        # Complete batch
        self.profiler.complete_batch(batch_size=400)
        
        # Check total operations
        self.assertEqual(
            self.profiler.success_count + self.profiler.error_count,
            400
        )

@profile_batch("test_batch")
def dummy_batch_processing(batch):
    """Dummy batch processing function for testing decorator."""
    results = []
    for item in batch:
        try:
            if np.random.random() > 0.2:
                results.append(item * 2)
            else:
                raise ValueError(f"Error processing {item}")
        except ValueError:
            continue
    return results

class TestBatchDecorator(unittest.TestCase):
    def test_decorator(self):
        """Test batch processing decorator."""
        batch = list(range(100))
        
        # Process batch
        results = dummy_batch_processing(batch)
        
        # Should have some successful results
        self.assertGreater(len(results), 0)
        self.assertLess(len(results), 100)  # Some should have failed

if __name__ == '__main__':
    unittest.main()