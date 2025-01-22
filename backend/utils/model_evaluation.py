import numpy as np
from typing import Dict, Any, Optional, List, Tuple, Callable
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    roc_auc_score,
    mean_squared_error,
    r2_score
)
import tensorflow as tf
from tensorflow.keras.models import Model

from config.settings import settings
from config.logging import get_logger
from utils.monitoring import ModelProfiler
from utils.experiment_tracking import ExperimentTracker

logger = get_logger(__name__)

class ModelEvaluator:
    """Evaluate model performance and validate for deployment."""
    
    def __init__(
        self,
        model_name: str,
        task_type: str = 'classification',
        metrics: Optional[List[str]] = None,
        thresholds: Optional[Dict[str, float]] = None
    ):
        """
        Initialize model evaluator.
        
        Args:
            model_name: Name of the model
            task_type: Type of task ('classification' or 'regression')
            metrics: List of metrics to compute
            thresholds: Dictionary of metric thresholds for validation
        """
        self.model_name = model_name
        self.task_type = task_type
        self.profiler = ModelProfiler(model_name)
        self.tracker = ExperimentTracker(model_name)
        
        # Set default metrics based on task type
        self.metrics = metrics or (
            ['accuracy', 'precision', 'recall', 'f1', 'auc']
            if task_type == 'classification'
            else ['mse', 'rmse', 'mae', 'r2']
        )
        
        # Set default thresholds
        self.thresholds = thresholds or {
            'accuracy': 0.8,
            'precision': 0.7,
            'recall': 0.7,
            'f1': 0.7,
            'auc': 0.8,
            'mse': 0.2,
            'rmse': 0.4,
            'mae': 0.3,
            'r2': 0.6
        }

    def evaluate_classification(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_prob: Optional[np.ndarray] = None
    ) -> Dict[str, float]:
        """
        Evaluate classification model performance.
        
        Args:
            y_true: True labels
            y_pred: Predicted labels
            y_prob: Predicted probabilities (for AUC)
            
        Returns:
            Dictionary of metric values
        """
        metrics = {}
        
        if 'accuracy' in self.metrics:
            metrics['accuracy'] = float(accuracy_score(y_true, y_pred))
            
        if any(m in self.metrics for m in ['precision', 'recall', 'f1']):
            precision, recall, f1, _ = precision_recall_fscore_support(
                y_true,
                y_pred,
                average='weighted'
            )
            if 'precision' in self.metrics:
                metrics['precision'] = float(precision)
            if 'recall' in self.metrics:
                metrics['recall'] = float(recall)
            if 'f1' in self.metrics:
                metrics['f1'] = float(f1)
                
        if 'auc' in self.metrics and y_prob is not None:
            if y_prob.shape[1] == 2:  # Binary classification
                metrics['auc'] = float(roc_auc_score(y_true, y_prob[:, 1]))
            else:  # Multi-class
                metrics['auc'] = float(roc_auc_score(
                    y_true,
                    y_prob,
                    multi_class='ovr'
                ))
                
        return metrics

    def evaluate_regression(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray
    ) -> Dict[str, float]:
        """
        Evaluate regression model performance.
        
        Args:
            y_true: True values
            y_pred: Predicted values
            
        Returns:
            Dictionary of metric values
        """
        metrics = {}
        
        if 'mse' in self.metrics:
            metrics['mse'] = float(mean_squared_error(y_true, y_pred))
            
        if 'rmse' in self.metrics:
            metrics['rmse'] = float(np.sqrt(mean_squared_error(y_true, y_pred)))
            
        if 'mae' in self.metrics:
            metrics['mae'] = float(np.mean(np.abs(y_true - y_pred)))
            
        if 'r2' in self.metrics:
            metrics['r2'] = float(r2_score(y_true, y_pred))
            
        return metrics

    def evaluate_model(
        self,
        model: Model,
        test_data: Tuple[np.ndarray, np.ndarray],
        custom_metrics: Optional[Dict[str, Callable]] = None
    ) -> Dict[str, float]:
        """
        Evaluate model on test data.
        
        Args:
            model: Model to evaluate
            test_data: Tuple of (X_test, y_test)
            custom_metrics: Optional dictionary of custom metric functions
            
        Returns:
            Dictionary of metric values
        """
        X_test, y_test = test_data
        
        # Get predictions
        y_pred_raw = model.predict(X_test)
        
        if self.task_type == 'classification':
            # Convert probabilities to class predictions
            if len(y_pred_raw.shape) > 1 and y_pred_raw.shape[1] > 1:
                y_pred = np.argmax(y_pred_raw, axis=1)
            else:
                y_pred = (y_pred_raw > 0.5).astype(int)
                
            metrics = self.evaluate_classification(
                y_test,
                y_pred,
                y_pred_raw
            )
        else:
            metrics = self.evaluate_regression(y_test, y_pred_raw)
            
        # Add custom metrics
        if custom_metrics:
            for name, metric_fn in custom_metrics.items():
                try:
                    metrics[name] = float(metric_fn(y_test, y_pred_raw))
                except Exception as e:
                    logger.error(
                        f"Error computing custom metric {name}: {e}",
                        extra={'metric_name': name}
                    )
                    
        return metrics

    def validate_metrics(
        self,
        metrics: Dict[str, float],
        custom_thresholds: Optional[Dict[str, float]] = None
    ) -> Tuple[bool, List[str]]:
        """
        Validate metrics against thresholds.
        
        Args:
            metrics: Dictionary of metric values
            custom_thresholds: Optional custom thresholds to override defaults
            
        Returns:
            Tuple of (passed validation, list of failed metrics)
        """
        thresholds = {**self.thresholds, **(custom_thresholds or {})}
        failed_metrics = []
        
        for metric, value in metrics.items():
            if metric in thresholds:
                threshold = thresholds[metric]
                if self.task_type == 'regression' and metric in ['mse', 'rmse', 'mae']:
                    if value > threshold:  # Lower is better
                        failed_metrics.append(metric)
                else:
                    if value < threshold:  # Higher is better
                        failed_metrics.append(metric)
                        
        return len(failed_metrics) == 0, failed_metrics

    def evaluate_and_log(
        self,
        model: Model,
        test_data: Tuple[np.ndarray, np.ndarray],
        custom_metrics: Optional[Dict[str, Callable]] = None,
        custom_thresholds: Optional[Dict[str, float]] = None
    ) -> Tuple[Dict[str, float], bool]:
        """
        Evaluate model and log results.
        
        Args:
            model: Model to evaluate
            test_data: Tuple of (X_test, y_test)
            custom_metrics: Optional custom metric functions
            custom_thresholds: Optional custom thresholds
            
        Returns:
            Tuple of (metrics, validation passed)
        """
        # Evaluate model
        metrics = self.evaluate_model(model, test_data, custom_metrics)
        
        # Validate metrics
        passed, failed_metrics = self.validate_metrics(metrics, custom_thresholds)
        
        # Log results
        self.tracker.log_metrics(metrics)
        
        if not passed:
            logger.warning(
                f"Model {self.model_name} failed validation",
                extra={
                    'failed_metrics': failed_metrics,
                    'metrics': metrics
                }
            )
        else:
            logger.info(
                f"Model {self.model_name} passed validation",
                extra={'metrics': metrics}
            )
            
        return metrics, passed

    def cross_validate(
        self,
        model: Model,
        data: Tuple[np.ndarray, np.ndarray],
        n_splits: int = 5,
        custom_metrics: Optional[Dict[str, Callable]] = None
    ) -> Dict[str, Dict[str, float]]:
        """
        Perform cross-validation.
        
        Args:
            model: Model to evaluate
            data: Tuple of (X, y)
            n_splits: Number of CV splits
            custom_metrics: Optional custom metric functions
            
        Returns:
            Dictionary of metric statistics
        """
        X, y = data
        kf = tf.keras.utils.split_generator(X.shape[0], n_splits)
        
        all_metrics = []
        for train_idx, val_idx in kf:
            # Create fold data
            X_train, X_val = X[train_idx], X[val_idx]
            y_train, y_val = y[train_idx], y[val_idx]
            
            # Train model on fold
            model.fit(X_train, y_train, verbose=0)
            
            # Evaluate on validation data
            metrics = self.evaluate_model(
                model,
                (X_val, y_val),
                custom_metrics
            )
            all_metrics.append(metrics)
            
        # Compute statistics
        metric_stats = {}
        for metric in all_metrics[0].keys():
            values = [m[metric] for m in all_metrics]
            metric_stats[metric] = {
                'mean': float(np.mean(values)),
                'std': float(np.std(values)),
                'min': float(np.min(values)),
                'max': float(np.max(values))
            }
            
        return metric_stats