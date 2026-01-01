"""
Resource Management API Router
Centralized system resource allocation and conflict prevention

Author: Odoo Biznes <odoo@biznes.cz>
Date: 2025-12-31
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from psycopg2.extras import RealDictCursor, Json
import logging

from database import get_db_connection
from auth import get_current_active_user

router = APIRouter(prefix="/resources", tags=["resources"])
logger = logging.getLogger(__name__)

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ResourceType:
    """Available resource types"""
    PORT = "port"
    IP_ADDRESS = "ip_address"
    DIRECTORY = "directory"
    TMPFS = "tmpfs"
    DATABASE = "database"
    DB_USER = "db_user"
    SYSTEMD = "systemd"
    DOMAIN = "domain"
    SSL_CERT = "ssl_cert"
    API_KEY = "api_key"
    CRON_JOB = "cron_job"
    USER = "user"
    ENV_VAR = "env_var"
    SOCKET = "socket"
    REDIS_DB = "redis_db"
    BACKUP_PATH = "backup_path"
    LOG_PATH = "log_path"
    NGINX_CONF = "nginx_conf"
    SECRET = "secret"
    OTHER = "other"

class ResourceCreate(BaseModel):
    resource_type: str = Field(..., description="Type of resource")
    resource_name: str = Field(..., max_length=500, description="Human-readable name")
    resource_value: str = Field(..., description="Actual value (port, path, etc.)")
    owner_service: Optional[str] = Field(None, max_length=200, description="Owning service/project")
    assigned_to: Optional[str] = Field(None, max_length=200, description="Assigned to")
    description: Optional[str] = None
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    environment: Optional[str] = Field("production", max_length=50)
    server_hostname: Optional[str] = None
    min_value: Optional[int] = None
    max_value: Optional[int] = None
    expires_at: Optional[datetime] = None

class ResourceResponse(BaseModel):
    id: int
    resource_type: str
    resource_name: str
    resource_value: str
    owner_user_id: Optional[int]
    owner_service: Optional[str]
    assigned_to: Optional[str]
    status: str
    is_locked: bool
    server_hostname: Optional[str]
    environment: str
    metadata: Dict[str, Any]
    description: Optional[str]
    notes: Optional[str]
    allocated_at: datetime
    created_at: datetime
    updated_at: datetime

class ResourceUpdate(BaseModel):
    resource_name: Optional[str] = None
    assigned_to: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    status: Optional[str] = None

class AvailabilityCheck(BaseModel):
    resource_type: str
    resource_value: str
    environment: Optional[str] = "production"

class PortRequest(BaseModel):
    start_port: int = Field(8000, ge=1024, le=65535)
    end_port: int = Field(9000, ge=1024, le=65535)
    count: int = Field(1, ge=1, le=100)
    environment: Optional[str] = "production"

# ============================================================================
# ENDPOINTS - RESOURCE CRUD
# ============================================================================

@router.get("", response_model=List[ResourceResponse])
async def list_resources(
    resource_type: Optional[str] = None,
    status: Optional[str] = None,
    owner_service: Optional[str] = None,
    environment: Optional[str] = None,
    current_user: dict = Depends(get_current_active_user)
):
    """List all system resources with optional filters"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        query = "SELECT * FROM system_resources WHERE 1=1"
        params = []

        if resource_type:
            query += " AND resource_type = %s"
            params.append(resource_type)

        if status:
            query += " AND status = %s"
            params.append(status)

        if owner_service:
            query += " AND owner_service = %s"
            params.append(owner_service)

        if environment:
            query += " AND environment = %s"
            params.append(environment)

        query += " ORDER BY resource_type, resource_name"

        cursor.execute(query, params)
        resources = cursor.fetchall()

        cursor.close()
        conn.close()

        return [dict(r) for r in resources]

    except Exception as e:
        logger.error(f"Error listing resources: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conflicts")
