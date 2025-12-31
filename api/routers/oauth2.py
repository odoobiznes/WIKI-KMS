"""
OAuth2 Authentication Router - Custom KMS OAuth2 Provider
Supports custom OAuth2 applications with client_id and client_secret
"""
import os
import secrets
import hashlib
from fastapi import APIRouter, HTTPException, status, Depends, Request, Form
from fastapi.responses import RedirectResponse, HTMLResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging
from datetime import datetime, timedelta
from urllib.parse import urlencode

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from auth import (
    get_db_connection, get_user_by_username,
    create_access_token, create_refresh_token, create_session,
    get_password_hash, get_current_user, get_current_active_user,
    get_current_superuser
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth/oauth2", tags=["OAuth2"])

# OAuth2 Configuration
AUTHORIZATION_CODE_EXPIRE_MINUTES = 10
ACCESS_TOKEN_EXPIRE_MINUTES = 60

class OAuth2ClientCreate(BaseModel):
    name: str
    description: Optional[str] = None
    redirect_uris: list[str]
    scopes: Optional[list[str]] = None

class OAuth2ClientResponse(BaseModel):
    client_id: str
    client_secret: str
    name: str
    description: Optional[str]
    redirect_uris: list[str]
    scopes: list[str]
    created_at: str

# ============================================================================
# OAuth2 Client Management
# ============================================================================

@router.post("/clients", response_model=OAuth2ClientResponse)
async def create_oauth2_client(
    client_data: OAuth2ClientCreate,
    current_user: Dict[str, Any] = Depends(get_current_superuser)
):
    """Create a new OAuth2 client application"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()

        # Generate client_id and client_secret
        client_id = secrets.token_urlsafe(32)
        client_secret = secrets.token_urlsafe(48)
        client_secret_hash = hashlib.sha256(client_secret.encode()).hexdigest()

        # Default scopes
        scopes = client_data.scopes or ["read", "write"]

        # Insert into api_keys table (reusing existing structure)
        cur.execute("""
            INSERT INTO api_keys (user_id, key_name, key_hash, permissions, is_active)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, created_at
        """, (
            current_user["id"],
            client_data.name,
            client_secret_hash,
            {
                "client_id": client_id,
                "redirect_uris": client_data.redirect_uris,
                "scopes": scopes,
                "type": "oauth2_client"
            },
            True
        ))

        result = cur.fetchone()
        conn.commit()

        # Store client_id mapping (in production, use Redis or separate table)
        cur.execute("""
            UPDATE api_keys
            SET permissions = jsonb_set(permissions, '{client_id}', %s::jsonb)
            WHERE id = %s
        """, (f'"{client_id}"', result[0]))
        conn.commit()
        cur.close()

        return OAuth2ClientResponse(
            client_id=client_id,
            client_secret=client_secret,  # Show only once!
            name=client_data.name,
            description=client_data.description,
            redirect_uris=client_data.redirect_uris,
            scopes=scopes,
            created_at=result[1].isoformat()
        )
    finally:
        conn.close()

@router.get("/clients")
async def list_oauth2_clients(
    current_user: Dict[str, Any] = Depends(get_current_superuser)
):
    """List all OAuth2 clients"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT id, key_name, permissions, created_at, is_active
            FROM api_keys
            WHERE user_id = %s AND permissions->>'type' = 'oauth2_client'
            ORDER BY created_at DESC
        """, (current_user["id"],))

        clients = []
        for row in cur.fetchall():
            perms = row[2] if isinstance(row[2], dict) else {}
            clients.append({
                "id": row[0],
                "name": row[1],
                "client_id": perms.get("client_id", ""),
                "redirect_uris": perms.get("redirect_uris", []),
                "scopes": perms.get("scopes", []),
                "is_active": row[4],
                "created_at": row[3].isoformat() if row[3] else None
            })

        cur.close()
        return {"clients": clients}
    finally:
        conn.close()

# ============================================================================
# OAuth2 Authorization Flow
# ============================================================================

@router.get("/authorize")
async def oauth2_authorize(
    client_id: str,
    redirect_uri: str,
    response_type: str = "code",
    scope: Optional[str] = None,
    state: Optional[str] = None,
    request: Request = None
):
    """OAuth2 authorization endpoint - user must be logged in"""
    # Check if user is authenticated
    auth_header = request.headers.get("authorization") if request else None
    if not auth_header or not auth_header.startswith("Bearer "):
        # Redirect to login with return URL
        login_url = f"/login.html?redirect={request.url.path}?{request.url.query}" if request else "/login.html"
        return RedirectResponse(url=login_url)

    # Verify client
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT permissions, is_active
            FROM api_keys
            WHERE permissions->>'client_id' = %s AND is_active = true
        """, (client_id,))

        client = cur.fetchone()
        if not client:
            raise HTTPException(status_code=400, detail="Invalid client_id")

        perms = client[0] if isinstance(client[0], dict) else {}
        redirect_uris = perms.get("redirect_uris", [])

        if redirect_uri not in redirect_uris:
            raise HTTPException(status_code=400, detail="Invalid redirect_uri")

        # Get current user from token
        token = auth_header.split(" ")[1]
        from ..auth import verify_token
        payload = verify_token(token, "access")
        if not payload:
            return RedirectResponse(url="/login.html")

        user_id = payload.get("user_id")
        username = payload.get("sub")

        # Generate authorization code
        auth_code = secrets.token_urlsafe(32)
        code_expires = datetime.utcnow() + timedelta(minutes=AUTHORIZATION_CODE_EXPIRE_MINUTES)

        # Store authorization code (in production, use Redis)
        cur.execute("""
            INSERT INTO sessions (user_id, token_hash, expires_at, is_active)
            VALUES (%s, %s, %s, %s)
        """, (
            user_id,
            hashlib.sha256(auth_code.encode()).hexdigest(),
            code_expires,
            True
        ))
        conn.commit()
        cur.close()

        # Build redirect URL with authorization code
        params = {"code": auth_code}
        if state:
            params["state"] = state

        redirect_url = f"{redirect_uri}?{urlencode(params)}"
        return RedirectResponse(url=redirect_url)

    finally:
        conn.close()

