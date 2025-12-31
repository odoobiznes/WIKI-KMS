"""
Objects API Router
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
import json

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import Object, ObjectFull, ObjectCreate, ObjectUpdate, MessageResponse
from database import get_db_cursor

router = APIRouter(prefix="/objects", tags=["objects"])

@router.get("/", response_model=List[ObjectFull])
def list_objects(
    category_id: Optional[int] = None,
    subcategory_id: Optional[int] = None,
    status: Optional[str] = Query(None, pattern="^(draft|active|archived)$"),
    skip: int = 0,
    limit: int = 100
):
    """List all objects with full hierarchy"""
    with get_db_cursor() as (cur, conn):
        query = "SELECT * FROM v_objects_full WHERE 1=1"
        params = []

        if category_id:
            query += " AND category_id = %s"
            params.append(category_id)

        if subcategory_id:
            query += " AND subcategory_id = %s"
            params.append(subcategory_id)

        if status:
            query += " AND status = %s"
            params.append(status)

        query += " ORDER BY category_name, subcategory_name, object_name LIMIT %s OFFSET %s"
        params.extend([limit, skip])

        cur.execute(query, params)
        objects = cur.fetchall()

        return objects

@router.get("/{object_id}", response_model=ObjectFull)
def get_object(object_id: int):
    """Get a specific object with full hierarchy"""
    with get_db_cursor() as (cur, conn):
        cur.execute("SELECT * FROM v_objects_full WHERE id = %s", (object_id,))
        obj = cur.fetchone()

        if not obj:
            raise HTTPException(status_code=404, detail="Object not found")

        # Ensure metadata is a dict (RealDictCursor should handle JSONB, but ensure it's parsed)
        if obj.get('metadata') and isinstance(obj['metadata'], str):
            import json
            try:
                obj['metadata'] = json.loads(obj['metadata'])
            except:
                obj['metadata'] = {}
        elif not obj.get('metadata'):
            obj['metadata'] = {}

        return obj

@router.get("/uuid/{uuid}", response_model=ObjectFull)
def get_object_by_uuid(uuid: str):
    """Get object by UUID"""
    with get_db_cursor() as (cur, conn):
        cur.execute("SELECT * FROM v_objects_full WHERE uuid = %s", (uuid,))
        obj = cur.fetchone()

        if not obj:
            raise HTTPException(status_code=404, detail="Object not found")

        return obj

@router.post("/", response_model=Object, status_code=201)
def create_object(obj: ObjectCreate):
    """Create a new object"""
    with get_db_cursor() as (cur, conn):
        try:
            cur.execute("""
                INSERT INTO objects
                (category_id, subcategory_id, slug, name, description, status, author, file_path, metadata)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                obj.category_id,
                obj.subcategory_id,
                obj.slug,
                obj.name,
                obj.description,
                obj.status,
                obj.author,
                obj.file_path,
                json.dumps(obj.metadata)
            ))

            new_object = cur.fetchone()
            conn.commit()

            return new_object

        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=400, detail=str(e))

@router.put("/{object_id}", response_model=Object)
def update_object(object_id: int, obj: ObjectUpdate):
    """Update an object"""
    with get_db_cursor() as (cur, conn):
        # Check if object exists
        cur.execute("SELECT * FROM objects WHERE id = %s", (object_id,))
        existing = cur.fetchone()

        if not existing:
            raise HTTPException(status_code=404, detail="Object not found")

        # Build update query
        update_fields = []
        params = []

        if obj.name is not None:
            update_fields.append("name = %s")
            params.append(obj.name)

        if obj.description is not None:
            update_fields.append("description = %s")
            params.append(obj.description)

        if obj.status is not None:
            update_fields.append("status = %s")
            params.append(obj.status)

        if obj.author is not None:
            update_fields.append("author = %s")
            params.append(obj.author)

        if obj.metadata is not None:
            update_fields.append("metadata = %s")
            params.append(json.dumps(obj.metadata))

        if not update_fields:
            return existing

        update_fields.append("updated_at = NOW()")
        params.append(object_id)

        query = f"UPDATE objects SET {', '.join(update_fields)} WHERE id = %s RETURNING *"

        try:
            cur.execute(query, params)
            updated_object = cur.fetchone()
            conn.commit()

            return updated_object

        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{object_id}", response_model=MessageResponse)
def delete_object(object_id: int):
    """Delete an object"""
    with get_db_cursor() as (cur, conn):
        # Check if object exists
        cur.execute("SELECT * FROM objects WHERE id = %s", (object_id,))
        obj = cur.fetchone()

        if not obj:
            raise HTTPException(status_code=404, detail="Object not found")

        try:
            cur.execute("DELETE FROM objects WHERE id = %s", (object_id,))
            conn.commit()

            return MessageResponse(
                message=f"Object '{obj['name']}' deleted successfully"
            )

        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=400, detail=str(e))

@router.get("/{object_id}/documents")
def get_object_documents(object_id: int):
    """Get all documents for an object"""
    with get_db_cursor() as (cur, conn):
        # Check if object exists
        cur.execute("SELECT * FROM objects WHERE id = %s", (object_id,))
        obj = cur.fetchone()

        if not obj:
            raise HTTPException(status_code=404, detail="Object not found")

        # Get documents
        cur.execute("""
            SELECT id, folder, filename, content_type, size_bytes, version, created_at, updated_at
            FROM documents
            WHERE object_id = %s
            ORDER BY folder, filename
        """, (object_id,))

        documents = cur.fetchall()

        return {
            "object_id": object_id,
            "object_name": obj['name'],
            "documents": documents,
            "total": len(documents)
        }
