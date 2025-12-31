"""
KMS Database Optimization Utilities
Provides database query optimization and connection pooling
"""

import os
import logging
from typing import Optional
from contextlib import contextmanager

logger = logging.getLogger(__name__)

# Database configuration
DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "10"))
DB_MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "20"))
DB_POOL_TIMEOUT = int(os.getenv("DB_POOL_TIMEOUT", "30"))
DB_POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", "1800"))  # 30 minutes

# Query statistics
query_stats = {
    "total_queries": 0,
    "slow_queries": 0,
    "total_time_ms": 0
}

SLOW_QUERY_THRESHOLD_MS = 1000  # 1 second


def log_query_stats(query: str, duration_ms: float):
    """Log query execution statistics"""
    query_stats["total_queries"] += 1
    query_stats["total_time_ms"] += duration_ms
    
    if duration_ms > SLOW_QUERY_THRESHOLD_MS:
        query_stats["slow_queries"] += 1
        logger.warning(f"Slow query ({duration_ms:.2f}ms): {query[:100]}...")


def get_query_stats():
    """Get query statistics"""
    return {
        **query_stats,
        "avg_time_ms": query_stats["total_time_ms"] / max(query_stats["total_queries"], 1)
    }


# Common SQL optimization patterns
SQL_OPTIMIZATION_HINTS = """
-- Index recommendations for KMS database

-- Categories table
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Objects table
CREATE INDEX IF NOT EXISTS idx_objects_category ON objects(category_id);
CREATE INDEX IF NOT EXISTS idx_objects_name ON objects(object_name);
CREATE INDEX IF NOT EXISTS idx_objects_path ON objects(file_path);
CREATE INDEX IF NOT EXISTS idx_objects_created ON objects(created_at);

-- Documents table
CREATE INDEX IF NOT EXISTS idx_documents_object ON documents(object_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_documents_path ON documents(file_path);

-- Full-text search indexes (PostgreSQL)
CREATE INDEX IF NOT EXISTS idx_objects_name_gin ON objects USING gin(to_tsvector('english', object_name));
CREATE INDEX IF NOT EXISTS idx_documents_name_gin ON documents USING gin(to_tsvector('english', doc_name));

-- Sync status table
CREATE INDEX IF NOT EXISTS idx_sync_path ON sync_status(file_path);
CREATE INDEX IF NOT EXISTS idx_sync_modified ON sync_status(last_modified);

-- Change log table  
CREATE INDEX IF NOT EXISTS idx_changelog_timestamp ON change_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_changelog_entity ON change_log(entity_type, entity_id);
"""


def generate_index_script():
    """Generate SQL script for recommended indexes"""
    return SQL_OPTIMIZATION_HINTS


# Query optimization functions
def optimize_list_query(table: str, filters: dict, page: int = 1, limit: int = 50) -> tuple:
    """
    Generate optimized list query with pagination
    Returns (query, params)
    """
    offset = (page - 1) * limit
    
    where_clauses = []
    params = {}
    
    for key, value in filters.items():
        if value is not None:
            where_clauses.append(f"{key} = :{key}")
            params[key] = value
    
    where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
    
    query = f"""
        SELECT * FROM {table}
        WHERE {where_sql}
        ORDER BY id DESC
        LIMIT :limit OFFSET :offset
    """
    
    params["limit"] = limit
    params["offset"] = offset
    
    return query, params


def optimize_search_query(search_term: str, tables: list) -> str:
    """Generate optimized full-text search query"""
    # Use PostgreSQL full-text search
    search_conditions = []
    
    for table in tables:
        if table == "objects":
            search_conditions.append(f"""
                SELECT id, object_name as name, file_path, 'object' as type,
                       ts_rank(to_tsvector('english', object_name), query) as rank
                FROM objects, to_tsquery('english', :search) query
                WHERE to_tsvector('english', object_name) @@ query
            """)
        elif table == "documents":
            search_conditions.append(f"""
                SELECT id, doc_name as name, file_path, 'document' as type,
                       ts_rank(to_tsvector('english', doc_name), query) as rank
                FROM documents, to_tsquery('english', :search) query
                WHERE to_tsvector('english', doc_name) @@ query
            """)
    
    if search_conditions:
        return f"""
            {' UNION ALL '.join(search_conditions)}
            ORDER BY rank DESC
            LIMIT 50
        """
    
    return ""


# Connection pool monitoring
class ConnectionPoolMonitor:
    """Monitor database connection pool"""
    
    def __init__(self):
        self.active_connections = 0
        self.peak_connections = 0
        self.connection_errors = 0
    
    def connection_acquired(self):
        self.active_connections += 1
        self.peak_connections = max(self.peak_connections, self.active_connections)
    
    def connection_released(self):
        self.active_connections = max(0, self.active_connections - 1)
    
    def connection_error(self):
        self.connection_errors += 1
    
    def get_stats(self):
        return {
            "active": self.active_connections,
            "peak": self.peak_connections,
            "errors": self.connection_errors,
            "pool_size": DB_POOL_SIZE,
            "max_overflow": DB_MAX_OVERFLOW
        }


pool_monitor = ConnectionPoolMonitor()


@contextmanager
def monitored_connection(connection_func):
    """Context manager for monitored database connections"""
    try:
        pool_monitor.connection_acquired()
        conn = connection_func()
        yield conn
    except Exception as e:
        pool_monitor.connection_error()
        raise
    finally:
        pool_monitor.connection_released()

