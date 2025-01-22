import os
import json
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List, Union
import numpy as np
from dataclasses import dataclass, asdict
import wandb
import mlflow
import mlflow.tensorflow
from tensorflow.keras.models import Model

from config.settings import settings
from config.logging import get_logger
from utils.monitoring import ModelProfiler

logger = get_logger(__name__)

@dataclass
class ModelVersion:
    """Model version metadata."""
    version_id: str
    model_name: str
    created_at: str
    metrics: Dict[str, float]
    parameters: Dict[str, Any]
    git_commit: Optional[str] = None
    dataset_hash: Optional[str] = None
    parent_version: Optional[str] = None

class ExperimentTracker:
    """Track ML experiments and model versions."""
    
    def __init__(
        self,
        experiment_name: str,
        model_dir: Optional[str] = None,
        use_wandb: bool = True,
        use_mlflow: bool = True
    ):
        self.experiment_name = experiment_name
        self.model_dir = Path(model_dir or settings.MODEL_PATH) / experiment_name
        self.model_dir.mkdir(parents=True, exist_ok=True)
        
        self.use_wandb = use_wandb and settings.WANDB_ENABLED
        self.use_mlflow = use_mlflow and settings.MLFLOW_TRACKING_URI is not None
        
        # Initialize tracking platforms
        if self.use_wandb:
            wandb.init(
                project=settings.WANDB_PROJECT,
                entity=settings.WANDB_ENTITY,
                name=experiment_name
            )
            
        if self.use_mlflow:
            mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)
            mlflow.set_experiment(experiment_name)
    
    def _get_git_commit(self) -> Optional[str]:
        """Get current git commit hash."""
        try:
            import git
            repo = git.Repo(search_parent_directories=True)
            return repo.head.object.hexsha
        except:
            return None
    
    def _compute_dataset_hash(self, data: np.ndarray) -> str:
        """Compute hash of dataset for versioning."""
        return hashlib.sha256(data.tobytes()).hexdigest()
    
    def _get_version_path(self, version_id: str) -> Path:
        """Get path for model version files."""
        return self.model_dir / version_id
    
    def log_metrics(
        self,
        metrics: Dict[str, float],
        step: Optional[int] = None
    ) -> None:
        """
        Log metrics to tracking platforms.
        
        Args:
            metrics: Dictionary of metric names and values
            step: Optional step number for tracking
        """
        if self.use_wandb:
            wandb.log(metrics, step=step)
            
        if self.use_mlflow:
            mlflow.log_metrics(metrics, step=step)
            
        logger.info(
            f"Logged metrics for {self.experiment_name}",
            extra={'model_metrics': metrics}
        )
    
    def log_parameters(self, parameters: Dict[str, Any]) -> None:
        """
        Log model parameters to tracking platforms.
        
        Args:
            parameters: Dictionary of parameter names and values
        """
        if self.use_wandb:
            wandb.config.update(parameters)
            
        if self.use_mlflow:
            mlflow.log_params(parameters)
            
        logger.info(
            f"Logged parameters for {self.experiment_name}",
            extra={'model_parameters': parameters}
        )
    
    def save_model_version(
        self,
        model: Model,
        metrics: Dict[str, float],
        parameters: Dict[str, Any],
        training_data: Optional[np.ndarray] = None,
        parent_version: Optional[str] = None
    ) -> ModelVersion:
        """
        Save a new model version with metadata.
        
        Args:
            model: Trained model to save
            metrics: Model performance metrics
            parameters: Model parameters and hyperparameters
            training_data: Optional training data for versioning
            parent_version: Optional ID of parent model version
            
        Returns:
            ModelVersion object with metadata
        """
        # Generate version ID
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        version_id = f"v_{timestamp}"
        
        # Create version metadata
        version = ModelVersion(
            version_id=version_id,
            model_name=self.experiment_name,
            created_at=datetime.utcnow().isoformat(),
            metrics=metrics,
            parameters=parameters,
            git_commit=self._get_git_commit(),
            dataset_hash=self._compute_dataset_hash(training_data) if training_data is not None else None,
            parent_version=parent_version
        )
        
        # Save version metadata
        version_path = self._get_version_path(version_id)
        version_path.mkdir(parents=True, exist_ok=True)
        
        with open(version_path / 'metadata.json', 'w') as f:
            json.dump(asdict(version), f, indent=2)
        
        # Save model
        model.save(version_path / 'model')
        
        # Log to tracking platforms
        if self.use_wandb:
            wandb.log({
                'version_id': version_id,
                **metrics
            })
            wandb.save(str(version_path / 'metadata.json'))
            
        if self.use_mlflow:
            with mlflow.start_run():
                mlflow.log_params(parameters)
                mlflow.log_metrics(metrics)
                mlflow.tensorflow.log_model(model, version_id)
                mlflow.log_artifact(str(version_path / 'metadata.json'))
        
        logger.info(
            f"Saved model version {version_id}",
            extra={
                'model_version': asdict(version)
            }
        )
        
        return version
    
    def load_model_version(
        self,
        version_id: str
    ) -> tuple[Model, ModelVersion]:
        """
        Load a model version and its metadata.
        
        Args:
            version_id: Version ID to load
            
        Returns:
            Tuple of (loaded model, version metadata)
        """
        version_path = self._get_version_path(version_id)
        
        # Load metadata
        with open(version_path / 'metadata.json', 'r') as f:
            metadata = json.load(f)
            version = ModelVersion(**metadata)
        
        # Load model
        model = Model.load(version_path / 'model')
        
        return model, version
    
    def list_versions(
        self,
        min_metric: Optional[Dict[str, float]] = None,
        max_versions: Optional[int] = None
    ) -> List[ModelVersion]:
        """
        List model versions with optional filtering.
        
        Args:
            min_metric: Optional minimum values for metrics
            max_versions: Optional maximum number of versions to return
            
        Returns:
            List of ModelVersion objects
        """
        versions = []
        
        for version_dir in sorted(self.model_dir.iterdir(), reverse=True):
            if not version_dir.is_dir():
                continue
                
            metadata_path = version_dir / 'metadata.json'
            if not metadata_path.exists():
                continue
                
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
                version = ModelVersion(**metadata)
                
            # Filter by metrics if specified
            if min_metric:
                if not all(
                    version.metrics.get(k, 0) >= v
                    for k, v in min_metric.items()
                ):
                    continue
                    
            versions.append(version)
            
            if max_versions and len(versions) >= max_versions:
                break
                
        return versions
    
    def get_best_version(
        self,
        metric: str,
        higher_is_better: bool = True
    ) -> Optional[ModelVersion]:
        """
        Get the best model version by metric.
        
        Args:
            metric: Metric name to compare
            higher_is_better: Whether higher metric values are better
            
        Returns:
            Best ModelVersion or None if no versions exist
        """
        versions = self.list_versions()
        if not versions:
            return None
            
        return max(
            versions,
            key=lambda v: v.metrics.get(metric, float('-inf')) if higher_is_better
            else -v.metrics.get(metric, float('inf'))
        )
    
    def compare_versions(
        self,
        version_ids: List[str],
        metrics: Optional[List[str]] = None
    ) -> Dict[str, Dict[str, float]]:
        """
        Compare metrics across model versions.
        
        Args:
            version_ids: List of version IDs to compare
            metrics: Optional list of metrics to compare
            
        Returns:
            Dictionary of version IDs to metric values
        """
        comparison = {}
        
        for version_id in version_ids:
            try:
                version_path = self._get_version_path(version_id)
                with open(version_path / 'metadata.json', 'r') as f:
                    metadata = json.load(f)
                    
                if metrics:
                    comparison[version_id] = {
                        k: metadata['metrics'][k]
                        for k in metrics
                        if k in metadata['metrics']
                    }
                else:
                    comparison[version_id] = metadata['metrics']
                    
            except Exception as e:
                logger.error(
                    f"Error loading version {version_id}: {e}",
                    extra={'version_id': version_id}
                )
                
        return comparison
    
    def cleanup_old_versions(
        self,
        keep_versions: int = 5,
        min_metric: Optional[Dict[str, float]] = None
    ) -> None:
        """
        Remove old model versions while keeping the best ones.
        
        Args:
            keep_versions: Number of versions to keep
            min_metric: Optional minimum values for metrics to keep
        """
        versions = self.list_versions(min_metric=min_metric)
        
        # Keep the most recent versions
        versions_to_keep = versions[:keep_versions]
        versions_to_remove = versions[keep_versions:]
        
        for version in versions_to_remove:
            version_path = self._get_version_path(version.version_id)
            try:
                if version_path.exists():
                    import shutil
                    shutil.rmtree(version_path)
                logger.info(f"Removed old version {version.version_id}")
            except Exception as e:
                logger.error(
                    f"Error removing version {version.version_id}: {e}",
                    extra={'version_id': version.version_id}
                )
    
    def __enter__(self):
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit with cleanup."""
        if self.use_wandb:
            wandb.finish()
            
        if self.use_mlflow:
            mlflow.end_run()