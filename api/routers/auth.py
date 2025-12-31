"""
Authentication Router
Handles login, logout, token refresh, and user management
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
import logging

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from auth import (
    authenticate_user, create_access_token, create_refresh_token,
    create_session, get_current_user, get_current_active_user,
    get_current_superuser, get_user_by_username, get_user_by_id,
    get_password_hash, verify_token, hash_token, update_user_last_login,
    log_audit_event, UserLogin, UserCreate, UserResponse, Token
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ============================================================================
# Authentication Endpoints
# ============================================================================

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, request: Request):
    """Login with username and password"""
    try:
        # Authenticate user
        user = authenticate_user(user_data.username, user_data.password)
        if not user:
            log_audit_event(None, "login_failed", details={"username": user_data.username})
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Create tokens
        access_token = create_access_token(
            data={"sub": user["username"], "user_id": user["id"]}
        )
        refresh_token = create_refresh_token(
            data={"sub": user["username"], "user_id": user["id"]}
        )

        # Create session
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        create_session(
            user["id"], access_token, refresh_token, ip_address, user_agent
        )

        # Update last login
        update_user_last_login(user["id"])

        # Log successful login
        log_audit_event(
            user["id"], "login", ip_address=ip_address, user_agent=user_agent
        )

        logger.info(f"User {user['username']} logged in from {ip_address}")

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": 3600  # 1 hour in seconds
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during login"
        )

@router.post("/logout")
async def logout(
    current_user: Dict[str, Any] = Depends(get_current_user),
    request: Request = None
):
    """Logout and invalidate session"""
    try:
        # Get token from request
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            token_hash = hash_token(token)

            # Deactivate session
            from ..auth import get_db_connection
            conn = get_db_connection()
            try:
                cur = conn.cursor()
                cur.execute(
                    "UPDATE sessions SET is_active = false WHERE token_hash = %s",
                    (token_hash,)
                )
                conn.commit()
                cur.close()
            finally:
                conn.close()

            # Log logout
            log_audit_event(
                current_user["id"], "logout",
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent")
            )

            logger.info(f"User {current_user['username']} logged out")

        return {"message": "Successfully logged out"}
    except Exception as e:
        logger.error(f"Logout error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during logout"
        )

@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_token: str, request: Request):
    """Refresh access token using refresh token"""
    try:
        # Verify refresh token
        payload = verify_token(refresh_token, "refresh")
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        username = payload.get("sub")
        user_id = payload.get("user_id")

        if not username or not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )

        # Verify session
        from ..auth import get_db_connection
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT id FROM sessions
                WHERE refresh_token_hash = %s AND is_active = true
                AND refresh_expires_at > NOW()
            """, (hash_token(refresh_token),))
            session = cur.fetchone()
            cur.close()

            if not session:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Refresh token expired or invalid",
                )
        finally:
            conn.close()

        # Create new tokens
        new_access_token = create_access_token(
            data={"sub": username, "user_id": user_id}
        )
        new_refresh_token = create_refresh_token(
            data={"sub": username, "user_id": user_id}
        )

        # Update session
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("""
                UPDATE sessions
                SET token_hash = %s, refresh_token_hash = %s,
                    expires_at = NOW() + INTERVAL '1 hour',
                    refresh_expires_at = NOW() + INTERVAL '30 days',
                    last_used_at = NOW()
                WHERE refresh_token_hash = %s
            """, (
                hash_token(new_access_token),
                hash_token(new_refresh_token),
                hash_token(refresh_token)
            ))
            conn.commit()
            cur.close()
        finally:
            conn.close()

        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "expires_in": 3600
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during token refresh"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """Get current user information"""
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "full_name": current_user.get("full_name"),
        "is_active": current_user["is_active"],
        "is_superuser": current_user["is_superuser"],
        "role": current_user["role"],
        "created_at": current_user["created_at"]
    }

# ============================================================================
# User Management (Admin only)
# ============================================================================

@router.post("/users", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    current_user: Dict[str, Any] = Depends(get_current_superuser)
):
    """Create a new user (admin only)"""
    try:
        # Check if username or email already exists
        existing_user = get_user_by_username(user_data.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )

        from ..auth import get_db_connection
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO users (username, email, password_hash, full_name, role)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, username, email, full_name, is_active, is_superuser, role, created_at
            """, (
                user_data.username,
                user_data.email,
                get_password_hash(user_data.password),
                user_data.full_name,
                user_data.role
            ))
            user = cur.fetchone()
            conn.commit()
            cur.close()

            log_audit_event(
                current_user["id"], "user_create",
                resource_type="user", resource_id=user[0],
                details={"username": user_data.username}
            )

            return {
                "id": user[0],
                "username": user[1],
                "email": user[2],
                "full_name": user[3],
                "is_active": user[4],
                "is_superuser": user[5],
                "role": user[6],
                "created_at": user[7]
            }
        finally:
            conn.close()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create user error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during user creation"
        )

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """Change user password"""
    try:
        from ..auth import authenticate_user, get_db_connection

        # Verify old password
        user = authenticate_user(current_user["username"], password_data.old_password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect current password"
            )

        # Update password
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                "UPDATE users SET password_hash = %s, updated_at = NOW() WHERE id = %s",
                (get_password_hash(password_data.new_password), current_user["id"])
            )
            conn.commit()
            cur.close()

            log_audit_event(
                current_user["id"], "password_change",
                ip_address=None, user_agent=None
            )

            logger.info(f"User {current_user['username']} changed password")

            return {"message": "Password changed successfully"}
        finally:
            conn.close()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Change password error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during password change"
        )

@router.put("/users/{user_id}/disable")
async def disable_user(
    user_id: int,
    current_user: Dict[str, Any] = Depends(get_current_superuser)
):
    """Disable a user (admin only)"""
    try:
        from ..auth import get_db_connection

        # Don't allow disabling yourself
        if user_id == current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot disable your own account"
            )

        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                "UPDATE users SET is_active = false, updated_at = NOW() WHERE id = %s RETURNING username",
                (user_id,)
            )
            result = cur.fetchone()
            if not result:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            conn.commit()
            cur.close()

            log_audit_event(
                current_user["id"], "user_disable",
                resource_type="user", resource_id=user_id,
                details={"username": result[0]}
            )

            logger.info(f"User {result[0]} disabled by {current_user['username']}")

            return {"message": f"User {result[0]} disabled successfully"}
        finally:
            conn.close()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Disable user error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
