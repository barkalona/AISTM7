from fastapi import APIRouter, Response
from typing import Dict
import psutil
import os
from datetime import datetime, timezone

router = APIRouter()

def get_system_metrics() -> Dict:
    """Get current system metrics."""
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    return {
        'cpu': {
            'usage_percent': cpu_percent,
            'load_average': os.getloadavg()[0]
        },
        'memory': {
            'total': memory.total,
            'available': memory.available,
            'used': memory.used,
            'usage_percent': memory.percent
        },
        'disk': {
            'total': disk.total,
            'used': disk.used,
            'free': disk.free,
            'usage_percent': disk.percent
        }
    }

@router.get("/health")
async def health_check() -> Dict:
    """
    Health check endpoint that returns system status and metrics.
    Used by load tests and monitoring systems.
    """
    try:
        metrics = get_system_metrics()
        
        return {
            'status': 'healthy',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'version': os.getenv('APP_VERSION', '1.0.0'),
            'environment': os.getenv('APP_ENV', 'development'),
            'metrics': metrics
        }
    except Exception as e:
        return {
            'status': 'unhealthy',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'error': str(e)
        }

@router.get("/health/ready")
async def readiness_check() -> Response:
    """
    Readiness probe endpoint.
    Verifies if the application is ready to handle traffic.
    """
    try:
        # Check system resources
        metrics = get_system_metrics()
        
        # Define thresholds
        CPU_THRESHOLD = 90  # 90% CPU usage
        MEMORY_THRESHOLD = 90  # 90% memory usage
        DISK_THRESHOLD = 90  # 90% disk usage
        
        # Check if system metrics are within acceptable ranges
        if (metrics['cpu']['usage_percent'] > CPU_THRESHOLD or
            metrics['memory']['usage_percent'] > MEMORY_THRESHOLD or
            metrics['disk']['usage_percent'] > DISK_THRESHOLD):
            return Response(
                content='System resources exceeded thresholds',
                status_code=503
            )
        
        # Add additional checks here (e.g., database connection, cache, etc.)
        
        return Response(status_code=200)
    except Exception as e:
        return Response(
            content=str(e),
            status_code=503
        )

@router.get("/health/live")
async def liveness_check() -> Response:
    """
    Liveness probe endpoint.
    Verifies if the application is running and responsive.
    """
    try:
        # Simple check to verify the application is running
        return Response(status_code=200)
    except Exception as e:
        return Response(
            content=str(e),
            status_code=503
        )

@router.get("/health/startup")
async def startup_check() -> Response:
    """
    Startup probe endpoint.
    Verifies if the application has completed its startup sequence.
    """
    try:
        # Add checks for startup-specific conditions
        # For example, verify all required services are initialized
        
        # For now, just return success
        return Response(status_code=200)
    except Exception as e:
        return Response(
            content=str(e),
            status_code=503
        )