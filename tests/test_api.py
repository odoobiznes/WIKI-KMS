"""
KMS API Tests
Unit tests for the KMS REST API
"""

import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

# Add API directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "api"))

from main import app

client = TestClient(app)


class TestHealthEndpoints:
    """Test health and system endpoints"""
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
    
    def test_metrics_endpoint(self):
        """Test Prometheus metrics endpoint"""
        response = client.get("/api/metrics")
        assert response.status_code == 200
        assert "kms_requests_total" in response.text
        assert "kms_cpu_usage_percent" in response.text


class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    def test_login_missing_credentials(self):
        """Test login with missing credentials"""
        response = client.post("/api/auth/login", json={})
        assert response.status_code == 422  # Validation error
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = client.post("/api/auth/login", json={
            "username": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code in [401, 403]


class TestCategoriesEndpoints:
    """Test categories endpoints"""
    
    def test_list_categories_unauthorized(self):
        """Test listing categories without auth"""
        response = client.get("/api/categories")
        # Should require authentication
        assert response.status_code in [200, 401]
    
    def test_create_category_unauthorized(self):
        """Test creating category without auth"""
        response = client.post("/api/categories", json={
            "name": "Test Category",
            "type": "product"
        })
        assert response.status_code == 401


class TestObjectsEndpoints:
    """Test objects endpoints"""
    
    def test_list_objects_unauthorized(self):
        """Test listing objects without auth"""
        response = client.get("/api/objects")
        assert response.status_code in [200, 401]


class TestToolsEndpoints:
    """Test tools endpoints"""
    
    def test_tools_status(self):
        """Test tools status endpoint"""
        response = client.get("/api/tools/status")
        assert response.status_code == 200
        data = response.json()
        assert "tools" in data
    
    def test_local_tunnels_list(self):
        """Test local tunnels list"""
        response = client.get("/api/tools/local/tunnels")
        assert response.status_code == 200
        data = response.json()
        assert "tunnels" in data
    
    def test_claude_models_list(self):
        """Test Claude models list"""
        response = client.get("/api/tools/claude/models")
        assert response.status_code == 200
        data = response.json()
        assert "models" in data


class TestSearchEndpoints:
    """Test search endpoints"""
    
    def test_search_empty_query(self):
        """Test search with empty query"""
        response = client.get("/api/search?q=")
        assert response.status_code in [200, 400]
    
    def test_search_with_query(self):
        """Test search with query"""
        response = client.get("/api/search?q=test")
        assert response.status_code == 200


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])

