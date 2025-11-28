import hashlib
import json
from typing import Any, Optional, Callable
import logging
from app.core.redis import redis_manager

logger = logging.getLogger(__name__)

class CacheService:
    def __init__(self):
        self.default_ttl = 300  # 5 minutes
        
    def _generate_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate cache key from function arguments"""
        key_data = f"{prefix}:{str(args)}:{str(kwargs)}"
        return f"cache:{hashlib.md5(key_data.encode()).hexdigest()}"
    
    async def cached(
        self, 
        ttl: int = None, 
        key_prefix: str = None,
        fallback: bool = True
    ):
        """
        Decorator for caching function results
        """
        def decorator(func: Callable):
            async def wrapper(*args, **kwargs):
                # Generate cache key
                prefix = key_prefix or f"{func.__module__}:{func.__name__}"
                cache_key = self._generate_key(prefix, *args, **kwargs)
                
                # Try to get from cache
                cached_result = await redis_manager.get(cache_key)
                if cached_result is not None:
                    logger.debug(f"Cache hit for {cache_key}")
                    return cached_result
                
                # Execute function
                try:
                    result = await func(*args, **kwargs)
                    
                    # Store in cache
                    if result is not None:
                        await redis_manager.set(
                            cache_key, 
                            result, 
                            expire=ttl or self.default_ttl
                        )
                    
                    return result
                    
                except Exception as e:
                    logger.error(f"Function execution failed: {e}")
                    if fallback and cached_result is not None:
                        logger.info("Using cached result as fallback")
                        return cached_result
                    raise
                    
            return wrapper
        return decorator
    
    async def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate cache keys matching pattern"""
        try:
            keys = await redis_manager.keys(f"cache:{pattern}*")
            if keys:
                deleted = await redis_manager.delete(*keys)
                logger.info(f"Invalidated {deleted} cache keys matching {pattern}")
                return deleted
            return 0
        except Exception as e:
            logger.error(f"Cache invalidation error for pattern {pattern}: {e}")
            return 0
    
    async def get_stats(self) -> dict:
        """Get cache statistics"""
        try:
            # Get all cache keys
            cache_keys = await redis_manager.keys("cache:*")
            
            stats = {
                "total_keys": len(cache_keys),
                "keys_by_prefix": {},
                "memory_usage": "N/A"
            }
            
            # Group keys by prefix
            for key in cache_keys:
                prefix = key.split(":")[1] if ":" in key else "other"
                stats["keys_by_prefix"][prefix] = stats["keys_by_prefix"].get(prefix, 0) + 1
                
            return stats
            
        except Exception as e:
            logger.error(f"Cache stats error: {e}")
            return {"error": str(e)}

# Global cache service instance
cache_service = CacheService()