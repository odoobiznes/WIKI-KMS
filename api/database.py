"""
Database connection and utilities
"""
import os
import subprocess
from contextlib import contextmanager
import psycopg2
from psycopg2.extras import RealDictCursor

# Database configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "kms_db")
DB_USER = os.getenv("DB_USER", "kms_user")

def get_db_password():
    """Get database password from WikiSys secrets"""
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
    """Create database connection with RealDictCursor"""
    password = get_db_password()
    return psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=password,
        cursor_factory=RealDictCursor
    )

@contextmanager
def get_db():
    """Context manager for database connections"""
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()

@contextmanager
def get_db_cursor():
    """Context manager for database cursor"""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        yield cur, conn
    finally:
        cur.close()
        conn.close()
