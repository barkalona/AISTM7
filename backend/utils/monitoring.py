import time
import psutil
import threading
from functools import wraps
from typing import Optional, Dict, Any, Callable
import numpy as np
from datetime import datetime

from config.logging import ModelTrainingLogger, PerformanceLogger
from config.settings import settings

class ModelProfiler:
    """Profile and monitor AI model performance."""
    
    def __init__(self, model_name: str):
        self.model_name = model_name
        self.model_logger = ModelTrainingLogger(model_name)
        self.perf_logger = PerformanceLogger(f"model.{model_name}")
        self._prediction_times: list[float] = []
        self._batch_sizes: list[int] = []
        self._prediction_count = 0
        self._lock = threading.Lock()

    def log_prediction(
        self,
        input_data: np.ndarray,
        prediction_time: float,
        confidence: float,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Log a single prediction event.
        
        Args:
            input_data: Input data array
            prediction_time: Time taken for prediction in seconds
            confidence: Model confidence score
            metadata: Optional additional metadata
        """
        with self._lock:
            self._prediction_times.append(prediction_time)
            if len(input_data.shape) > 1:
                self._batch_sizes.append(input_data.shape[0])
            self._prediction_count += 1
        
        self.model_logger.log_prediction(
            input_shape=input_data.shape,
            prediction_time=prediction_time,
            confidence=confidence
        )
        
        if metadata:
            self.perf_logger.log_timing(
                "prediction",
                prediction_time,
                metadata
            )

    def get_prediction_stats(self) -> Dict[str, float]:
        """Get statistical summary of prediction performance."""
        with self._lock:
            if not self._prediction_times:
                return {}
                
            times = np.array(self._prediction_times)
            return {
                'mean_prediction_time': float(np.mean(times)),
                'median_prediction_time': float(np.median(times)),
                'std_prediction_time': float(np.std(times)),
                'min_prediction_time': float(np.min(times)),
                'max_prediction_time': float(np.max(times)),
                'total_predictions': self._prediction_count,
                'mean_batch_size': float(np.mean(self._batch_sizes)) if self._batch_sizes else 1.0
            }

    def reset_stats(self) -> None:
        """Reset performance statistics."""
        with self._lock:
            self._prediction_times = []
            self._batch_sizes = []
            self._prediction_count = 0

def profile_prediction(model_name: str):
    """
    Decorator to profile model predictions.
    
    Args:
        model_name: Name of the model to profile
    """
    profiler = ModelProfiler(model_name)
    
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.perf_counter()
            
            try:
                result = func(*args, **kwargs)
                prediction_time = time.perf_counter() - start_time
                
                # Extract input data and confidence if available
                input_data = args[1] if len(args) > 1 else kwargs.get('input_data')
                confidence = (
                    result.get('confidence')
                    if isinstance(result, dict)
                    else getattr(result, 'confidence', None)
                )
                
                if input_data is not None:
                    profiler.log_prediction(
                        input_data=input_data,
                        prediction_time=prediction_time,
                        confidence=confidence if confidence is not None else 1.0
                    )
                
                return result
            except Exception as e:
                # Log error but don't interfere with exception propagation
                profiler.perf_logger.log_timing(
                    "prediction_error",
                    time.perf_counter() - start_time,
                    {"error": str(e)}
                )
                raise
                
        return wrapper
    return decorator

class ResourceMonitor:
    """Monitor system resource usage."""
    
    def __init__(self, component: str):
        self.perf_logger = PerformanceLogger(component)
        self.monitoring = False
        self.monitor_thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()

    def start_monitoring(self, interval: float = 60.0) -> None:
        """
        Start resource monitoring in background thread.
        
        Args:
            interval: Monitoring interval in seconds
        """
        if self.monitoring:
            return
            
        self.monitoring = True
        self._stop_event.clear()
        
        def monitor_resources():
            while not self._stop_event.is_set():
                try:
                    cpu_percent = psutil.cpu_percent(interval=1)
                    memory = psutil.Process().memory_info()
                    memory_mb = memory.rss / (1024 * 1024)
                    
                    # Get GPU utilization if available
                    gpu_util = None
                    if settings.TENSORFLOW_DEVICE == "GPU":
                        try:
                            import pynvml
                            pynvml.nvmlInit()
                            handle = pynvml.nvmlDeviceGetHandleByIndex(0)
                            gpu_util = pynvml.nvmlDeviceGetUtilizationRates(handle).gpu
                        except:
                            pass
                    
                    self.perf_logger.log_resource_usage(
                        cpu_percent=cpu_percent,
                        memory_mb=memory_mb,
                        gpu_utilization=gpu_util
                    )
                    
                    time.sleep(max(0, interval - 1))  # Account for measurement time
                except Exception as e:
                    self.perf_logger.logger.error(f"Error monitoring resources: {e}")
                    time.sleep(interval)
        
        self.monitor_thread = threading.Thread(target=monitor_resources, daemon=True)
        self.monitor_thread.start()

    def stop_monitoring(self) -> None:
        """Stop resource monitoring."""
        self._stop_event.set()
        if self.monitor_thread:
            self.monitor_thread.join(timeout=5.0)
        self.monitoring = False

class BatchProfiler:
    """Profile batch processing performance."""
    
    def __init__(self, component: str):
        self.perf_logger = PerformanceLogger(component)
        self.start_time = time.perf_counter()
        self.success_count = 0
        self.error_count = 0
        self._lock = threading.Lock()

    def record_success(self) -> None:
        """Record successful operation."""
        with self._lock:
            self.success_count += 1

    def record_error(self) -> None:
        """Record failed operation."""
        with self._lock:
            self.error_count += 1

    def complete_batch(self, batch_size: int) -> None:
        """
        Complete batch processing and log metrics.
        
        Args:
            batch_size: Size of the processed batch
        """
        processing_time = time.perf_counter() - self.start_time
        
        self.perf_logger.log_batch_processing(
            batch_size=batch_size,
            processing_time=processing_time,
            success_count=self.success_count,
            error_count=self.error_count
        )

def profile_batch(component: str):
    """
    Decorator to profile batch processing.
    
    Args:
        component: Component name for logging
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Extract batch size from args or kwargs
            batch_size = (
                len(args[1])
                if len(args) > 1 and hasattr(args[1], '__len__')
                else len(kwargs['batch'])
                if 'batch' in kwargs and hasattr(kwargs['batch'], '__len__')
                else 0
            )
            
            profiler = BatchProfiler(component)
            
            try:
                result = func(*args, **kwargs)
                
                # Count successes/failures if result indicates them
                if isinstance(result, dict):
                    profiler.success_count = len(result.get('success', []))
                    profiler.error_count = len(result.get('errors', []))
                elif isinstance(result, (list, tuple)):
                    profiler.success_count = len(result)
                else:
                    profiler.success_count = 1
                    
                return result
            except Exception as e:
                profiler.error_count = batch_size
                raise
            finally:
                profiler.complete_batch(batch_size)
                
        return wrapper
    return decorator