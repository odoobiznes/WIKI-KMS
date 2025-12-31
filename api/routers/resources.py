"""
Resource Block System API Router
Manages server resources: ports, directories, databases, services, domains, etc.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging
import subprocess
import socket

from database import get_db_cursor

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/resources", tags=["resources"])

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ResourceBase(BaseModel):
    name: str
    value: str
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}

class PortResource(ResourceBase):
    port_protocol: str = "tcp"
    port_binding: str = "127.0.0.1"

class DirectoryResource(ResourceBase):
    path_type: str = "data"  # data, config, logs, backup, code
    path_permissions: Optional[str] = "755"

class DatabaseResource(ResourceBase):
    db_cluster: str = "16-main"
    db_version: str = "16"

class ServiceResource(ResourceBase):
    service_user: str = "devops"

class DomainResource(ResourceBase):
    domain_ssl: bool = False
    domain_cert_path: Optional[str] = None

class ProjectCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    base_path: Optional[str] = None
    owner: str = "devops"
    kms_object_id: Optional[int] = None

class ResourceAllocateRequest(BaseModel):
    project_id: int
    resource_type: str
    name: str
    value: str
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def check_port_in_use(port: int) -> bool:
    """Check if a port is currently in use on the system"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex(('127.0.0.1', port))
        sock.close()
        return result == 0
    except:
        return False

def get_system_ports() -> List[Dict]:
    """Get list of ports currently in use from the system"""
    try:
        result = subprocess.run(
            ["ss", "-tlnp"],
            capture_output=True,
            text=True,
            timeout=10
        )
        ports = []
        for line in result.stdout.split('\n')[1:]:  # Skip header
            if line.strip():
                parts = line.split()
                if len(parts) >= 4:
                    local_addr = parts[3]
                    if ':' in local_addr:
                        port = local_addr.rsplit(':', 1)[-1]
                        try:
                            ports.append(int(port))
                        except ValueError:
                            pass
        return sorted(set(ports))
    except Exception as e:
        logger.error(f"Error getting system ports: {e}")
        return []

# ============================================================================
# PROJECTS ENDPOINTS
# ============================================================================

@router.get("/projects/")
def list_projects(
    status: Optional[str] = None,
    with_resources: bool = False
):
    """List all resource projects"""
    with get_db_cursor() as (cur, conn):
        if with_resources:
            cur.execute("""
                SELECT * FROM v_project_resources
                ORDER BY project_name
            """)
        else:
            query = "SELECT * FROM resource_projects WHERE 1=1"
            params = []

            if status:
                query += " AND status = %s"
                params.append(status)

            query += " ORDER BY name"
            cur.execute(query, params)

        return cur.fetchall()

@router.get("/projects/{project_id}")
def get_project(project_id: int):
    """Get project details with all resources"""
    with get_db_cursor() as (cur, conn):
        cur.execute("SELECT * FROM resource_projects WHERE id = %s", (project_id,))
        project = cur.fetchone()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        cur.execute("""
            SELECT * FROM resources
            WHERE project_id = %s
            ORDER BY resource_type, name
        """, (project_id,))
        resources = cur.fetchall()

        return {
            "project": project,
            "resources": resources,
            "summary": {
                "total": len(resources),
                "by_type": {}
            }
        }

