import logging
import logging.handlers
import json
import os
from datetime import datetime
from pathlib import Path
from pythonjsonlogger import jsonlogger
from typing import Optional, Dict, Any

from .settings import settings

# Create logs directory if it doesn't exist
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)

class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter with additional fields."""
    
    def add_fields(self, log_record: Dict[str, Any], record: logging.LogRecord, message_dict: Dict[str, Any]) -> None:
        super().add_fields(log_record, record, message_dict)
        
        # Add timestamp in ISO format
        log_record['timestamp'] = datetime.utcfromtimestamp(record.created).isoformat()
        log_record['level'] = record.levelname
        log_record['environment'] = settings.APP_ENV
        
        # Add correlation ID if available
        if hasattr(record, 'correlation_id'):
            log_record['correlation_id'] = record.correlation_id
            
        # Add model training metrics if available
        if hasattr(record, 'model_metrics'):
            log_record['model_metrics'] = record.model_metrics
            
        # Add performance metrics if available
        if hasattr(record, 'performance_metrics'):
            log_record['performance_metrics'] = record.performance_metrics

class ModelTrainingFilter(logging.Filter):
    """Filter for model training logs."""
    
    def filter(self, record: logging.LogRecord) -> bool:
        return hasattr(record, 'model_metrics')

class PerformanceFilter(logging.Filter):
    """Filter for performance monitoring logs."""
    
    def filter(self, record: logging.LogRecord) -> bool:
        return hasattr(record, 'performance_metrics')

def setup_logging(
    log_level: Optional[str] = None,
    correlation_id: Optional[str] = None
) -> None:
    """
    Set up logging configuration.
    
    Args:
        log_level: Optional override for log level
        correlation_id: Optional correlation ID for request tracing
    """
    level = getattr(logging, (log_level or settings.LOG_LEVEL).upper())
    
    # Create formatters
    json_formatter = CustomJsonFormatter(
        '%(timestamp)s %(level)s %(name)s %(message)s'
    )
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(json_formatter)
    
    # File handlers
    main_handler = logging.handlers.RotatingFileHandler(
        log_dir / 'aistm7.log',
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5
    )
    main_handler.setFormatter(json_formatter)
    
    # Model training logs
    model_handler = logging.handlers.RotatingFileHandler(
        log_dir / 'model_training.log',
        maxBytes=50 * 1024 * 1024,  # 50MB
        backupCount=10
    )
    model_handler.setFormatter(json_formatter)
    model_handler.addFilter(ModelTrainingFilter())
    
    # Performance monitoring logs
    performance_handler = logging.handlers.RotatingFileHandler(
        log_dir / 'performance.log',
        maxBytes=20 * 1024 * 1024,  # 20MB
        backupCount=7
    )
    performance_handler.setFormatter(json_formatter)
    performance_handler.addFilter(PerformanceFilter())
    
    # Error logs
    error_handler = logging.handlers.RotatingFileHandler(
        log_dir / 'error.log',
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5
    )
    error_handler.setFormatter(json_formatter)
    error_handler.setLevel(logging.ERROR)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    
    # Remove existing handlers
    root_logger.handlers = []
    
    # Add handlers
    root_logger.addHandler(console_handler)
    root_logger.addHandler(main_handler)
    root_logger.addHandler(model_handler)
    root_logger.addHandler(performance_handler)
    root_logger.addHandler(error_handler)
    
    # Set correlation ID if provided
    if correlation_id:
        logging.LogRecord = type('LogRecord', (logging.LogRecord,), {
            'correlation_id': correlation_id
        })

def get_logger(name: str) -> logging.Logger:
    """
    Get a logger with the specified name.
    
    Args:
        name: Logger name
        
    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)

class ModelTrainingLogger:
    """Logger for AI model training metrics."""
    
    def __init__(self, model_name: str):
        self.logger = get_logger(f"model.{model_name}")
    
    def log_metrics(
        self,
        epoch: int,
        metrics: Dict[str, float],
        validation_metrics: Optional[Dict[str, float]] = None
    ) -> None:
        """
        Log training metrics for an epoch.
        
        Args:
            epoch: Training epoch number
            metrics: Training metrics dictionary
            validation_metrics: Optional validation metrics
        """
        log_data = {
            'epoch': epoch,
            'training': metrics
        }
        
        if validation_metrics:
            log_data['validation'] = validation_metrics
            
        self.logger.info(
            f"Training metrics for epoch {epoch}",
            extra={'model_metrics': log_data}
        )
    
    def log_evaluation(self, metrics: Dict[str, float]) -> None:
        """
        Log model evaluation metrics.
        
        Args:
            metrics: Evaluation metrics dictionary
        """
        self.logger.info(
            "Model evaluation metrics",
            extra={'model_metrics': {'evaluation': metrics}}
        )
    
    def log_prediction(
        self,
        input_shape: tuple,
        prediction_time: float,
        confidence: float
    ) -> None:
        """
        Log prediction metrics.
        
        Args:
            input_shape: Shape of input data
            prediction_time: Time taken for prediction
            confidence: Prediction confidence score
        """
        self.logger.info(
            "Prediction metrics",
            extra={
                'model_metrics': {
                    'prediction': {
                        'input_shape': input_shape,
                        'prediction_time_ms': prediction_time * 1000,
                        'confidence': confidence
                    }
                }
            }
        )

class PerformanceLogger:
    """Logger for performance monitoring."""
    
    def __init__(self, component: str):
        self.logger = get_logger(f"performance.{component}")
    
    def log_timing(
        self,
        operation: str,
        duration: float,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Log operation timing.
        
        Args:
            operation: Operation name
            duration: Duration in seconds
            metadata: Optional metadata dictionary
        """
        metrics = {
            'operation': operation,
            'duration_ms': duration * 1000
        }
        
        if metadata:
            metrics.update(metadata)
            
        self.logger.info(
            f"Operation timing: {operation}",
            extra={'performance_metrics': metrics}
        )
    
    def log_resource_usage(
        self,
        cpu_percent: float,
        memory_mb: float,
        gpu_utilization: Optional[float] = None
    ) -> None:
        """
        Log resource usage metrics.
        
        Args:
            cpu_percent: CPU utilization percentage
            memory_mb: Memory usage in MB
            gpu_utilization: Optional GPU utilization percentage
        """
        metrics = {
            'cpu_percent': cpu_percent,
            'memory_mb': memory_mb
        }
        
        if gpu_utilization is not None:
            metrics['gpu_utilization'] = gpu_utilization
            
        self.logger.info(
            "Resource usage metrics",
            extra={'performance_metrics': metrics}
        )
    
    def log_batch_processing(
        self,
        batch_size: int,
        processing_time: float,
        success_count: int,
        error_count: int
    ) -> None:
        """
        Log batch processing metrics.
        
        Args:
            batch_size: Size of processed batch
            processing_time: Processing time in seconds
            success_count: Number of successful operations
            error_count: Number of failed operations
        """
        self.logger.info(
            "Batch processing metrics",
            extra={
                'performance_metrics': {
                    'batch_size': batch_size,
                    'processing_time_ms': processing_time * 1000,
                    'success_count': success_count,
                    'error_count': error_count,
                    'success_rate': success_count / batch_size if batch_size > 0 else 0
                }
            }
        )