async def get_conflicts(
    include_resolved: bool = False,
    current_user: dict = Depends(get_current_active_user)
):
    """Get list of resource conflicts"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # First, detect any new conflicts
        cursor.execute("SELECT detect_and_log_conflicts() as new_conflicts")
        new_conflicts = cursor.fetchone()['new_conflicts']
        
        if new_conflicts > 0:
            logger.info(f"Detected {new_conflicts} new conflicts")

        # Get conflicts from view
        if include_resolved:
            cursor.execute("""
                SELECT 
                    c.id as conflict_id,
                    c.conflict_type,
                    c.severity,
                    c.detected_at,
                    c.resolved_at,
                    c.resolution_notes,
                    c.auto_detected,
                    c.notified,
                    r1.id as resource_id_1,
                    r1.resource_type::text as resource_type,
                    r1.resource_name as resource_name_1,
                    r1.resource_value as resource_value_1,
                    r1.owner_service as owner_service_1,
                    r1.status::text as status_1,
                    r2.id as resource_id_2,
                    r2.resource_name as resource_name_2,
                    r2.resource_value as resource_value_2,
                    r2.owner_service as owner_service_2,
                    r2.status::text as status_2
                FROM resource_conflicts c
                JOIN system_resources r1 ON c.resource_id_1 = r1.id
                JOIN system_resources r2 ON c.resource_id_2 = r2.id
                ORDER BY 
                    CASE c.severity 
                        WHEN 'critical' THEN 1 
                        WHEN 'high' THEN 2 
                        WHEN 'warning' THEN 3 
                        ELSE 4 
                    END,
                    c.detected_at DESC
            """)
        else:
            cursor.execute("SELECT * FROM v_resource_conflicts")

        conflicts = cursor.fetchall()

        cursor.close()
        conn.close()

        return [dict(c) for c in conflicts]

    except Exception as e:
        logger.error(f"Error getting conflicts: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary")
async def get_summary(
    current_user: dict = Depends(get_current_active_user)
):
    """Get resource allocation summary"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Get summary by resource type
        # Note: resource_status enum values: 'active', 'reserved', 'deprecated', 'available', 'conflict'
        cursor.execute("""
            SELECT
                resource_type,
                COUNT(*) as count,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
                COUNT(CASE WHEN status = 'reserved' THEN 1 END) as reserved_count,
                COUNT(CASE WHEN status = 'deprecated' THEN 1 END) as deprecated_count,
                COUNT(CASE WHEN status = 'available' THEN 1 END) as available_count,
                COUNT(CASE WHEN status = 'conflict' THEN 1 END) as conflict_count
            FROM system_resources
            GROUP BY resource_type
            ORDER BY resource_type
        """)
        summary = cursor.fetchall()

        cursor.close()
        conn.close()

        return [dict(s) for s in summary]

    except Exception as e:
        logger.error(f"Error getting summary: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{resource_id}", response_model=ResourceResponse)
async def get_resource(
    resource_id: int,
    current_user: dict = Depends(get_current_active_user)
):
    """Get specific resource by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute(
            "SELECT * FROM system_resources WHERE id = %s",
            (resource_id,)
        )
        resource = cursor.fetchone()

        cursor.close()
        conn.close()

        if not resource:
            raise HTTPException(status_code=404, detail="Resource not found")

        return dict(resource)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting resource: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ResourceResponse)
async def create_resource(
    resource: ResourceCreate,
    current_user: dict = Depends(get_current_active_user),
    request: Request = None
):
    """
    Allocate a new system resource

    Checks for conflicts before creating
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Check if resource is already allocated
        cursor.execute("""
            SELECT id, resource_name, owner_service
            FROM system_resources
            WHERE resource_type = %s
            AND resource_value = %s
            AND environment = %s
            AND status IN ('active', 'reserved')
        """, (resource.resource_type, resource.resource_value, resource.environment))

        existing = cursor.fetchone()
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"Resource {resource.resource_type} '{resource.resource_value}' already allocated to '{existing['owner_service']}'"
            )

        # Get server hostname if not provided
        if not resource.server_hostname:
            import socket
            resource.server_hostname = socket.gethostname()

        # Insert new resource
        cursor.execute("""
            INSERT INTO system_resources (
                resource_type, resource_name, resource_value,
                owner_user_id, owner_service, assigned_to,
                description, notes, metadata, environment,
                server_hostname, min_value, max_value, expires_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING *
        """, (
            resource.resource_type, resource.resource_name, resource.resource_value,
            current_user["id"], resource.owner_service, resource.assigned_to,
            resource.description, resource.notes, Json(resource.metadata), resource.environment,
            resource.server_hostname, resource.min_value, resource.max_value, resource.expires_at
        ))

        new_resource = cursor.fetchone()

        # Log allocation
        ip_address = request.client.host if request else None
        cursor.execute("""
            INSERT INTO resource_allocation_history (
                resource_id, action, new_status, changed_by, ip_address
            ) VALUES (%s, 'allocated', 'active', %s, %s)
        """, (new_resource['id'], current_user["id"], ip_address))

        conn.commit()
        cursor.close()
        conn.close()

        logger.info(f"Resource allocated: {resource.resource_type} {resource.resource_value} by {current_user['username']}")

        return dict(new_resource)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating resource: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{resource_id}", response_model=ResourceResponse)
