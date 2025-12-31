"""
System API Router - Changelog, Sync Status, Stats
"""
from typing import List, Optional
from fastapi import APIRouter, Query

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import ChangeLog, SyncStatus
from database import get_db_cursor

router = APIRouter(prefix="/system", tags=["system"])

@router.get("/changelog", response_model=List[ChangeLog])
def get_changelog(
    entity_type: Optional[str] = Query(None, pattern="^(categories|subcategories|objects|documents)$"),
    action: Optional[str] = Query(None, pattern="^(create|update|delete|restore)$"),
    limit: int = Query(50, ge=1, le=500)
):
    """Get change log entries"""
    with get_db_cursor() as (cur, conn):
        query = "SELECT * FROM change_log WHERE 1=1"
        params = []

        if entity_type:
            query += " AND entity_type = %s"
            params.append(entity_type)

        if action:
            query += " AND action = %s"
            params.append(action)

        query += " ORDER BY created_at DESC LIMIT %s"
        params.append(limit)

        cur.execute(query, params)
        changelog = cur.fetchall()

        return changelog

@router.get("/sync-status", response_model=List[SyncStatus])
def get_sync_status(
    status: Optional[str] = Query(None, pattern="^(synced|pending|conflict|error)$"),
    limit: int = Query(50, ge=1, le=500)
):
    """Get synchronization status"""
    with get_db_cursor() as (cur, conn):
        query = "SELECT * FROM sync_status WHERE 1=1"
        params = []

        if status:
            query += " AND status = %s"
            params.append(status)

        query += " ORDER BY updated_at DESC LIMIT %s"
        params.append(limit)

        cur.execute(query, params)
        sync_status = cur.fetchall()

        return sync_status

@router.get("/stats")
def get_system_stats():
    """Get system statistics"""
    with get_db_cursor() as (cur, conn):
        stats = {}

        # Count statistics
        cur.execute("""
            SELECT
                (SELECT COUNT(*) FROM categories) as categories,
                (SELECT COUNT(*) FROM subcategories) as subcategories,
                (SELECT COUNT(*) FROM objects) as objects,
                (SELECT COUNT(*) FROM documents) as documents,
                (SELECT COUNT(*) FROM change_log) as changes,
                (SELECT SUM(size_bytes) FROM documents) as total_bytes
        """)
        counts = cur.fetchone()
        stats['counts'] = counts

        # Objects by status
        cur.execute("""
            SELECT status, COUNT(*) as count
            FROM objects
            GROUP BY status
        """)
        stats['objects_by_status'] = dict(cur.fetchall())

        # Documents by folder
        cur.execute("""
            SELECT folder, COUNT(*) as count, SUM(size_bytes) as total_bytes
            FROM documents
            GROUP BY folder
        """)
        stats['documents_by_folder'] = cur.fetchall()

        # Recent activity (last 7 days)
        cur.execute("""
            SELECT action, COUNT(*) as count
            FROM change_log
            WHERE created_at > NOW() - INTERVAL '7 days'
            GROUP BY action
        """)
        stats['recent_activity'] = dict(cur.fetchall())

        # Sync status summary
        cur.execute("""
            SELECT status, COUNT(*) as count
            FROM sync_status
            GROUP BY status
        """)
        stats['sync_status_summary'] = dict(cur.fetchall())

        return stats

@router.get("/health")
def health_check():
    """Health check endpoint"""
    try:
        with get_db_cursor() as (cur, conn):
            cur.execute("SELECT 1")
            return {
                "status": "healthy",
                "database": "connected"
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }
