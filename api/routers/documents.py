"""
Documents API Router
"""
from typing import List
from fastapi import APIRouter, HTTPException, Response
import json

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import Document, DocumentCreate, DocumentUpdate, MessageResponse
from database import get_db_cursor

router = APIRouter(prefix="/documents", tags=["documents"])

@router.get("/{document_id}", response_model=Document)
def get_document(document_id: int):
    """Get a specific document"""
    with get_db_cursor() as (cur, conn):
        cur.execute("SELECT * FROM documents WHERE id = %s", (document_id,))
        document = cur.fetchone()

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        return document

@router.get("/{document_id}/content")
def get_document_content(document_id: int):
    """Get document content as raw text"""
    with get_db_cursor() as (cur, conn):
        cur.execute("SELECT content, content_type, filename FROM documents WHERE id = %s", (document_id,))
        document = cur.fetchone()

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        content = document['content'] or ''
        content_type = document['content_type'] or 'text/plain'

        return Response(content=content, media_type=content_type)

@router.post("/", response_model=Document, status_code=201)
def create_document(doc: DocumentCreate):
    """Create a new document"""
    with get_db_cursor() as (cur, conn):
        try:
            # Calculate checksum if content provided
            checksum = None
            size_bytes = 0
            if doc.content:
                import hashlib
                checksum = hashlib.sha256(doc.content.encode()).hexdigest()
                size_bytes = len(doc.content.encode())

            cur.execute("""
                INSERT INTO documents
                (object_id, folder, filename, filepath, content, content_type, size_bytes, checksum, metadata)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                doc.object_id,
                doc.folder,
                doc.filename,
                doc.filepath,
                doc.content,
                doc.content_type,
                size_bytes,
                checksum,
                json.dumps(doc.metadata)
            ))

            new_document = cur.fetchone()
            conn.commit()

            return new_document

        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=400, detail=str(e))

@router.put("/{document_id}", response_model=Document)
def update_document(document_id: int, doc: DocumentUpdate):
    """Update a document"""
    with get_db_cursor() as (cur, conn):
        # Check if document exists
        cur.execute("SELECT * FROM documents WHERE id = %s", (document_id,))
        existing = cur.fetchone()

        if not existing:
            raise HTTPException(status_code=404, detail="Document not found")

        # Build update query
        update_fields = []
        params = []

        if doc.content is not None:
            import hashlib
            checksum = hashlib.sha256(doc.content.encode()).hexdigest()
            size_bytes = len(doc.content.encode())

            update_fields.extend([
                "content = %s",
                "checksum = %s",
                "size_bytes = %s",
                "version = version + 1"
            ])
            params.extend([doc.content, checksum, size_bytes])

        if doc.metadata is not None:
            update_fields.append("metadata = %s")
            params.append(json.dumps(doc.metadata))

        if not update_fields:
            return existing

        update_fields.append("updated_at = NOW()")
        params.append(document_id)

        query = f"UPDATE documents SET {', '.join(update_fields)} WHERE id = %s RETURNING *"

        try:
            cur.execute(query, params)
            updated_document = cur.fetchone()
            conn.commit()

            return updated_document

        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{document_id}", response_model=MessageResponse)
def delete_document(document_id: int):
    """Delete a document"""
    with get_db_cursor() as (cur, conn):
        # Check if document exists
        cur.execute("SELECT * FROM documents WHERE id = %s", (document_id,))
        document = cur.fetchone()

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        try:
            cur.execute("DELETE FROM documents WHERE id = %s", (document_id,))
            conn.commit()

            return MessageResponse(
                message=f"Document '{document['filename']}' deleted successfully"
            )

        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=400, detail=str(e))
