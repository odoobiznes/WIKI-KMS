"""
Logins/Credentials Router
Handles credentials management - API keys, SSH keys, passwords, tokens
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import logging
from datetime import datetime
import hashlib

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from auth import get_current_user, get_current_active_user, log_audit_event
from database import get_db_connection
from lib.secrets import SecretsManager
import json
from psycopg2.extras import Json, RealDictCursor

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/logins", tags=["Logins & Credentials"])

# ============================================================================
# Pydantic Models
# ============================================================================

class CredentialCreate(BaseModel):
    key_name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(default="api_key")
    description: Optional[str] = None
    plain_value: str = Field(..., min_length=1)
    connection_info: Optional[Dict[str, Any]] = {}
    tags: Optional[List[str]] = []
    notes: Optional[str] = None
    test_endpoint: Optional[str] = None
    environment: str = Field(default="production")
    expires_at: Optional[datetime] = None
    auto_rotate: bool = False
    rotation_days: Optional[int] = None

class CredentialUpdate(BaseModel):
    key_name: Optional[str] = None
    description: Optional[str] = None
    plain_value: Optional[str] = None
    connection_info: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    test_endpoint: Optional[str] = None
    environment: Optional[str] = None
    expires_at: Optional[datetime] = None
    auto_rotate: Optional[bool] = None
    rotation_days: Optional[int] = None
    is_active: Optional[bool] = None

class CredentialResponse(BaseModel):
    id: int
    user_id: int
    key_name: str
    category: str
    description: Optional[str]
    connection_info: Dict[str, Any]
    tags: List[str]
    notes: Optional[str]
    test_endpoint: Optional[str]
    environment: str
    expires_at: Optional[datetime]
    last_used_at: Optional[datetime]
    is_active: bool
    created_at: datetime
    auto_rotate: bool
    rotation_days: Optional[int]
    revoked_at: Optional[datetime]
    # Audit stats
    decrypt_count: Optional[int] = 0
    last_decrypted_at: Optional[datetime] = None

class DecryptResponse(BaseModel):
    plain_value: str
    credential_id: int
    decrypted_at: datetime

# ============================================================================
# Helper Functions
# ============================================================================

def log_credential_audit(
    credential_id: int,
    user_id: int,
    action: str,
    success: bool = True,
    error_message: Optional[str] = None,
    request: Optional[Request] = None,
    metadata: Optional[Dict] = None
):
    """Log credential access to audit log"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        ip_address = None
        user_agent = None

        if request:
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")

        cursor.execute("""
            INSERT INTO credentials_audit_log
                (credential_id, user_id, action, ip_address, user_agent, success, error_message, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            credential_id, user_id, action,
            ip_address, user_agent,
            success, error_message,
            metadata if metadata else {}
        ))

        conn.commit()
        cursor.close()
        conn.close()

        logger.info(f"Audit: User {user_id} {action} credential {credential_id} - Success: {success}")

    except Exception as e:
        logger.error(f"Failed to log credential audit: {e}", exc_info=True)

# ============================================================================
# CRUD Endpoints
# ============================================================================

@router.get("/credentials", response_model=List[CredentialResponse])
async def list_credentials(
    category: Optional[str] = None,
    environment: Optional[str] = None,
    tags: Optional[str] = None,
    current_user: dict = Depends(get_current_active_user)
):
    """List all credentials for current user"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        query = """
            SELECT
                c.id, c.user_id, c.key_name, c.category, c.description,
                c.connection_info, c.tags, c.notes, c.test_endpoint,
                c.environment, c.expires_at, c.last_used_at, c.is_active,
                c.created_at, c.auto_rotate, c.rotation_days, c.revoked_at,
                (SELECT COUNT(*) FROM credentials_audit_log cal WHERE cal.credential_id = c.id AND cal.action = 'decrypt') as decrypt_count,
                (SELECT MAX(created_at) FROM credentials_audit_log cal WHERE cal.credential_id = c.id AND cal.action = 'decrypt') as last_decrypted_at
            FROM credentials c
            WHERE c.user_id = %s
        """
        params = [current_user["id"]]

        if category:
            query += " AND c.category = %s"
            params.append(category)

        if environment:
            query += " AND c.environment = %s"
            params.append(environment)

        if tags:
            query += " AND %s = ANY(c.tags)"
            params.append(tags)

        query += " ORDER BY c.created_at DESC"

        cursor.execute(query, params)
        credentials = cursor.fetchall()

        cursor.close()
        conn.close()

        return [
            {
                "id": c['id'],
                "user_id": c['user_id'],
                "key_name": c['key_name'],
                "category": c['category'],
                "description": c['description'],
                "connection_info": c['connection_info'] or {},
                "tags": c['tags'] or [],
                "notes": c['notes'],
                "test_endpoint": c['test_endpoint'],
                "environment": c['environment'],
                "expires_at": c['expires_at'],
                "last_used_at": c['last_used_at'],
                "is_active": c['is_active'],
                "created_at": c['created_at'],
                "auto_rotate": c['auto_rotate'],
                "rotation_days": c['rotation_days'],
                "revoked_at": c['revoked_at'],
                "decrypt_count": c['decrypt_count'] or 0,
                "last_decrypted_at": c['last_decrypted_at']
            }
            for c in credentials
        ]

    except Exception as e:
        logger.error(f"Error listing credentials: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/credentials/{credential_id}", response_model=CredentialResponse)
async def get_credential(
    credential_id: int,
    current_user: dict = Depends(get_current_active_user),
    request: Request = None
):
    """Get specific credential by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            SELECT
                c.id, c.user_id, c.key_name, c.category, c.description,
                c.connection_info, c.tags, c.notes, c.test_endpoint,
                c.environment, c.expires_at, c.last_used_at, c.is_active,
                c.created_at, c.auto_rotate, c.rotation_days, c.revoked_at,
                (SELECT COUNT(*) FROM credentials_audit_log cal WHERE cal.credential_id = c.id AND cal.action = 'decrypt') as decrypt_count,
                (SELECT MAX(created_at) FROM credentials_audit_log cal WHERE cal.credential_id = c.id AND cal.action = 'decrypt') as last_decrypted_at
            FROM credentials c
            WHERE c.id = %s AND c.user_id = %s
        """, (credential_id, current_user["id"]))

        credential = cursor.fetchone()

        cursor.close()
        conn.close()

        if not credential:
            raise HTTPException(status_code=404, detail="Credential not found")

        # Log view audit
        log_credential_audit(credential_id, current_user["id"], "view", request=request)

        return {
            "id": credential[0],
            "user_id": credential[1],
            "key_name": credential[2],
            "category": credential[3],
            "description": credential[4],
            "connection_info": credential[5] or {},
            "tags": credential[6] or [],
            "notes": credential[7],
            "test_endpoint": credential[8],
            "environment": credential[9],
            "expires_at": credential[10],
            "last_used_at": credential[11],
            "is_active": credential[12],
            "created_at": credential[13],
            "auto_rotate": credential[14],
            "rotation_days": credential[15],
            "revoked_at": credential[16],
            "decrypt_count": credential[17] or 0,
            "last_decrypted_at": credential[18]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting credential: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/credentials", response_model=CredentialResponse, status_code=status.HTTP_201_CREATED)
async def create_credential(
    credential: CredentialCreate,
    current_user: dict = Depends(get_current_active_user),
    request: Request = None
):
    """Create new credential"""
    try:
        # Encrypt the secret value
        secret_name = f"credentials/{current_user['id']}/{credential.key_name}"
        encrypted_value = SecretsManager.encrypt(credential.plain_value, secret_name)

        # Create hash for uniqueness check
        key_hash = hashlib.sha256(f"{current_user['id']}:{credential.key_name}".encode()).hexdigest()

        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            INSERT INTO credentials
                (user_id, key_name, key_hash, category, description, encrypted_value,
                 connection_info, tags, notes, test_endpoint, environment,
                 expires_at, auto_rotate, rotation_days)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, created_at
        """, (
            current_user["id"], credential.key_name, key_hash,
            credential.category, credential.description, encrypted_value,
            Json(credential.connection_info) if credential.connection_info else Json({}),
            credential.tags if credential.tags else [],
            credential.notes,
            credential.test_endpoint, credential.environment,
            credential.expires_at, credential.auto_rotate, credential.rotation_days
        ))

        result = cursor.fetchone()
        credential_id = result['id']
        created_at = result['created_at']

        conn.commit()
        cursor.close()
        conn.close()

        # Log creation audit
        log_credential_audit(
            credential_id, current_user["id"], "create",
            request=request,
            metadata={"category": credential.category, "key_name": credential.key_name}
        )

        logger.info(f"Credential created: ID={credential_id}, Name={credential.key_name}")

        return {
            "id": credential_id,
            "user_id": current_user["id"],
            "key_name": credential.key_name,
            "category": credential.category,
            "description": credential.description,
            "connection_info": credential.connection_info or {},
            "tags": credential.tags or [],
            "notes": credential.notes,
            "test_endpoint": credential.test_endpoint,
            "environment": credential.environment,
            "expires_at": credential.expires_at,
            "last_used_at": None,
            "is_active": True,
            "created_at": created_at,
            "auto_rotate": credential.auto_rotate,
            "rotation_days": credential.rotation_days,
            "revoked_at": None,
            "decrypt_count": 0,
            "last_decrypted_at": None
        }

    except Exception as e:
        logger.error(f"Error creating credential: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/credentials/{credential_id}", response_model=CredentialResponse)