@router.post("/projects/")
def create_project(project: ProjectCreate):
    """Create a new resource project"""
    with get_db_cursor() as (cur, conn):
        try:
            cur.execute("""
                INSERT INTO resource_projects (name, slug, description, base_path, owner, kms_object_id)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (project.name, project.slug, project.description,
                  project.base_path, project.owner, project.kms_object_id))
            new_project = cur.fetchone()
            conn.commit()
            return new_project
        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=400, detail=str(e))

# ============================================================================
# RESOURCES ENDPOINTS
# ============================================================================

@router.get("/")
def list_resources(
    resource_type: Optional[str] = None,
    project_id: Optional[int] = None,
    status: str = "active"
):
    """List all resources with optional filters"""
    with get_db_cursor() as (cur, conn):
        query = """
            SELECT r.*, p.name as project_name, p.slug as project_slug
            FROM resources r
            LEFT JOIN resource_projects p ON r.project_id = p.id
            WHERE 1=1
        """
        params = []

        if resource_type:
            query += " AND r.resource_type = %s"
            params.append(resource_type)

        if project_id:
            query += " AND r.project_id = %s"
            params.append(project_id)

        if status:
            query += " AND r.status = %s"
            params.append(status)

        query += " ORDER BY r.resource_type, r.value"
        cur.execute(query, params)
        return cur.fetchall()

@router.get("/types/")
def list_resource_types():
    """List available resource types with counts"""
    with get_db_cursor() as (cur, conn):
        cur.execute("""
            SELECT
                resource_type,
                COUNT(*) as count,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count
            FROM resources
            GROUP BY resource_type
            ORDER BY resource_type
        """)
        return cur.fetchall()

@router.get("/ports/")
def list_ports(
    project_id: Optional[int] = None,
    include_system: bool = False
):
    """List all registered ports"""
    with get_db_cursor() as (cur, conn):
        cur.execute("SELECT * FROM v_active_ports")
        db_ports = cur.fetchall()

        result = {
            "registered_ports": db_ports,
            "count": len(db_ports)
        }

        if include_system:
            system_ports = get_system_ports()
            registered_values = [p['port'] for p in db_ports]
            unregistered = [p for p in system_ports if p not in registered_values]
            result["system_ports"] = system_ports
            result["unregistered_ports"] = unregistered

        return result

@router.get("/ports/available/")
def get_available_ports(
    start: int = Query(8100, ge=1024, le=65535),
    end: int = Query(9000, ge=1024, le=65535),
    count: int = Query(10, ge=1, le=100)
):
    """Get available ports in a range"""
    with get_db_cursor() as (cur, conn):
        # Get registered ports in range
        cur.execute("""
            SELECT value::integer as port FROM resources
            WHERE resource_type = 'port'
              AND status IN ('active', 'reserved')
              AND value::integer >= %s AND value::integer <= %s
        """, (start, end))
        registered = {row['port'] for row in cur.fetchall()}

        # Find available ports
        truly_available = []
        for port in range(start, end + 1):
            if port not in registered and not check_port_in_use(port):
                truly_available.append(port)
                if len(truly_available) >= count:
                    break

        return {
            "available_ports": truly_available,
            "range": {"start": start, "end": end},
            "requested": count,
            "found": len(truly_available)
        }

@router.get("/ports/next/")
def get_next_available_port(
    start: int = Query(8100, ge=1024, le=65535),
    end: int = Query(9000, ge=1024, le=65535)
):
    """Get the next available port in a range"""
    with get_db_cursor() as (cur, conn):
        cur.execute("SELECT get_next_available_port(%s, %s) as port", (start, end))
        result = cur.fetchone()

        if result and result['port']:
            port = result['port']
            # Verify it's actually free
            if check_port_in_use(port):
                return {"error": "Port appears in use on system", "port": port}
            return {"port": port, "status": "available"}

        return {"error": "No available ports in range", "range": {"start": start, "end": end}}

@router.get("/directories/")
def list_directories(project_id: Optional[int] = None):
    """List all registered directories"""
    with get_db_cursor() as (cur, conn):
        cur.execute("SELECT * FROM v_active_directories")
        return cur.fetchall()

@router.get("/databases/")
def list_databases():
    """List all registered databases"""
    with get_db_cursor() as (cur, conn):
        cur.execute("SELECT * FROM v_active_databases")
        return cur.fetchall()

@router.get("/services/")
def list_services():
    """List all registered systemd services"""
    with get_db_cursor() as (cur, conn):
        cur.execute("""
            SELECT r.*, p.name as project_name
            FROM resources r
            LEFT JOIN resource_projects p ON r.project_id = p.id
            WHERE r.resource_type = 'systemd' AND r.status = 'active'
            ORDER BY r.value
        """)
        return cur.fetchall()

@router.get("/domains/")
def list_domains():
    """List all registered domains"""
    with get_db_cursor() as (cur, conn):
        cur.execute("""
            SELECT r.*, p.name as project_name
            FROM resources r
            LEFT JOIN resource_projects p ON r.project_id = p.id
            WHERE r.resource_type = 'domain' AND r.status = 'active'
            ORDER BY r.value
        """)
        return cur.fetchall()

# ============================================================================
# RESOURCE ALLOCATION
# ============================================================================

@router.post("/allocate/")
def allocate_resource(request: ResourceAllocateRequest):
    """Allocate a new resource"""
    with get_db_cursor() as (cur, conn):
        try:
            # Check availability
            cur.execute("SELECT is_resource_available(%s, %s) as available",
                       (request.resource_type, request.value))
            result = cur.fetchone()

            if not result['available']:
                raise HTTPException(
                    status_code=409,
                    detail=f"Resource {request.value} of type {request.resource_type} is already in use"
                )

            # For ports, also check system
            if request.resource_type == 'port':
                try:
                    port = int(request.value)
                    if check_port_in_use(port):
                        raise HTTPException(
                            status_code=409,
                            detail=f"Port {port} is in use on the system but not registered"
                        )
                except ValueError:
                    raise HTTPException(status_code=400, detail="Invalid port number")

            # Allocate
            cur.execute("""
                SELECT allocate_resource(%s, %s, %s, %s, %s) as id
            """, (request.project_id, request.resource_type, request.name,
                  request.value, request.description))
            new_id = cur.fetchone()['id']

            conn.commit()

            # Return the created resource
            cur.execute("SELECT * FROM resources WHERE id = %s", (new_id,))
            return cur.fetchone()

        except HTTPException:
            raise
        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=400, detail=str(e))

@router.post("/release/{resource_id}")
def release_resource(resource_id: int):
    """Release a resource back to available pool"""
    with get_db_cursor() as (cur, conn):
        try:
            cur.execute("SELECT release_resource(%s) as success", (resource_id,))
            result = cur.fetchone()
            conn.commit()

            if result['success']:
                return {"message": "Resource released successfully", "id": resource_id}
            else:
                raise HTTPException(status_code=404, detail="Resource not found")
        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=400, detail=str(e))

# ============================================================================
# VALIDATION & CHECKS
# ============================================================================

@router.get("/check/{resource_type}/{value}")
def check_resource_availability(resource_type: str, value: str):
    """Check if a specific resource is available"""
    with get_db_cursor() as (cur, conn):
        cur.execute("SELECT is_resource_available(%s, %s) as available",
                   (resource_type, value))
        result = cur.fetchone()

        response = {
            "resource_type": resource_type,
            "value": value,
            "available": result['available']
        }

        # For ports, also check system
        if resource_type == 'port':
            try:
                port = int(value)
                system_in_use = check_port_in_use(port)
                response["system_in_use"] = system_in_use
                if result['available'] and system_in_use:
                    response["warning"] = "Port is not registered but is in use on system"
                    response["available"] = False
            except ValueError:
                pass

        return response

@router.get("/conflicts/")
def check_conflicts():
    """Check for resource conflicts (system vs registered)"""
    with get_db_cursor() as (cur, conn):
        conflicts = []

        # Check ports
        system_ports = get_system_ports()
        cur.execute("SELECT value::integer as port, name, project_id FROM resources WHERE resource_type = 'port' AND status = 'active'")
        registered_ports = {row['port']: row for row in cur.fetchall()}

        # Ports in system but not registered
        for port in system_ports:
            if port not in registered_ports:
                conflicts.append({
                    "type": "unregistered_port",
                    "value": port,
                    "message": f"Port {port} is in use but not registered"
                })

        # Ports registered but not in system
        for port, info in registered_ports.items():
            if port not in system_ports and not check_port_in_use(port):
                conflicts.append({
                    "type": "stale_registration",
                    "value": port,
                    "name": info['name'],
                    "message": f"Port {port} is registered but not in use"
                })

        return {
            "conflicts": conflicts,
            "total_conflicts": len(conflicts),
            "checked_at": "now"
        }

# ============================================================================
# PORT RANGES
# ============================================================================

@router.get("/port-ranges/")
def list_port_ranges():
    """List defined port ranges"""
    with get_db_cursor() as (cur, conn):
        cur.execute("""
            SELECT pr.*,
                   (SELECT COUNT(*) FROM resources r
                    WHERE r.resource_type = 'port'
                      AND r.value::integer >= pr.start_port
                      AND r.value::integer <= pr.end_port
                      AND r.status = 'active') as used_ports
            FROM port_ranges pr
            ORDER BY start_port
        """)
        return cur.fetchall()

# ============================================================================
# HISTORY
# ============================================================================

@router.get("/history/")
def get_resource_history(
    resource_id: Optional[int] = None,
    limit: int = Query(50, ge=1, le=500)
):
    """Get resource allocation history"""
    with get_db_cursor() as (cur, conn):
        query = """
            SELECT rh.*, r.name as resource_name, r.resource_type
            FROM resource_history rh
            LEFT JOIN resources r ON rh.resource_id = r.id
            WHERE 1=1
        """
        params = []

        if resource_id:
            query += " AND rh.resource_id = %s"
            params.append(resource_id)

        query += " ORDER BY rh.created_at DESC LIMIT %s"
        params.append(limit)

        cur.execute(query, params)
        return cur.fetchall()

# ============================================================================
# SUMMARY
# ============================================================================

@router.get("/summary/")
def get_resources_summary():
    """Get overall resources summary"""
    with get_db_cursor() as (cur, conn):
        # Total counts by type
        cur.execute("""
            SELECT
                resource_type,
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
                COUNT(CASE WHEN status = 'reserved' THEN 1 END) as reserved,
                COUNT(CASE WHEN status = 'available' THEN 1 END) as available
            FROM resources
            GROUP BY resource_type
            ORDER BY resource_type
        """)
        by_type = cur.fetchall()

        # Project summary
        cur.execute("SELECT * FROM v_project_resources")
        projects = cur.fetchall()

        # Port ranges
        cur.execute("SELECT COUNT(*) as count FROM port_ranges")
        port_ranges = cur.fetchone()['count']

        # Recent history
        cur.execute("""
            SELECT action, COUNT(*) as count
            FROM resource_history
            WHERE created_at > NOW() - INTERVAL '7 days'
            GROUP BY action
        """)
        recent_activity = cur.fetchall()

        return {
            "resources_by_type": by_type,
            "projects": projects,
            "port_ranges_defined": port_ranges,
            "recent_activity": recent_activity
        }