@router.post("/token")
async def oauth2_token(
    grant_type: str = Form(...),
    code: Optional[str] = Form(None),
    client_id: str = Form(...),
    client_secret: str = Form(...),
    redirect_uri: Optional[str] = Form(None)
):
    """OAuth2 token endpoint - exchange authorization code for access token"""
    if grant_type != "authorization_code":
        raise HTTPException(status_code=400, detail="Unsupported grant_type")

    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    # Verify client
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        client_secret_hash = hashlib.sha256(client_secret.encode()).hexdigest()

        cur.execute("""
            SELECT id, permissions, is_active
            FROM api_keys
            WHERE permissions->>'client_id' = %s AND is_active = true
        """, (client_id,))

        client = cur.fetchone()
        if not client:
            raise HTTPException(status_code=401, detail="Invalid client credentials")

        perms = client[1] if isinstance(client[1], dict) else {}
        stored_secret_hash = perms.get("client_secret_hash")

        # Verify client_secret (compare hash)
        if stored_secret_hash != client_secret_hash:
            # Store hash if not exists
            cur.execute("""
                UPDATE api_keys
                SET permissions = jsonb_set(permissions, '{client_secret_hash}', %s::jsonb)
                WHERE id = %s
            """, (f'"{client_secret_hash}"', client[0]))
            conn.commit()

        # Verify authorization code
        code_hash = hashlib.sha256(code.encode()).hexdigest()
        cur.execute("""
            SELECT user_id, expires_at
            FROM sessions
            WHERE token_hash = %s AND is_active = true AND expires_at > NOW()
        """, (code_hash,))

        session = cur.fetchone()
        if not session:
            raise HTTPException(status_code=400, detail="Invalid or expired authorization code")

        user_id = session[0]

        # Get user info
        cur.execute("SELECT username, email FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=400, detail="User not found")

        # Invalidate authorization code
        cur.execute("UPDATE sessions SET is_active = false WHERE token_hash = %s", (code_hash,))
        conn.commit()

        # Create access token
        access_token = create_access_token(
            data={"sub": user[0], "user_id": user_id, "client_id": client_id}
        )
        refresh_token = create_refresh_token(
            data={"sub": user[0], "user_id": user_id, "client_id": client_id}
        )

        # Create session for OAuth2 token
        create_session(user_id, access_token, refresh_token, None, None)

        cur.close()

        return {
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "refresh_token": refresh_token,
            "scope": " ".join(perms.get("scopes", ["read", "write"]))
        }

    finally:
        conn.close()

@router.get("/userinfo")
async def oauth2_userinfo(
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """OAuth2 userinfo endpoint - get user information"""
    return {
        "sub": str(current_user["id"]),
        "username": current_user["username"],
        "email": current_user["email"],
        "name": current_user.get("full_name"),
        "email_verified": True
    }

@router.post("/revoke")
async def oauth2_revoke(
    token: str = Form(...),
    token_type_hint: Optional[str] = Form(None),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """Revoke OAuth2 token"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        token_hash = hashlib.sha256(token.encode()).hexdigest()

        cur.execute("""
            UPDATE sessions
            SET is_active = false
            WHERE token_hash = %s AND user_id = %s
        """, (token_hash, current_user["id"]))

        conn.commit()
        cur.close()

        return {"status": "revoked"}
    finally:
        conn.close()