async def update_credential(
    credential_id: int,
    credential: CredentialUpdate,
    current_user: dict = Depends(get_current_active_user),
    request: Request = None
):
    """Update existing credential"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Verify ownership
        cursor.execute("SELECT id FROM credentials WHERE id = %s AND user_id = %s", (credential_id, current_user["id"]))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Credential not found")

        # Build update query
        updates = []
        params = []

        if credential.key_name is not None:
            updates.append("key_name = %s")
            params.append(credential.key_name)
            # Update key_hash
            key_hash = hashlib.sha256(f"{current_user['id']}:{credential.key_name}".encode()).hexdigest()
            updates.append("key_hash = %s")
            params.append(key_hash)

        if credential.description is not None:
            updates.append("description = %s")
            params.append(credential.description)

        if credential.plain_value is not None:
            # Re-encrypt with new value
            secret_name = f"credentials/{current_user['id']}/{credential.key_name or 'updated'}"
            encrypted_value = SecretsManager.encrypt(credential.plain_value, secret_name)
            updates.append("encrypted_value = %s")
            params.append(encrypted_value)

        if credential.connection_info is not None:
            updates.append("connection_info = %s")
            params.append(Json(credential.connection_info))

        if credential.tags is not None:
            updates.append("tags = %s")
            params.append(credential.tags)

        if credential.notes is not None:
            updates.append("notes = %s")
            params.append(credential.notes)

        if credential.test_endpoint is not None:
            updates.append("test_endpoint = %s")
            params.append(credential.test_endpoint)

        if credential.environment is not None:
            updates.append("environment = %s")
            params.append(credential.environment)

        if credential.expires_at is not None:
            updates.append("expires_at = %s")
            params.append(credential.expires_at)

        if credential.auto_rotate is not None:
            updates.append("auto_rotate = %s")
            params.append(credential.auto_rotate)

        if credential.rotation_days is not None:
            updates.append("rotation_days = %s")
            params.append(credential.rotation_days)

        if credential.is_active is not None:
            updates.append("is_active = %s")
            params.append(credential.is_active)

        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        query = f"UPDATE credentials SET {', '.join(updates)} WHERE id = %s AND user_id = %s"
        params.extend([credential_id, current_user["id"]])

        cursor.execute(query, params)
        conn.commit()

        # Fetch updated credential
        cursor.execute("""
            SELECT
                id, user_id, key_name, category, description,
                connection_info, tags, notes, test_endpoint,
                environment, expires_at, last_used_at, is_active,
                created_at, auto_rotate, rotation_days, revoked_at
            FROM credentials
            WHERE id = %s
        """, (credential_id,))

        updated = cursor.fetchone()

        cursor.close()
        conn.close()

        # Log update audit
        log_credential_audit(
            credential_id, current_user["id"], "update",
            request=request,
            metadata={"updated_fields": list(credential.dict(exclude_unset=True).keys())}
        )

        logger.info(f"Credential updated: ID={credential_id}")

        return {
            "id": updated[0],
            "user_id": updated[1],
            "key_name": updated[2],
            "category": updated[3],
            "description": updated[4],
            "connection_info": updated[5] or {},
            "tags": updated[6] or [],
            "notes": updated[7],
            "test_endpoint": updated[8],
            "environment": updated[9],
            "expires_at": updated[10],
            "last_used_at": updated[11],
            "is_active": updated[12],
            "created_at": updated[13],
            "auto_rotate": updated[14],
            "rotation_days": updated[15],
            "revoked_at": updated[16],
            "decrypt_count": 0,
            "last_decrypted_at": None
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating credential: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/credentials/{credential_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_credential(
    credential_id: int,
    current_user: dict = Depends(get_current_active_user),
    request: Request = None
):
    """Delete credential"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Verify ownership and get credential info
        cursor.execute("SELECT key_name FROM credentials WHERE id = %s AND user_id = %s", (credential_id, current_user["id"]))
        credential = cursor.fetchone()

        if not credential:
            raise HTTPException(status_code=404, detail="Credential not found")

        # Delete from database (audit log will cascade)
        cursor.execute("DELETE FROM credentials WHERE id = %s AND user_id = %s", (credential_id, current_user["id"]))

        conn.commit()
        cursor.close()
        conn.close()

        # Log deletion audit
        log_credential_audit(
            credential_id, current_user["id"], "delete",
            request=request,
            metadata={"key_name": credential[0]}
        )

        logger.info(f"Credential deleted: ID={credential_id}")

        return None

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting credential: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# Special Operations
# ============================================================================

