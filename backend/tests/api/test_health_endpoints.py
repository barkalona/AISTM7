import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone
import psutil

from api.health_endpoints import router

client = TestClient(router)

def test_health_check_success():
    """Test health check endpoint returns healthy status when system is normal."""
    with patch('psutil.cpu_percent', return_value=50.0), \
         patch('psutil.virtual_memory', return_value=MagicMock(
             total=16000000000,
             available=8000000000,
             used=8000000000,
             percent=50.0
         )), \
         patch('psutil.disk_usage', return_value=MagicMock(
             total=100000000000,
             used=50000000000,
             free=50000000000,
             percent=50.0
         )), \
         patch('os.getloadavg', return_value=(1.5, 1.6, 1.7)):

        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data['status'] == 'healthy'
        assert 'timestamp' in data
        assert 'metrics' in data
        
        metrics = data['metrics']
        assert metrics['cpu']['usage_percent'] == 50.0
        assert metrics['memory']['usage_percent'] == 50.0
        assert metrics['disk']['usage_percent'] == 50.0

def test_health_check_error():
    """Test health check endpoint handles errors gracefully."""
    with patch('psutil.cpu_percent', side_effect=Exception('CPU error')):
        response = client.get("/health")
        assert response.status_code == 200  # Still returns 200 but with error status
        
        data = response.json()
        assert data['status'] == 'unhealthy'
        assert 'error' in data
        assert 'CPU error' in data['error']

def test_readiness_check_success():
    """Test readiness check when system resources are within thresholds."""
    with patch('psutil.cpu_percent', return_value=80.0), \
         patch('psutil.virtual_memory', return_value=MagicMock(
             total=16000000000,
             available=8000000000,
             used=8000000000,
             percent=80.0
         )), \
         patch('psutil.disk_usage', return_value=MagicMock(
             total=100000000000,
             used=50000000000,
             free=50000000000,
             percent=80.0
         )):

        response = client.get("/health/ready")
        assert response.status_code == 200

def test_readiness_check_resource_exceeded():
    """Test readiness check when system resources exceed thresholds."""
    with patch('psutil.cpu_percent', return_value=95.0), \
         patch('psutil.virtual_memory', return_value=MagicMock(
             total=16000000000,
             available=1000000000,
             used=15000000000,
             percent=95.0
         )), \
         patch('psutil.disk_usage', return_value=MagicMock(
             total=100000000000,
             used=95000000000,
             free=5000000000,
             percent=95.0
         )):

        response = client.get("/health/ready")
        assert response.status_code == 503
        assert b'System resources exceeded thresholds' in response.content

def test_readiness_check_error():
    """Test readiness check handles errors gracefully."""
    with patch('psutil.cpu_percent', side_effect=Exception('Resource error')):
        response = client.get("/health/ready")
        assert response.status_code == 503
        assert b'Resource error' in response.content

def test_liveness_check_success():
    """Test liveness check returns success."""
    response = client.get("/health/live")
    assert response.status_code == 200

def test_liveness_check_error():
    """Test liveness check handles errors gracefully."""
    with patch('fastapi.Response', side_effect=Exception('Service error')):
        response = client.get("/health/live")
        assert response.status_code == 503
        assert b'Service error' in response.content

def test_startup_check_success():
    """Test startup check returns success."""
    response = client.get("/health/startup")
    assert response.status_code == 200

def test_startup_check_error():
    """Test startup check handles errors gracefully."""
    with patch('fastapi.Response', side_effect=Exception('Startup error')):
        response = client.get("/health/startup")
        assert response.status_code == 503
        assert b'Startup error' in response.content

@pytest.mark.parametrize("cpu,memory,disk,expected_status", [
    (85, 85, 85, 200),  # All metrics near threshold
    (91, 85, 85, 503),  # CPU exceeded
    (85, 91, 85, 503),  # Memory exceeded
    (85, 85, 91, 503),  # Disk exceeded
    (91, 91, 91, 503),  # All exceeded
])
def test_readiness_check_thresholds(cpu, memory, disk, expected_status):
    """Test readiness check with different resource threshold combinations."""
    with patch('psutil.cpu_percent', return_value=cpu), \
         patch('psutil.virtual_memory', return_value=MagicMock(
             total=16000000000,
             available=16000000000 * (100 - memory) / 100,
             used=16000000000 * memory / 100,
             percent=memory
         )), \
         patch('psutil.disk_usage', return_value=MagicMock(
             total=100000000000,
             used=100000000000 * disk / 100,
             free=100000000000 * (100 - disk) / 100,
             percent=disk
         )):

        response = client.get("/health/ready")
        assert response.status_code == expected_status

def test_metrics_precision():
    """Test that system metrics are reported with appropriate precision."""
    with patch('psutil.cpu_percent', return_value=45.6789), \
         patch('psutil.virtual_memory', return_value=MagicMock(
             total=16000000000,
             available=8000000000,
             used=8000000000,
             percent=45.6789
         )), \
         patch('psutil.disk_usage', return_value=MagicMock(
             total=100000000000,
             used=50000000000,
             free=50000000000,
             percent=45.6789
         )), \
         patch('os.getloadavg', return_value=(1.5678, 1.6, 1.7)):

        response = client.get("/health")
        data = response.json()
        metrics = data['metrics']
        
        # Check that values are not truncated but also not excessively precise
        assert isinstance(metrics['cpu']['usage_percent'], float)
        assert isinstance(metrics['memory']['usage_percent'], float)
        assert isinstance(metrics['disk']['usage_percent'], float)
        assert round(metrics['cpu']['usage_percent'], 4) == 45.6789