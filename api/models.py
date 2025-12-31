"""
Pydantic models for request/response validation
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# ============================================================================
# Category Models
# ============================================================================

class CategoryBase(BaseModel):
    slug: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=255)
    type: str = Field(..., pattern="^(product|system)$")
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True
    metadata: Dict[str, Any] = {}

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None

class Category(CategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ============================================================================
# Subcategory Models
# ============================================================================

class SubcategoryBase(BaseModel):
    category_id: int
    slug: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True
    metadata: Dict[str, Any] = {}

class SubcategoryCreate(SubcategoryBase):
    pass

class SubcategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None

class Subcategory(SubcategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ============================================================================
# Object Models
# ============================================================================

class ObjectBase(BaseModel):
    category_id: int
    subcategory_id: Optional[int] = None
    slug: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: str = Field(default="draft", pattern="^(draft|active|archived)$")
    author: Optional[str] = None
    file_path: Optional[str] = None
    metadata: Dict[str, Any] = {}

class ObjectCreate(ObjectBase):
    pass

class ObjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(draft|active|archived)$")
    author: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class Object(ObjectBase):
    id: int
    uuid: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ObjectFull(BaseModel):
    """Object with full hierarchy information"""
    id: int
    uuid: str
    object_slug: str
    object_name: str
    description: Optional[str]
    status: str
    author: Optional[str]
    file_path: Optional[str]
    metadata: Optional[Dict[str, Any]] = {}
    category_id: int
    category_slug: str
    category_name: str
    category_type: str
    subcategory_id: Optional[int]
    subcategory_slug: Optional[str]
    subcategory_name: Optional[str]
    tags: Optional[List[str]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ============================================================================
# Document Models
# ============================================================================

class DocumentBase(BaseModel):
    object_id: int
    folder: str = Field(..., pattern="^(plany|instrukce|code|docs)$")
    filename: str = Field(..., min_length=1, max_length=255)
    filepath: str
    content: Optional[str] = None
    content_type: Optional[str] = "text/plain"
    size_bytes: Optional[int] = 0
    checksum: Optional[str] = None
    metadata: Dict[str, Any] = {}

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    content: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class Document(DocumentBase):
    id: int
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ============================================================================
# Search Models
# ============================================================================

class SearchResult(BaseModel):
    document_id: int
    object_name: str
    folder: str
    filename: str
    rank: float

class SearchQuery(BaseModel):
    query: str = Field(..., min_length=1)
    limit: int = Field(default=20, ge=1, le=100)

# ============================================================================
# Response Models
# ============================================================================

class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None

class ListResponse(BaseModel):
    items: List[Any]
    total: int
    page: int = 1
    page_size: int = 20

# ============================================================================
# Changelog Models
# ============================================================================

class ChangeLog(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    action: str
    user_name: Optional[str]
    old_data: Optional[Dict[str, Any]]
    new_data: Optional[Dict[str, Any]]
    diff: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# ============================================================================
# Sync Status Models
# ============================================================================

class SyncStatus(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    file_path: Optional[str]
    file_checksum: Optional[str]
    db_checksum: Optional[str]
    last_sync: Optional[datetime]
    sync_direction: Optional[str]
    status: str
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
