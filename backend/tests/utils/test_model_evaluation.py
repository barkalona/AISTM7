import unittest
import numpy as np
import tensorflow as tf
from unittest.mock import patch, MagicMock
from sklearn.datasets import make_classification, make_regression

from utils.model_evaluation import ModelEvaluator

class TestModelEvaluation(unittest.TestCase):
    def setUp(self):
        """Set up test environment."""
        # Create classification data
        X_cls, y_cls = make_classification(
            n_samples=1000,
            n_features=20,
            n_classes=2,
            random_state=42
        )
        self.cls_data = (X_cls, y_cls)
        
        # Create regression data
        X_reg, y_reg = make_regression(
            n_samples=1000,
            n_features=20,
            random_state=42
        )
        self.reg_data = (X_reg, y_reg)
        
        # Create simple models
        self.cls_model = tf.keras.Sequential([
            tf.keras.layers.Dense(10, activation='relu', input_shape=(20,)),
            tf.keras.layers.Dense(1, activation='sigmoid')
        ])
        self.cls_model.compile(optimizer='adam', loss='binary_crossentropy')
        
        self.reg_model = tf.keras.Sequential([
            tf.keras.layers.Dense(10, activation='relu', input_shape=(20,)),
            tf.keras.layers.Dense(1)
        ])
        self.reg_model.compile(optimizer='adam', loss='mse')

    def test_classification_metrics(self):
        """Test classification metric calculation."""
        evaluator = ModelEvaluator(
            "test_classifier",
            task_type='classification'
        )
        
        # Train model briefly
        X, y = self.cls_data
        self.cls_model.fit(X, y, epochs=1, verbose=0)
        
        # Get predictions
        y_pred = (self.cls_model.predict(X) > 0.5).astype(int)
        y_prob = self.cls_model.predict(X)
        
        # Calculate metrics
        metrics = evaluator.evaluate_classification(y, y_pred, y_prob)
        
        # Check metric values
        self.assertIn('accuracy', metrics)
        self.assertIn('precision', metrics)
        self.assertIn('recall', metrics)
        self.assertIn('f1', metrics)
        self.assertIn('auc', metrics)
        
        # Check metric ranges
        for metric, value in metrics.items():
            self.assertGreaterEqual(value, 0.0)
            self.assertLessEqual(value, 1.0)

    def test_regression_metrics(self):
        """Test regression metric calculation."""
        evaluator = ModelEvaluator(
            "test_regressor",
            task_type='regression'
        )
        
        # Train model briefly
        X, y = self.reg_data
        self.reg_model.fit(X, y, epochs=1, verbose=0)
        
        # Get predictions
        y_pred = self.reg_model.predict(X)
        
        # Calculate metrics
        metrics = evaluator.evaluate_regression(y, y_pred)
        
        # Check metric values
        self.assertIn('mse', metrics)
        self.assertIn('rmse', metrics)
        self.assertIn('mae', metrics)
        self.assertIn('r2', metrics)
        
        # Check metric relationships
        self.assertGreaterEqual(metrics['rmse'], 0.0)
        self.assertGreaterEqual(metrics['mae'], 0.0)
        self.assertLessEqual(metrics['r2'], 1.0)

    def test_metric_validation(self):
        """Test metric validation against thresholds."""
        evaluator = ModelEvaluator(
            "test_model",
            task_type='classification',
            thresholds={
                'accuracy': 0.7,
                'precision': 0.6
            }
        )
        
        # Test passing metrics
        good_metrics = {
            'accuracy': 0.8,
            'precision': 0.75
        }
        passed, failed = evaluator.validate_metrics(good_metrics)
        self.assertTrue(passed)
        self.assertEqual(len(failed), 0)
        
        # Test failing metrics
        bad_metrics = {
            'accuracy': 0.6,
            'precision': 0.5
        }
        passed, failed = evaluator.validate_metrics(bad_metrics)
        self.assertFalse(passed)
        self.assertEqual(len(failed), 2)

    def test_custom_metrics(self):
        """Test custom metric functions."""
        def custom_metric(y_true, y_pred):
            return float(np.mean(np.abs(y_true - y_pred) < 0.5))
            
        evaluator = ModelEvaluator("test_model")
        
        # Evaluate with custom metric
        X, y = self.cls_data
        self.cls_model.fit(X, y, epochs=1, verbose=0)
        
        metrics = evaluator.evaluate_model(
            self.cls_model,
            (X, y),
            custom_metrics={'custom': custom_metric}
        )
        
        self.assertIn('custom', metrics)
        self.assertGreaterEqual(metrics['custom'], 0.0)
        self.assertLessEqual(metrics['custom'], 1.0)

    def test_cross_validation(self):
        """Test cross-validation functionality."""
        evaluator = ModelEvaluator("test_model")
        
        # Perform cross-validation
        X, y = self.cls_data
        cv_stats = evaluator.cross_validate(
            self.cls_model,
            (X, y),
            n_splits=3
        )
        
        # Check statistics
        for metric in cv_stats:
            stats = cv_stats[metric]
            self.assertIn('mean', stats)
            self.assertIn('std', stats)
            self.assertIn('min', stats)
            self.assertIn('max', stats)
            self.assertGreaterEqual(stats['max'], stats['mean'])
            self.assertLessEqual(stats['min'], stats['mean'])

    @patch('utils.experiment_tracking.ExperimentTracker')
    def test_evaluation_logging(self, mock_tracker):
        """Test metric logging functionality."""
        evaluator = ModelEvaluator("test_model")
        
        # Evaluate and log
        X, y = self.cls_data
        self.cls_model.fit(X, y, epochs=1, verbose=0)
        
        metrics, passed = evaluator.evaluate_and_log(
            self.cls_model,
            (X, y)
        )
        
        # Check that metrics were logged
        mock_tracker.return_value.log_metrics.assert_called_once()
        logged_metrics = mock_tracker.return_value.log_metrics.call_args[0][0]
        self.assertEqual(logged_metrics, metrics)

    def test_regression_thresholds(self):
        """Test threshold validation for regression metrics."""
        evaluator = ModelEvaluator(
            "test_regressor",
            task_type='regression',
            thresholds={
                'mse': 1.0,  # Lower is better
                'r2': 0.5    # Higher is better
            }
        )
        
        # Test metrics where lower values are better
        metrics = {
            'mse': 0.8,  # Good (below threshold)
            'r2': 0.6    # Good (above threshold)
        }
        passed, failed = evaluator.validate_metrics(metrics)
        self.assertTrue(passed)
        
        metrics = {
            'mse': 1.2,  # Bad (above threshold)
            'r2': 0.4    # Bad (below threshold)
        }
        passed, failed = evaluator.validate_metrics(metrics)
        self.assertFalse(passed)
        self.assertEqual(len(failed), 2)

    def test_model_evaluation_pipeline(self):
        """Test complete model evaluation pipeline."""
        evaluator = ModelEvaluator(
            "test_pipeline",
            task_type='classification',
            thresholds={'accuracy': 0.6}
        )
        
        # Split data
        X, y = self.cls_data
        split = int(0.8 * len(X))
        X_train, X_test = X[:split], X[split:]
        y_train, y_test = y[:split], y[split:]
        
        # Train model
        self.cls_model.fit(X_train, y_train, epochs=1, verbose=0)
        
        # Evaluate with custom metric
        def custom_metric(y_true, y_pred):
            return float(np.mean(y_true == (y_pred > 0.5)))
            
        metrics, passed = evaluator.evaluate_and_log(
            self.cls_model,
            (X_test, y_test),
            custom_metrics={'custom_accuracy': custom_metric}
        )
        
        # Check results
        self.assertIn('accuracy', metrics)
        self.assertIn('custom_accuracy', metrics)
        self.assertIsInstance(passed, bool)

if __name__ == '__main__':
    unittest.main()