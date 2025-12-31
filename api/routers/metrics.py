"""
KMS Metrics API
Provides Prometheus-compatible metrics endpoint
"""

from fastapi import APIRouter
from fastapi.responses import PlainTextResponse
import time
import psutil
import os

router = APIRouter()

# Metrics storage
metrics = {
    "requests_total": 0,
    "requests_success": 0,
    "requests_error": 0,
    "api_latency_sum": 0.0,
    "api_latency_count": 0,
    "claude_requests_total": 0,
    "git_operations_total": 0,
    "file_operations_total": 0
}

# Start time for uptime calculation
START_TIME = time.time()


def increment_metric(name: str, value: int = 1):
    """Increment a metric counter"""
    if name in metrics:
        metrics[name] += value


def record_latency(latency_ms: float):
    """Record API latency"""
    metrics["api_latency_sum"] += latency_ms
    metrics["api_latency_count"] += 1


def get_system_metrics():
    """Get system resource metrics"""
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    return {
        "cpu_usage_percent": cpu_percent,
        "memory_used_bytes": memory.used,
        "memory_total_bytes": memory.total,
        "memory_percent": memory.percent,
        "disk_used_bytes": disk.used,
        "disk_total_bytes": disk.total,
        "disk_percent": disk.percent
    }


@router.get("/metrics", response_class=PlainTextResponse)
def prometheus_metrics():
    """
    Prometheus-compatible metrics endpoint
    Returns metrics in Prometheus text format
    """
    sys_metrics = get_system_metrics()
    uptime = time.time() - START_TIME
    
    output = []
    
    # Application metrics
    output.append(f"# HELP kms_requests_total Total number of API requests")
    output.append(f"# TYPE kms_requests_total counter")
    output.append(f'kms_requests_total {metrics["requests_total"]}')
    
    output.append(f"# HELP kms_requests_success_total Total successful requests")
    output.append(f"# TYPE kms_requests_success_total counter")
    output.append(f'kms_requests_success_total {metrics["requests_success"]}')
    
    output.append(f"# HELP kms_requests_error_total Total failed requests")
    output.append(f"# TYPE kms_requests_error_total counter")
    output.append(f'kms_requests_error_total {metrics["requests_error"]}')
    
    # Latency metrics
    avg_latency = metrics["api_latency_sum"] / max(metrics["api_latency_count"], 1)
    output.append(f"# HELP kms_api_latency_avg_ms Average API latency in milliseconds")
    output.append(f"# TYPE kms_api_latency_avg_ms gauge")
    output.append(f"kms_api_latency_avg_ms {avg_latency:.2f}")
    
    # Tool-specific metrics
    output.append(f"# HELP kms_claude_requests_total Total Claude AI requests")
    output.append(f"# TYPE kms_claude_requests_total counter")
    output.append(f'kms_claude_requests_total {metrics["claude_requests_total"]}')
    
    output.append(f"# HELP kms_git_operations_total Total Git operations")
    output.append(f"# TYPE kms_git_operations_total counter")
    output.append(f'kms_git_operations_total {metrics["git_operations_total"]}')
    
    # System metrics
    output.append(f"# HELP kms_cpu_usage_percent CPU usage percentage")
    output.append(f"# TYPE kms_cpu_usage_percent gauge")
    output.append(f'kms_cpu_usage_percent {sys_metrics["cpu_usage_percent"]}')
    
    output.append(f"# HELP kms_memory_used_bytes Memory used in bytes")
    output.append(f"# TYPE kms_memory_used_bytes gauge")
    output.append(f'kms_memory_used_bytes {sys_metrics["memory_used_bytes"]}')
    
    output.append(f"# HELP kms_memory_percent Memory usage percentage")
    output.append(f"# TYPE kms_memory_percent gauge")
    output.append(f'kms_memory_percent {sys_metrics["memory_percent"]}')
    
    output.append(f"# HELP kms_disk_used_bytes Disk used in bytes")
    output.append(f"# TYPE kms_disk_used_bytes gauge")
    output.append(f'kms_disk_used_bytes {sys_metrics["disk_used_bytes"]}')
    
    output.append(f"# HELP kms_disk_percent Disk usage percentage")
    output.append(f"# TYPE kms_disk_percent gauge")
    output.append(f'kms_disk_percent {sys_metrics["disk_percent"]}')
    
    # Uptime
    output.append(f"# HELP kms_uptime_seconds Time since API started")
    output.append(f"# TYPE kms_uptime_seconds gauge")
    output.append(f"kms_uptime_seconds {uptime:.0f}")
    
    return "\n".join(output) + "\n"


@router.get("/health")
def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "uptime_seconds": int(time.time() - START_TIME),
        "version": "2.0.0"
    }