async def update_resource(
    resource_id: int,
    updates: ResourceUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """Update resource details (not the value itself)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Get current resource
        cursor.execute("SELECT * FROM system_resources WHERE id = %s", (resource_id,))
        resource = cursor.fetchone()

        if not resource:
            raise HTTPException(status_code=404, detail="Resource not found")

        # Check if locked
        if resource['is_locked']:
            raise HTTPException(status_code=403, detail="Resource is locked and cannot be modified")

        # Build update query
        update_fields = []
        update_values = []

        if updates.resource_name:
            update_fields.append("resource_name = %s")
            update_values.append(updates.resource_name)

        if updates.assigned_to:
            update_fields.append("assigned_to = %s")
            update_values.append(updates.assigned_to)

        if updates.description is not None:
            update_fields.append("description = %s")
            update_values.append(updates.description)

        if updates.notes is not None:
            update_fields.append("notes = %s")
            update_values.append(updates.notes)

        if updates.metadata:
            update_fields.append("metadata = %s")
            update_values.append(Json(updates.metadata))

        if updates.status:
            update_fields.append("status = %s")
            update_values.append(updates.status)

        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")

        update_values.append(resource_id)

        cursor.execute(f"""
            UPDATE system_resources
            SET {', '.join(update_fields)}
            WHERE id = %s
            RETURNING *
        """, update_values)

        updated_resource = cursor.fetchone()

        # Log update
        cursor.execute("""
            INSERT INTO resource_allocation_history (
                resource_id, action, changed_by
            ) VALUES (%s, 'modified', %s)
        """, (resource_id, current_user["id"]))

        conn.commit()
        cursor.close()
        conn.close()

        return dict(updated_resource)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating resource: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def release_resource(
    resource_id: int,
    current_user: dict = Depends(get_current_active_user)
):
    """Release a resource (soft delete - marks as released)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Get resource
        cursor.execute("SELECT * FROM system_resources WHERE id = %s", (resource_id,))
        resource = cursor.fetchone()

        if not resource:
            raise HTTPException(status_code=404, detail="Resource not found")

        # Check if locked
        if resource['is_locked']:
            raise HTTPException(status_code=403, detail="Resource is locked and cannot be released")

        # Mark as deprecated (released)
        cursor.execute("""
            UPDATE system_resources
            SET status = 'deprecated', released_at = NOW()
            WHERE id = %s
        """, (resource_id,))

        # Log release
        cursor.execute("""
            INSERT INTO resource_allocation_history (
                resource_id, action, old_status, new_status, changed_by
            ) VALUES (%s, 'released', %s, 'deprecated', %s)
        """, (resource_id, resource['status'], current_user["id"]))

        conn.commit()
        cursor.close()
        conn.close()

        logger.info(f"Resource released: {resource['resource_type']} {resource['resource_value']}")

        return None

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error releasing resource: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINTS - AVAILABILITY & ALLOCATION
# ============================================================================

@router.post("/check-availability")
async def check_availability(
    check: AvailabilityCheck,
    current_user: dict = Depends(get_current_active_user)
):
    """Check if a resource value is available with detailed conflict info"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Use the database function for comprehensive check
        cursor.execute("""
            SELECT * FROM check_resource_conflict(%s::resource_type, %s, %s)
        """, (check.resource_type, check.resource_value, check.environment))

        result = cursor.fetchone()

        cursor.close()
        conn.close()

        if result and result['has_conflict']:
            return {
                "available": False,
                "resource_type": check.resource_type,
                "resource_value": check.resource_value,
                "environment": check.environment,
                "conflict": {
                    "resource_id": result['conflict_resource_id'],
                    "resource_name": result['conflict_resource_name'],
                    "owner_service": result['conflict_owner_service'],
                    "status": result['conflict_status'],
                    "message": result['message']
                }
            }

        return {
            "available": True,
            "resource_type": check.resource_type,
            "resource_value": check.resource_value,
            "environment": check.environment,
            "conflict": None
        }

    except Exception as e:
        logger.error(f"Error checking availability: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/resolve-conflict/{conflict_id}")
async def resolve_conflict(
    conflict_id: int,
    resolution_notes: str = None,
    current_user: dict = Depends(get_current_active_user)
):
    """Mark a conflict as resolved"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            UPDATE resource_conflicts
            SET resolved_at = NOW(),
                resolved_by = %s,
                resolution_notes = %s
            WHERE id = %s
            RETURNING *
        """, (current_user["id"], resolution_notes, conflict_id))

        conflict = cursor.fetchone()

        if not conflict:
            raise HTTPException(status_code=404, detail="Conflict not found")

        conn.commit()
        cursor.close()
        conn.close()

        logger.info(f"Conflict {conflict_id} resolved by {current_user['username']}")

        return dict(conflict)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resolving conflict: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/detect-conflicts")
async def detect_conflicts(
    current_user: dict = Depends(get_current_active_user)
):
    """Manually trigger conflict detection scan"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute("SELECT detect_and_log_conflicts() as new_conflicts")
        result = cursor.fetchone()

        conn.commit()
        cursor.close()
        conn.close()

        return {
            "new_conflicts_detected": result['new_conflicts'],
            "message": f"Scan complete. Found {result['new_conflicts']} new conflicts."
        }

    except Exception as e:
        logger.error(f"Error detecting conflicts: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/find-available-ports")
async def find_available_ports(
    request: PortRequest,
    current_user: dict = Depends(get_current_active_user)
):
    """Find available network ports in given range"""
    try:
        if request.start_port >= request.end_port:
            raise HTTPException(status_code=400, detail="start_port must be less than end_port")

        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Get all allocated ports
        cursor.execute("""
            SELECT resource_value
            FROM system_resources
            WHERE resource_type = 'port'
            AND environment = %s
            AND status IN ('active', 'reserved')
        """, (request.environment,))

        allocated_ports = {int(row['resource_value']) for row in cursor.fetchall()}

        cursor.close()
        conn.close()

        # Find available ports
        available_ports = []
        for port in range(request.start_port, request.end_port + 1):
            if port not in allocated_ports:
                available_ports.append(port)
                if len(available_ports) >= request.count:
                    break

        return {
            "available_ports": available_ports,
            "count": len(available_ports),
            "requested_count": request.count,
            "range": {
                "start": request.start_port,
                "end": request.end_port
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error finding available ports: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINTS - CONFLICTS & REPORTS
# ============================================================================

@router.get("/{resource_id}/history")
async def get_resource_history(
    resource_id: int,
    current_user: dict = Depends(get_current_active_user)
):
    """Get allocation history for a resource"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            SELECT
                rh.*,
                u.username as changed_by_username
            FROM resource_allocation_history rh
            LEFT JOIN users u ON rh.changed_by = u.id
            WHERE rh.resource_id = %s
            ORDER BY rh.created_at DESC
        """, (resource_id,))

        history = cursor.fetchall()

        cursor.close()
        conn.close()

        return [dict(h) for h in history]

    except Exception as e:
        logger.error(f"Error getting resource history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
