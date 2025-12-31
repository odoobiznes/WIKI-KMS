"""
Search API Router
"""
from typing import List
from fastapi import APIRouter, Query

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import SearchResult
from database import get_db_cursor

router = APIRouter(prefix="/search", tags=["search"])

@router.get("/", response_model=List[SearchResult])
def search_documents(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(20, ge=1, le=100, description="Maximum results")
):
    """Search documents using full-text search"""
    with get_db_cursor() as (cur, conn):
        cur.execute("""
            SELECT document_id, object_name, folder, filename, rank
            FROM search_documents(%s)
            ORDER BY rank DESC
            LIMIT %s
        """, (q, limit))

        results = cur.fetchall()

        return results

@router.get("/by-category/{category_slug}")
def search_by_category(
    category_slug: str,
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Search documents within a specific category"""
    with get_db_cursor() as (cur, conn):
        cur.execute("""
            SELECT
                d.id as document_id,
                o.name as object_name,
                d.folder,
                d.filename,
                ts_rank(
                    to_tsvector('english', COALESCE(d.content, '') || ' ' || d.filename),
                    plainto_tsquery('english', %s)
                ) as rank
            FROM documents d
            JOIN objects o ON d.object_id = o.id
            JOIN categories c ON o.category_id = c.id
            WHERE c.slug = %s
              AND to_tsvector('english', COALESCE(d.content, '') || ' ' || d.filename)
                  @@ plainto_tsquery('english', %s)
            ORDER BY rank DESC
            LIMIT %s
        """, (q, category_slug, q, limit))

        results = cur.fetchall()

        return {
            "category": category_slug,
            "query": q,
            "results": results,
            "total": len(results)
        }

@router.get("/suggest")
def search_suggestions(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50)
):
    """Get search suggestions based on object and document names"""
    with get_db_cursor() as (cur, conn):
        # Search in object names
        cur.execute("""
            SELECT DISTINCT
                'object' as type,
                o.id,
                o.name as title,
                c.name as category
            FROM objects o
            JOIN categories c ON o.category_id = c.id
            WHERE o.name ILIKE %s
            LIMIT %s
        """, (f"%{q}%", limit))

        object_results = cur.fetchall()

        # Search in document filenames
        cur.execute("""
            SELECT DISTINCT
                'document' as type,
                d.id,
                d.filename as title,
                o.name as object_name
            FROM documents d
            JOIN objects o ON d.object_id = o.id
            WHERE d.filename ILIKE %s
            LIMIT %s
        """, (f"%{q}%", limit))

        document_results = cur.fetchall()

        return {
            "query": q,
            "suggestions": {
                "objects": object_results,
                "documents": document_results
            }
        }
