"""
Subcategories API Router
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
import json
import os

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import Subcategory, SubcategoryCreate, SubcategoryUpdate, MessageResponse
from database import get_db_cursor

router = APIRouter(prefix="/subcategories", tags=["subcategories"])

# Base path for subcategory folders
SUBCATEGORY_BASE_PATH = "/opt/kms"

@router.get("/", response_model=List[Subcategory])
def list_subcategories(
    category_id: Optional[int] = Query(None),
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100
):
    """List all subcategories"""
    with get_db_cursor() as (cur, conn):
        query = "SELECT * FROM subcategories WHERE 1=1"
        params = []

        if category_id:
            query += " AND category_id = %s"
            params.append(category_id)

        if is_active is not None:
            query += " AND is_active = %s"
            params.append(is_active)

        query += " ORDER BY sort_order, name LIMIT %s OFFSET %s"
        params.extend([limit, skip])

        cur.execute(query, params)
        subcategories = cur.fetchall()

        return subcategories

@router.get("/{subcategory_id}", response_model=Subcategory)
def get_subcategory(subcategory_id: int):
    """Get a specific subcategory"""
    with get_db_cursor() as (cur, conn):
        cur.execute("SELECT * FROM subcategories WHERE id = %s", (subcategory_id,))
        subcategory = cur.fetchone()

        if not subcategory:
            raise HTTPException(status_code=404, detail="Subcategory not found")

        return subcategory

@router.post("/", response_model=Subcategory, status_code=201)
def create_subcategory(subcategory: SubcategoryCreate):
    """Create a new subcategory"""
    with get_db_cursor() as (cur, conn):
        try:
            # Auto-generate slug from name if not provided
            slug = subcategory.slug
            if not slug:
                slug = subcategory.name.lower().replace(' ', '-')
                # Remove special characters
                slug = ''.join(c for c in slug if c.isalnum() or c == '-')
                slug = '-'.join(filter(None, slug.split('-')))  # Remove multiple dashes
            
            # Get category slug for folder path
            cur.execute("SELECT slug FROM categories WHERE id = %s", (subcategory.category_id,))
            category = cur.fetchone()
            category_slug = category['slug'] if category else 'unknown'
            
            cur.execute("""
                INSERT INTO subcategories
                (category_id, slug, name, description, icon, color, sort_order, is_active, metadata)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                subcategory.category_id,
                slug,
                subcategory.name,
                subcategory.description,
                subcategory.icon,
                subcategory.color,
                subcategory.sort_order,
                subcategory.is_active,
                json.dumps(subcategory.metadata) if subcategory.metadata else '{}'
            ))

            new_subcategory = cur.fetchone()
            conn.commit()
            
            # Create folder for the subcategory
            try:
                folder_path = os.path.join(SUBCATEGORY_BASE_PATH, category_slug, slug)
                os.makedirs(folder_path, exist_ok=True)
                print(f"Created subcategory folder: {folder_path}")
            except Exception as folder_error:
                print(f"Warning: Could not create folder for subcategory: {folder_error}")

            return new_subcategory

        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=400, detail=str(e))

@router.put("/{subcategory_id}", response_model=Subcategory)
def update_subcategory(subcategory_id: int, subcategory: SubcategoryUpdate):
    """Update a subcategory"""
    with get_db_cursor() as (cur, conn):
        # Check if subcategory exists
        cur.execute("SELECT * FROM subcategories WHERE id = %s", (subcategory_id,))
        existing = cur.fetchone()

        if not existing:
            raise HTTPException(status_code=404, detail="Subcategory not found")

        # Build update query
        update_fields = []
        params = []

        if subcategory.name is not None:
            update_fields.append("name = %s")
            params.append(subcategory.name)

        if subcategory.slug is not None:
            update_fields.append("slug = %s")
            params.append(subcategory.slug)

        if subcategory.description is not None:
            update_fields.append("description = %s")
            params.append(subcategory.description)

        if subcategory.icon is not None:
            update_fields.append("icon = %s")
            params.append(subcategory.icon)

        if subcategory.color is not None:
            update_fields.append("color = %s")
            params.append(subcategory.color)

        if subcategory.sort_order is not None:
            update_fields.append("sort_order = %s")
            params.append(subcategory.sort_order)

        if subcategory.is_active is not None:
            update_fields.append("is_active = %s")
            params.append(subcategory.is_active)

        if subcategory.metadata is not None:
            update_fields.append("metadata = %s")
            params.append(json.dumps(subcategory.metadata))

        if not update_fields:
            return existing

        update_fields.append("updated_at = NOW()")
        params.append(subcategory_id)

        try:
            cur.execute(f"""
                UPDATE subcategories
                SET {', '.join(update_fields)}
                WHERE id = %s
                RETURNING *
            """, params)

            updated = cur.fetchone()
            conn.commit()

            return updated

        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{subcategory_id}", response_model=MessageResponse)
def delete_subcategory(subcategory_id: int):
    """Delete a subcategory"""
    with get_db_cursor() as (cur, conn):
        # Check if subcategory exists
        cur.execute("SELECT * FROM subcategories WHERE id = %s", (subcategory_id,))
        subcategory = cur.fetchone()

        if not subcategory:
            raise HTTPException(status_code=404, detail="Subcategory not found")

        # Check if subcategory has objects
        cur.execute("SELECT COUNT(*) as count FROM objects WHERE subcategory_id = %s", (subcategory_id,))
        count = cur.fetchone()['count']

        if count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete subcategory with {count} objects. Delete or move objects first."
            )

        try:
            cur.execute("DELETE FROM subcategories WHERE id = %s", (subcategory_id,))
            conn.commit()

            return MessageResponse(
                message=f"Subcategory '{subcategory['name']}' deleted successfully"
            )

        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=400, detail=str(e))
