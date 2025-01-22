import unittest
import tempfile
import shutil
import json
import numpy as np
from pathlib import Path
from unittest.mock import patch, MagicMock
from datetime import datetime
import tensorflow as tf

from utils.experiment_tracking import ExperimentTracker, ModelVersion

class TestExperimentTracking(unittest.TestCase):
    def setUp(self):
        """Set up test environment."""
        # Create temporary directory for models
        self.temp_dir = tempfile.mkdtemp()
        self.model_dir = Path(self.temp_dir) / "models"
        
        # Create simple test model
        self.test_model = tf.keras.Sequential([
            tf.keras.layers.Dense(10, activation='relu', input_shape=(5,)),
            tf.keras.layers.Dense(1, activation='sigmoid')
        ])
        
        # Mock settings
        self.settings_patcher = patch('utils.experiment_tracking.settings')
        self.mock_settings = self.settings_patcher.start()
        self.mock_settings.MODEL_PATH = self.model_dir
        self.mock_settings.WANDB_ENABLED = False
        self.mock_settings.MLFLOW_TRACKING_URI = None
        
        # Create tracker
        self.tracker = ExperimentTracker(
            "test_experiment",
            model_dir=str(self.model_dir),
            use_wandb=False,
            use_mlflow=False
        )

    def tearDown(self):
        """Clean up test environment."""
        shutil.rmtree(self.temp_dir)
        self.settings_patcher.stop()

    def test_save_load_model_version(self):
        """Test saving and loading model versions."""
        # Create test data
        metrics = {'accuracy': 0.95, 'loss': 0.1}
        parameters = {'learning_rate': 0.001, 'batch_size': 32}
        training_data = np.random.randn(100, 5)
        
        # Save version
        version = self.tracker.save_model_version(
            self.test_model,
            metrics,
            parameters,
            training_data
        )
        
        # Load version
        loaded_model, loaded_version = self.tracker.load_model_version(version.version_id)
        
        # Check metadata
        self.assertEqual(loaded_version.model_name, "test_experiment")
        self.assertEqual(loaded_version.metrics, metrics)
        self.assertEqual(loaded_version.parameters, parameters)
        self.assertIsNotNone(loaded_version.dataset_hash)
        
        # Check model structure
        self.assertEqual(
            len(loaded_model.layers),
            len(self.test_model.layers)
        )

    def test_version_listing_and_filtering(self):
        """Test listing and filtering model versions."""
        # Create multiple versions
        versions = []
        for i in range(3):
            version = self.tracker.save_model_version(
                self.test_model,
                {'accuracy': 0.8 + i * 0.1},
                {'version': i}
            )
            versions.append(version)
        
        # List all versions
        all_versions = self.tracker.list_versions()
        self.assertEqual(len(all_versions), 3)
        
        # Filter by metric
        good_versions = self.tracker.list_versions(
            min_metric={'accuracy': 0.9}
        )
        self.assertEqual(len(good_versions), 2)
        
        # Limit number of versions
        limited_versions = self.tracker.list_versions(max_versions=2)
        self.assertEqual(len(limited_versions), 2)

    def test_best_version_selection(self):
        """Test selecting best model version."""
        # Create versions with different metrics
        metrics = [
            {'accuracy': 0.85, 'loss': 0.2},
            {'accuracy': 0.90, 'loss': 0.15},
            {'accuracy': 0.88, 'loss': 0.18}
        ]
        
        for m in metrics:
            self.tracker.save_model_version(
                self.test_model,
                m,
                {'batch_size': 32}
            )
        
        # Find best by accuracy (higher is better)
        best_accuracy = self.tracker.get_best_version(
            'accuracy',
            higher_is_better=True
        )
        self.assertEqual(best_accuracy.metrics['accuracy'], 0.90)
        
        # Find best by loss (lower is better)
        best_loss = self.tracker.get_best_version(
            'loss',
            higher_is_better=False
        )
        self.assertEqual(best_loss.metrics['loss'], 0.15)

    @patch('wandb.init')
    @patch('wandb.log')
    def test_wandb_integration(self, mock_log, mock_init):
        """Test Weights & Biases integration."""
        # Enable W&B
        self.mock_settings.WANDB_ENABLED = True
        self.mock_settings.WANDB_PROJECT = "test_project"
        
        tracker = ExperimentTracker(
            "wandb_test",
            model_dir=str(self.model_dir),
            use_wandb=True,
            use_mlflow=False
        )
        
        # Log metrics
        metrics = {'accuracy': 0.95, 'loss': 0.1}
        tracker.log_metrics(metrics, step=1)
        
        mock_init.assert_called_once()
        mock_log.assert_called_with(metrics, step=1)

    @patch('mlflow.set_tracking_uri')
    @patch('mlflow.set_experiment')
    @patch('mlflow.log_metrics')
    def test_mlflow_integration(self, mock_log_metrics, mock_set_exp, mock_set_uri):
        """Test MLflow integration."""
        # Enable MLflow
        self.mock_settings.MLFLOW_TRACKING_URI = "http://localhost:5000"
        
        tracker = ExperimentTracker(
            "mlflow_test",
            model_dir=str(self.model_dir),
            use_wandb=False,
            use_mlflow=True
        )
        
        # Log metrics
        metrics = {'accuracy': 0.95, 'loss': 0.1}
        tracker.log_metrics(metrics)
        
        mock_set_uri.assert_called_once_with("http://localhost:5000")
        mock_set_exp.assert_called_once_with("mlflow_test")
        mock_log_metrics.assert_called_with(metrics, step=None)

    def test_version_comparison(self):
        """Test comparing model versions."""
        # Create versions with different metrics
        versions = []
        for i in range(3):
            version = self.tracker.save_model_version(
                self.test_model,
                {
                    'accuracy': 0.8 + i * 0.1,
                    'loss': 0.2 - i * 0.05
                },
                {'version': i}
            )
            versions.append(version)
        
        # Compare specific metrics
        comparison = self.tracker.compare_versions(
            [v.version_id for v in versions],
            metrics=['accuracy']
        )
        
        self.assertEqual(len(comparison), 3)
        for v in versions:
            self.assertIn('accuracy', comparison[v.version_id])

    def test_cleanup_old_versions(self):
        """Test cleaning up old model versions."""
        # Create multiple versions
        for i in range(10):
            self.tracker.save_model_version(
                self.test_model,
                {'accuracy': 0.8 + i * 0.02},
                {'version': i}
            )
        
        # Keep only 5 versions
        self.tracker.cleanup_old_versions(keep_versions=5)
        
        remaining_versions = self.tracker.list_versions()
        self.assertEqual(len(remaining_versions), 5)
        
        # Check that we kept the most recent ones
        timestamps = [
            datetime.fromisoformat(v.created_at)
            for v in remaining_versions
        ]
        self.assertEqual(
            timestamps,
            sorted(timestamps, reverse=True)
        )

    def test_git_integration(self):
        """Test git commit tracking."""
        with patch('git.Repo') as mock_repo:
            # Mock git commit hash
            mock_commit = MagicMock()
            mock_commit.hexsha = "abc123"
            mock_repo.return_value.head.object = mock_commit
            
            version = self.tracker.save_model_version(
                self.test_model,
                {'accuracy': 0.95},
                {'batch_size': 32}
            )
            
            self.assertEqual(version.git_commit, "abc123")

    def test_dataset_versioning(self):
        """Test dataset hash computation."""
        data1 = np.random.randn(100, 5)
        data2 = np.random.randn(100, 5)
        
        # Save versions with different datasets
        version1 = self.tracker.save_model_version(
            self.test_model,
            {'accuracy': 0.95},
            {'batch_size': 32},
            training_data=data1
        )
        
        version2 = self.tracker.save_model_version(
            self.test_model,
            {'accuracy': 0.96},
            {'batch_size': 32},
            training_data=data2
        )
        
        # Different data should have different hashes
        self.assertNotEqual(version1.dataset_hash, version2.dataset_hash)
        
        # Same data should have same hash
        version3 = self.tracker.save_model_version(
            self.test_model,
            {'accuracy': 0.97},
            {'batch_size': 32},
            training_data=data1
        )
        
        self.assertEqual(version1.dataset_hash, version3.dataset_hash)

if __name__ == '__main__':
    unittest.main()