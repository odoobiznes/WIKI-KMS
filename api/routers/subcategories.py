"""
Subcategories API Router
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
import json

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import Subcategory, SubcategoryCreate, SubcategoryUpdate, MessageResponse
from database import get_db_cursor

router = APIRouter(prefix="/subcategories", tags=["subcategories"])

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
