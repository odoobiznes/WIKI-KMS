"""
Categories API Router
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
import json
import os

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import Category, CategoryCreate, CategoryUpdate, MessageResponse
from database import get_db_cursor

# Base path for category folders
CATEGORY_BASE_PATH = "/opt/kms"

router = APIRouter(prefix="/categories", tags=["categories"])

@router.get("/", response_model=List[Category])
def list_categories(
    type: Optional[str] = Query(None, pattern="^(product|system)$"),
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100
):
    """List all categories"""
    with get_db_cursor() as (cur, conn):
        query = "SELECT * FROM categories WHERE 1=1"
        params = []

        if type:
            query += " AND type = %s"
            params.append(type)

        if is_active is not None:
            query += " AND is_active = %s"
            params.append(is_active)

        query += " ORDER BY sort_order, name LIMIT %s OFFSET %s"
        params.extend([limit, skip])

        cur.execute(query, params)
        categories = cur.fetchall()

        return categories

@router.get("/{category_id}", response_model=Category)
def get_category(category_id: int):
    """Get a specific category"""
    with get_db_cursor() as (cur, conn):
        cur.execute("SELECT * FROM categories WHERE id = %s", (category_id,))
        category = cur.fetchone()

        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

        return category

@router.post("/", response_model=Category, status_code=201)
def create_category(category: CategoryCreate):
    """Create a new category"""
    with get_db_cursor() as (cur, conn):
        try:
            # Auto-generate slug from name if not provided
            slug = category.slug
            if not slug:
                slug = category.name.lower().replace(' ', '-')
                # Remove special characters
                slug = ''.join(c for c in slug if c.isalnum() or c == '-')
                slug = '-'.join(filter(None, slug.split('-')))  # Remove multiple dashes
            
            cur.execute("""
                INSERT INTO categories
                (slug, name, type, description, icon, color, sort_order, is_active, metadata)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                slug,
                category.name,
                category.type,
                category.description,
                category.icon,
                category.color,
                category.sort_order,
                category.is_active,
                json.dumps(category.metadata)
            ))

            new_category = cur.fetchone()
            conn.commit()
            
            # Create folder for the category
            try:
                folder_path = os.path.join(CATEGORY_BASE_PATH, slug)
                os.makedirs(folder_path, exist_ok=True)
                print(f"Created category folder: {folder_path}")
            except Exception as folder_error:
                print(f"Warning: Could not create folder for category: {folder_error}")

            return new_category

        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=400, detail=str(e))

@router.put("/{category_id}", response_model=Category)
def update_category(category_id: int, category: CategoryUpdate):
    """Update a category"""
    with get_db_cursor() as (cur, conn):
        # Check if category exists
        cur.execute("SELECT * FROM categories WHERE id = %s", (category_id,))
        existing = cur.fetchone()

        if not existing:
            raise HTTPException(status_code=404, detail="Category not found")

        # Build update query
        update_fields = []
        params = []

        if category.name is not None:
            update_fields.append("name = %s")
            params.append(category.name)

        if category.description is not None:
            update_fields.append("description = %s")
            params.append(category.description)

        if category.icon is not None:
            update_fields.append("icon = %s")
            params.append(category.icon)

        if category.color is not None:
            update_fields.append("color = %s")
            params.append(category.color)

        if category.sort_order is not None:
            update_fields.append("sort_order = %s")
            params.append(category.sort_order)

        if category.is_active is not None:
            update_fields.append("is_active = %s")
            params.append(category.is_active)

        if category.metadata is not None:
            update_fields.append("metadata = %s")
            params.append(json.dumps(category.metadata))

        if not update_fields:
            return existing

        update_fields.append("updated_at = NOW()")
        params.append(category_id)

        query = f"UPDATE categories SET {', '.join(update_fields)} WHERE id = %s RETURNING *"

        try:
            cur.execute(query, params)
            updated_category = cur.fetchone()
            conn.commit()

            return updated_category

        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{category_id}", response_model=MessageResponse)
def delete_category(category_id: int):
    """Delete a category"""
    with get_db_cursor() as (cur, conn):
        # Check if category exists
        cur.execute("SELECT * FROM categories WHERE id = %s", (category_id,))
        category = cur.fetchone()

        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

        # Check if category has objects
        cur.execute("SELECT COUNT(*) as count FROM objects WHERE category_id = %s", (category_id,))
        count = cur.fetchone()['count']

        if count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete category with {count} objects"
            )

        try:
            cur.execute("DELETE FROM categories WHERE id = %s", (category_id,))
            conn.commit()

            return MessageResponse(
                message=f"Category '{category['name']}' deleted successfully"
            )

        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=400, detail=str(e))