@router.post("/credentials/{credential_id}/decrypt", response_model=DecryptResponse)
async def decrypt_credential(
    credential_id: int,
    current_user: dict = Depends(get_current_active_user),
    request: Request = None
):
    """Decrypt and return plain text secret (DANGEROUS - use carefully!)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Get credential
        cursor.execute("""
            SELECT encrypted_value, key_name, category, is_active
            FROM credentials
            WHERE id = %s AND user_id = %s
        """, (credential_id, current_user["id"]))

        credential = cursor.fetchone()

        if not credential:
            log_credential_audit(credential_id, current_user["id"], "decrypt", success=False, error_message="Not found", request=request)
            raise HTTPException(status_code=404, detail="Credential not found")

        encrypted_value, key_name, category, is_active = credential

        if not is_active:
            log_credential_audit(credential_id, current_user["id"], "decrypt", success=False, error_message="Credential inactive", request=request)
            raise HTTPException(status_code=403, detail="Credential is inactive")

        # Decrypt
        secret_name = f"credentials/{current_user['id']}/{key_name}"
        plain_value = SecretsManager.decrypt(encrypted_value, secret_name)

        # Update last_used_at
        cursor.execute("UPDATE credentials SET last_used_at = NOW() WHERE id = %s", (credential_id,))
        conn.commit()

        cursor.close()
        conn.close()

        # Log successful decrypt
        log_credential_audit(credential_id, current_user["id"], "decrypt", request=request)

        logger.warning(f"Credential decrypted: ID={credential_id} by user {current_user['id']}")

        return {
            "plain_value": plain_value,
            "credential_id": credential_id,
            "decrypted_at": datetime.now()
        }

    except HTTPException:
        raise
    except Exception as e:
        log_credential_audit(credential_id, current_user["id"], "decrypt", success=False, error_message=str(e), request=request)
        logger.error(f"Error decrypting credential: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/credentials/{credential_id}/test")
async def test_credential(
    credential_id: int,
    current_user: dict = Depends(get_current_active_user),
    request: Request = None
):
    """Test credential connection"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Get credential
        cursor.execute("""
            SELECT encrypted_value, key_name, category, connection_info, is_active
            FROM credentials
            WHERE id = %s AND user_id = %s
        """, (credential_id, current_user["id"]))

        credential = cursor.fetchone()

        if not credential:
            raise HTTPException(status_code=404, detail="Credential not found")

        encrypted_value, key_name, category, connection_info, is_active = credential

        if not is_active:
            raise HTTPException(status_code=403, detail="Credential is inactive")

        # Decrypt
        secret_name = f"credentials/{current_user['id']}/{key_name}"
        plain_value = SecretsManager.decrypt(encrypted_value, secret_name)

        # Test connection
        test_result = SecretsManager.test_connection(category, connection_info or {}, plain_value)

        cursor.close()
        conn.close()

        # Log test attempt
        log_credential_audit(
            credential_id, current_user["id"], "test",
            success=test_result["success"],
            error_message=test_result.get("message") if not test_result["success"] else None,
            request=request
        )

        logger.info(f"Credential test: ID={credential_id}, Success={test_result['success']}")

        return test_result

    except HTTPException:
        raise
    except Exception as e:
        log_credential_audit(credential_id, current_user["id"], "test", success=False, error_message=str(e), request=request)
        logger.error(f"Error testing credential: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# Utility Endpoints
# ============================================================================

@router.get("/categories")
async def list_categories(current_user: dict = Depends(get_current_active_user)):
    """List available credential categories"""
    return {
        "categories": [
            {"value": "api_key", "label": "API Keys", "icon": "fa-key"},
            {"value": "ssh_key", "label": "SSH Keys", "icon": "fa-server"},
            {"value": "database", "label": "Database Passwords", "icon": "fa-database"},
            {"value": "oauth_token", "label": "OAuth Tokens", "icon": "fa-lock"},
            {"value": "ssl_cert", "label": "SSL Certificates", "icon": "fa-certificate"},
            {"value": "service_credential", "label": "Service Credentials", "icon": "fa-cog"}
        ]
    }

@router.get("/audit/{credential_id}")
async def get_credential_audit_log(
    credential_id: int,
    limit: int = 50,
    current_user: dict = Depends(get_current_active_user)
):
    """Get audit log for specific credential"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Verify ownership
        cursor.execute("SELECT id FROM credentials WHERE id = %s AND user_id = %s", (credential_id, current_user["id"]))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Credential not found")

        # Get audit log
        cursor.execute("""
            SELECT id, action, ip_address, user_agent, success, error_message, metadata, created_at
            FROM credentials_audit_log
            WHERE credential_id = %s
            ORDER BY created_at DESC
            LIMIT %s
        """, (credential_id, limit))

        logs = cursor.fetchall()

        cursor.close()
        conn.close()

        return {
            "credential_id": credential_id,
            "audit_entries": [
                {
                    "id": log[0],
                    "action": log[1],
                    "ip_address": str(log[2]) if log[2] else None,
                    "user_agent": log[3],
                    "success": log[4],
                    "error_message": log[5],
                    "metadata": log[6],
                    "created_at": log[7]
                }
                for log in logs
            ]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting audit log: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
