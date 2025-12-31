"""
Authentication and Authorization Module
Handles user authentication, JWT tokens, and OAuth2
"""
import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Optional as TypingOptional
import psycopg2
from psycopg2.extras import RealDictCursor

# Configuration
# Load from .env file if available
from dotenv import load_dotenv
import pathlib
env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY must be set as environment variable or in .env file")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "30"))

# Database connection
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "kms_db")
DB_USER = os.getenv("DB_USER", "kms_user")

def get_db_password():
    """Get database password from secrets"""
    import subprocess
    result = subprocess.run(
        ["bash", os.path.expanduser("~/.wikisys-local/scripts/secrets-manager.sh"),
         "decrypt", "passwords/kms-db-password"],
        capture_output=True,
        text=True
    )
    if result.returncode == 0:
        lines = result.stdout.strip().split('\n')
        return lines[-1]
    else:
        raise Exception(f"Failed to get DB password: {result.stderr}")

def get_db_connection():
    """Create database connection"""
    password = get_db_password()
    return psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=password
    )

# Password hashing - use bcrypt directly to avoid passlib issues
import bcrypt

# Security schemes
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)
http_bearer = HTTPBearer(auto_error=False)

# ============================================================================
# Pydantic Models
# ============================================================================

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: TypingOptional[str] = None
    role: str = "user"

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    is_active: bool
    is_superuser: bool
    role: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None

# ============================================================================
# Password Utilities
# ============================================================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Hash a password"""
    # Truncate password if too long (bcrypt limit is 72 bytes)
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def hash_token(token: str) -> str:
    """Hash a token for storage"""
    return hashlib.sha256(token.encode()).hexdigest()

# ============================================================================
# JWT Token Functions
# ============================================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str, token_type: str = "access") -> Optional[Dict[str, Any]]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != token_type:
            return None
        return payload
    except JWTError:
        return None

# ============================================================================
# User Database Functions
# ============================================================================

def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    """Get user by username"""
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cur.fetchone()
        cur.close()
        return dict(user) if user else None
    finally:
        conn.close()

def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """Get user by ID"""
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        cur.close()
        return dict(user) if user else None
    finally:
        conn.close()

def authenticate_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    """Authenticate a user"""
    user = get_user_by_username(username)
    if not user:
        return None
    if not user.get("is_active"):
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    return user

def create_session(user_id: int, access_token: str, refresh_token: str,
                  ip_address: str = None, user_agent: str = None) -> int:
    """Create a session in database"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        # Use database timezone-aware datetime
        cur.execute("SELECT NOW()")
        db_now = cur.fetchone()[0]
        access_expires = db_now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_expires = db_now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

        cur.execute("""
            INSERT INTO sessions (user_id, token_hash, refresh_token_hash, expires_at,
                                 refresh_expires_at, ip_address, user_agent, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, true)
            RETURNING id
        """, (
            user_id,
            hash_token(access_token),
            hash_token(refresh_token),
            access_expires,
            refresh_expires,
            ip_address,
            user_agent
        ))
        session_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        return session_id
    finally:
        conn.close()

def update_user_last_login(user_id: int):
    """Update user's last login timestamp"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("UPDATE users SET last_login = NOW() WHERE id = %s", (user_id,))
        conn.commit()
        cur.close()
    finally:
        conn.close()

def log_audit_event(user_id: Optional[int], action: str, resource_type: str = None,
                   resource_id: int = None, ip_address: str = None,
                   user_agent: str = None, details: Dict = None):
    """Log an audit event"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        import json
        # Convert details dict to JSON string for JSONB column
        details_json = json.dumps(details) if details else None
        cur.execute("""
            INSERT INTO audit_log (user_id, action, resource_type, resource_id,
                                 ip_address, user_agent, details)
            VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb)
        """, (
            user_id,
            action,
            resource_type,
            resource_id,
            ip_address,
            user_agent,
            details_json
        ))
        conn.commit()
        cur.close()
    finally:
        conn.close()

# ============================================================================
# Authentication Dependencies
# ============================================================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(http_bearer)
) -> Dict[str, Any]:
    """Get current authenticated user from JWT token"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = verify_token(token, "access")

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    username: str = payload.get("sub")
    user_id: int = payload.get("user_id")

    if username is None or user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify session exists and is active
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT id FROM sessions
            WHERE token_hash = %s AND is_active = true AND expires_at > NOW()
        """, (hash_token(token),))
        session = cur.fetchone()
        cur.close()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired or invalid",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Update last used
        cur = conn.cursor()
        cur.execute("UPDATE sessions SET last_used_at = NOW() WHERE id = %s", (session[0],))
        conn.commit()
        cur.close()
    finally:
        conn.close()

    user = get_user_by_id(user_id)
    if user is None or not user.get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user

async def get_current_active_user(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get current active user"""
    if not current_user.get("is_active"):
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_superuser(
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Get current superuser"""
    if not current_user.get("is_superuser"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user
