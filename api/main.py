"""
KMS FastAPI Application
Main entry point for the Knowledge Management System API
"""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import time
import logging
import sys

# Configure logging - respects DEBUG env var
import os
LOG_LEVEL = logging.DEBUG if os.getenv("DEBUG", "false").lower() == "true" else logging.INFO

logging.basicConfig(
    level=LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('/tmp/kms-api-debug.log')
    ]
)
logger = logging.getLogger(__name__)

logger.info("=" * 80)
logger.info("KMS API Starting Up")
logger.info("=" * 80)

from routers import categories, subcategories, objects, documents, search, system, tools, resources, auth, oauth2, metrics, logins, resources_mgmt

logger.info("All routers imported successfully")

# Create FastAPI application
app = FastAPI(
    title="KMS API",
    description="Knowledge Management System REST API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Configure CORS - Production ready
import os
ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "https://kms.it-enterprise.solutions,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Authentication middleware - protect all endpoints except auth and public
@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    # Allow public endpoints
    public_paths = [
        "/api/auth/login",
        "/api/auth/refresh",
        "/api/docs",
        "/api/openapi.json",
        "/api/redoc",
        "/",
        "/api",
        "/api/system/health"  # Health check should be public
    ]

    # Allow OPTIONS for CORS
    if request.method == "OPTIONS":
        return await call_next(request)

    # Check if path is public (exact match or starts with)
    path = request.url.path

    # Special handling for /api - allow it but check auth for sub-paths
    if path == "/api" or path == "/":
        return await call_next(request)

    is_public = any(
        path == public_path or path.startswith(public_path + "/")
        for public_path in public_paths
    )

    if is_public:
        return await call_next(request)

    # For /api/* paths (except auth and public), require authentication
    if path.startswith("/api/") and not path.startswith("/api/auth/") and path != "/api/docs" and not path.startswith("/api/openapi") and not path.startswith("/api/redoc") and path != "/api/system/health":
        # Check for authentication token
        auth_header = request.headers.get("authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            logger.warning(f"Unauthorized access attempt: {request.method} {path} from {request.client.host if request.client else 'unknown'}")
            return JSONResponse(
                status_code=401,
                content={"error": "Unauthorized", "detail": "Authentication required"}
            )

        # Basic token validation (full validation happens in dependencies)
        try:
            from api.auth import verify_token
            token = auth_header.split(" ")[1] if len(auth_header.split(" ")) > 1 else ""
            if token:
                payload = verify_token(token, "access")
                if not payload:
                    logger.warning(f"Invalid token for: {request.method} {path}")
                    return JSONResponse(
                        status_code=401,
                        content={"error": "Unauthorized", "detail": "Invalid or expired token"}
                    )
        except Exception as e:
            logger.error(f"Token validation error: {e}")
            return JSONResponse(
                status_code=401,
                content={"error": "Unauthorized", "detail": "Token validation failed"}
            )

    # Continue with request
    return await call_next(request)

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    logger.debug(f"→ REQUEST: {request.method} {request.url.path} - Client: {request.client.host if request.client else 'unknown'}")
    logger.debug(f"  Headers: {dict(request.headers)}")

    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        logger.info(f"← RESPONSE: {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.3f}s")
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"✗ ERROR in middleware: {request.method} {request.url.path} - {type(e).__name__}: {str(e)}", exc_info=True)
        raise

# Exception handlers
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    logger.warning(f"404 Not Found: {request.url.path} - {str(exc)}")
    return JSONResponse(
        status_code=404,
        content={"error": "Not Found", "detail": str(exc)}
    )

@app.exception_handler(500)
async def server_error_handler(request: Request, exc):
    logger.error(f"500 Internal Server Error: {request.url.path} - {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "detail": str(exc)}
    )

# Include routers
logger.info("Registering API routers...")
try:
    # Auth router (no prefix, handles /api/auth/*)
    app.include_router(auth.router, prefix="/api")
    logger.debug("  ✓ Auth router registered")
    # OAuth2 router
    app.include_router(oauth2.router, prefix="/api")
    logger.debug("  ✓ OAuth2 router registered")
    app.include_router(categories.router, prefix="/api")
    logger.debug("  ✓ Categories router registered")
    app.include_router(subcategories.router, prefix="/api")
    logger.debug("  ✓ Subcategories router registered")
    app.include_router(objects.router, prefix="/api")
    logger.debug("  ✓ Objects router registered")
    app.include_router(documents.router, prefix="/api")
    logger.debug("  ✓ Documents router registered")
    app.include_router(search.router, prefix="/api")
    logger.debug("  ✓ Search router registered")
    app.include_router(system.router, prefix="/api")
    logger.debug("  ✓ System router registered")
    app.include_router(tools.router, prefix="/api")
    logger.debug("  ✓ Tools router registered")
    app.include_router(resources.router, prefix="/api")
    logger.debug("  ✓ Resources router registered")
    app.include_router(metrics.router, prefix="/api")
    logger.debug("  ✓ Metrics router registered")
    app.include_router(logins.router, prefix="/api")
    logger.debug("  ✓ Logins router registered")
    app.include_router(resources_mgmt.router, prefix="/api")
    logger.debug("  ✓ Resource Management router registered")
    logger.info("All routers registered successfully")
except Exception as e:
    logger.error(f"Failed to register routers: {e}", exc_info=True)
    raise

# Root endpoints
@app.get("/")
def root():
    """API root endpoint"""
    return {
        "name": "KMS API",
        "version": "1.0.0",
        "description": "Knowledge Management System REST API",
        "docs": "/api/docs",
        "health": "/api/system/health"
    }

@app.get("/api")
def api_info():
    """API information"""
    return {
        "endpoints": {
            "categories": "/api/categories",
            "objects": "/api/objects",
            "documents": "/api/documents",
            "search": "/api/search",
            "system": "/api/system",
            "tools": "/api/tools",
            "resources": "/api/resources",
            "health": "/api/system/health",
            "stats": "/api/system/stats",
            "changelog": "/api/system/changelog",
            "sync_status": "/api/system/sync-status"
        },
        "resources_endpoints": {
            "summary": "/api/resources/summary/",
            "projects": "/api/resources/projects/",
            "ports": "/api/resources/ports/",
            "available_ports": "/api/resources/ports/available/",
            "directories": "/api/resources/directories/",
            "databases": "/api/resources/databases/",
            "services": "/api/resources/services/",
            "domains": "/api/resources/domains/",
            "conflicts": "/api/resources/conflicts/",
            "check": "/api/resources/check/{type}/{value}",
            "allocate": "/api/resources/allocate/"
        },
        "documentation": {
            "swagger": "/api/docs",
            "redoc": "/api/redoc",
            "openapi": "/api/openapi.json"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
