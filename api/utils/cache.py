"""
KMS Cache Utilities
Provides caching functionality using Redis or in-memory fallback
"""

import os
import json
import hashlib
import time
from typing import Any, Optional, Callable
from functools import wraps
import logging

logger = logging.getLogger(__name__)

# Try to import Redis
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None

# Cache configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CACHE_TTL_DEFAULT = int(os.getenv("CACHE_TTL", "300"))  # 5 minutes default
CACHE_ENABLED = os.getenv("CACHE_ENABLED", "true").lower() == "true"

# In-memory cache fallback
_memory_cache = {}
_memory_cache_expiry = {}

# Redis client (initialized lazily)
_redis_client = None


def get_redis_client():
    """Get or create Redis client"""
    global _redis_client
    
    if not REDIS_AVAILABLE:
        return None
    
    if _redis_client is None:
        try:
            _redis_client = redis.from_url(REDIS_URL, decode_responses=True)
            _redis_client.ping()
            logger.info("Redis cache connected")
        except Exception as e:
            logger.warning(f"Redis not available, using memory cache: {e}")
            _redis_client = None
    
    return _redis_client


def cache_key(*args, **kwargs) -> str:
    """Generate cache key from arguments"""
    key_data = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True)
    return hashlib.md5(key_data.encode()).hexdigest()


def cache_get(key: str) -> Optional[Any]:
    """Get value from cache"""
    if not CACHE_ENABLED:
        return None
    
    redis_client = get_redis_client()
    
    if redis_client:
        try:
            value = redis_client.get(key)
            if value:
                return json.loads(value)
        except Exception as e:
            logger.warning(f"Redis get error: {e}")
    
    # Fallback to memory cache
    if key in _memory_cache:
        if _memory_cache_expiry.get(key, 0) > time.time():
            return _memory_cache[key]
        else:
            # Expired
            del _memory_cache[key]
            del _memory_cache_expiry[key]
    
    return None


def cache_set(key: str, value: Any, ttl: int = None) -> bool:
    """Set value in cache"""
    if not CACHE_ENABLED:
        return False
    
    ttl = ttl or CACHE_TTL_DEFAULT
    redis_client = get_redis_client()
    
    if redis_client:
        try:
            redis_client.setex(key, ttl, json.dumps(value))
            return True
        except Exception as e:
            logger.warning(f"Redis set error: {e}")
    
    # Fallback to memory cache
    _memory_cache[key] = value
    _memory_cache_expiry[key] = time.time() + ttl
    return True


def cache_delete(key: str) -> bool:
    """Delete value from cache"""
    redis_client = get_redis_client()
    
    if redis_client:
        try:
            redis_client.delete(key)
        except Exception:
            pass
    
    # Also clear from memory cache
    _memory_cache.pop(key, None)
    _memory_cache_expiry.pop(key, None)
    return True


def cache_clear_pattern(pattern: str) -> int:
    """Clear all keys matching pattern"""
    count = 0
    redis_client = get_redis_client()
    
    if redis_client:
        try:
            keys = redis_client.keys(pattern)
            if keys:
                count = redis_client.delete(*keys)
        except Exception as e:
            logger.warning(f"Redis clear pattern error: {e}")
    
    # Clear matching memory cache keys
    pattern_prefix = pattern.replace("*", "")
    keys_to_delete = [k for k in _memory_cache.keys() if k.startswith(pattern_prefix)]
    for key in keys_to_delete:
        del _memory_cache[key]
        _memory_cache_expiry.pop(key, None)
        count += 1
    
    return count


def cached(prefix: str = "", ttl: int = None):
    """
    Decorator to cache function results
    
    Usage:
        @cached(prefix="users", ttl=60)
        def get_user(user_id):
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = f"{prefix}:{func.__name__}:{cache_key(*args, **kwargs)}"
            
            # Try to get from cache
            result = cache_get(key)
            if result is not None:
                logger.debug(f"Cache hit: {key}")
                return result
            
            # Call function and cache result
            logger.debug(f"Cache miss: {key}")
            result = func(*args, **kwargs)
            cache_set(key, result, ttl)
            
            return result
        return wrapper
    return decorator


def invalidate_cache(prefix: str):
    """
    Decorator to invalidate cache after function call
    
    Usage:
        @invalidate_cache(prefix="users")
        def update_user(user_id, data):
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            cache_clear_pattern(f"{prefix}:*")
            return result
        return wrapper
    return decorator


# Cache statistics
def get_cache_stats():
    """Get cache statistics"""
    stats = {
        "type": "redis" if get_redis_client() else "memory",
        "enabled": CACHE_ENABLED,
        "memory_cache_size": len(_memory_cache)
    }
    
    redis_client = get_redis_client()
    if redis_client:
        try:
            info = redis_client.info("memory")
            stats["redis_used_memory"] = info.get("used_memory_human", "unknown")
            stats["redis_keys"] = redis_client.dbsize()
        except Exception:
            pass
    
    return stats

