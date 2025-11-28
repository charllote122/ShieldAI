import redis.asyncio as redis
import logging
from typing import Optional, Any
import json
import pickle
from app.core.config import settings

logger = logging.getLogger(__name__)

class RedisManager:
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.is_connected = False

    async def connect(self):
        """Connect to Redis with retry logic"""
        try:
            self.redis_client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5,
                socket_keepalive=True,
                retry_on_timeout=True,
            )
            
            # Test connection
            await self.redis_client.ping()
            self.is_connected = True
            logger.info("✅ Redis connected successfully")
            
        except Exception as e:
            logger.error(f"❌ Redis connection failed: {e}")
            self.is_connected = False
            raise

    async def disconnect(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()
            self.is_connected = False
            logger.info("🔌 Redis disconnected")

    async def set(self, key: str, value: Any, expire: int = None) -> bool:
        """Set key-value pair with optional expiration"""
        if not self.is_connected:
            return False
            
        try:
            # Serialize value based on type
            if isinstance(value, (dict, list)):
                serialized_value = json.dumps(value)
            else:
                serialized_value = str(value)
                
            if expire:
                await self.redis_client.setex(key, expire, serialized_value)
            else:
                await self.redis_client.set(key, serialized_value)
                
            return True
        except Exception as e:
            logger.error(f"Redis set error for key {key}: {e}")
            return False

    async def get(self, key: str, default: Any = None) -> Any:
        """Get value by key"""
        if not self.is_connected:
            return default
            
        try:
            value = await self.redis_client.get(key)
            if value is None:
                return default
                
            # Try to deserialize JSON, fallback to string
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
                
        except Exception as e:
            logger.error(f"Redis get error for key {key}: {e}")
            return default

    async def delete(self, *keys) -> int:
        """Delete one or more keys"""
        if not self.is_connected:
            return 0
            
        try:
            return await self.redis_client.delete(*keys)
        except Exception as e:
            logger.error(f"Redis delete error for keys {keys}: {e}")
            return 0

    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        if not self.is_connected:
            return False
            
        try:
            return await self.redis_client.exists(key) > 0
        except Exception as e:
            logger.error(f"Redis exists error for key {key}: {e}")
            return False

    async def incr(self, key: str, amount: int = 1) -> Optional[int]:
        """Increment key by amount"""
        if not self.is_connected:
            return None
            
        try:
            return await self.redis_client.incrby(key, amount)
        except Exception as e:
            logger.error(f"Redis incr error for key {key}: {e}")
            return None

    async def expire(self, key: str, seconds: int) -> bool:
        """Set expiration for key"""
        if not self.is_connected:
            return False
            
        try:
            return await self.redis_client.expire(key, seconds)
        except Exception as e:
            logger.error(f"Redis expire error for key {key}: {e}")
            return False

    async def ttl(self, key: str) -> Optional[int]:
        """Get time to live for key"""
        if not self.is_connected:
            return None
            
        try:
            return await self.redis_client.ttl(key)
        except Exception as e:
            logger.error(f"Redis ttl error for key {key}: {e}")
            return None

    # Hash operations
    async def hset(self, key: str, field: str, value: Any) -> bool:
        """Set hash field"""
        if not self.is_connected:
            return False
            
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            await self.redis_client.hset(key, field, value)
            return True
        except Exception as e:
            logger.error(f"Redis hset error for key {key}.{field}: {e}")
            return False

    async def hget(self, key: str, field: str, default: Any = None) -> Any:
        """Get hash field"""
        if not self.is_connected:
            return default
            
        try:
            value = await self.redis_client.hget(key, field)
            if value is None:
                return default
                
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        except Exception as e:
            logger.error(f"Redis hget error for key {key}.{field}: {e}")
            return default

    async def hgetall(self, key: str) -> dict:
        """Get all hash fields"""
        if not self.is_connected:
            return {}
            
        try:
            return await self.redis_client.hgetall(key)
        except Exception as e:
            logger.error(f"Redis hgetall error for key {key}: {e}")
            return {}

    # Set operations
    async def sadd(self, key: str, *values) -> int:
        """Add to set"""
        if not self.is_connected:
            return 0
            
        try:
            return await self.redis_client.sadd(key, *values)
        except Exception as e:
            logger.error(f"Redis sadd error for key {key}: {e}")
            return 0

    async def smembers(self, key: str) -> set:
        """Get set members"""
        if not self.is_connected:
            return set()
            
        try:
            return await self.redis_client.smembers(key)
        except Exception as e:
            logger.error(f"Redis smembers error for key {key}: {e}")
            return set()

    # List operations
    async def lpush(self, key: str, *values) -> int:
        """Push to list"""
        if not self.is_connected:
            return 0
            
        try:
            serialized_values = [json.dumps(v) if isinstance(v, (dict, list)) else str(v) for v in values]
            return await self.redis_client.lpush(key, *serialized_values)
        except Exception as e:
            logger.error(f"Redis lpush error for key {key}: {e}")
            return 0

    async def lrange(self, key: str, start: int = 0, end: int = -1) -> list:
        """Get list range"""
        if not self.is_connected:
            return []
            
        try:
            values = await self.redis_client.lrange(key, start, end)
            result = []
            for v in values:
                try:
                    result.append(json.loads(v))
                except json.JSONDecodeError:
                    result.append(v)
            return result
        except Exception as e:
            logger.error(f"Redis lrange error for key {key}: {e}")
            return []

    async def ltrim(self, key: str, start: int, end: int) -> bool:
        """Trim list"""
        if not self.is_connected:
            return False
            
        try:
            await self.redis_client.ltrim(key, start, end)
            return True
        except Exception as e:
            logger.error(f"Redis ltrim error for key {key}: {e}")
            return False

    # Pattern matching
    async def keys(self, pattern: str) -> list:
        """Find keys by pattern"""
        if not self.is_connected:
            return []
            
        try:
            return await self.redis_client.keys(pattern)
        except Exception as e:
            logger.error(f"Redis keys error for pattern {pattern}: {e}")
            return []

    # Pipeline operations for bulk commands
    async def pipeline(self):
        """Get pipeline for bulk operations"""
        if not self.is_connected:
            return None
            
        return self.redis_client.pipeline()

# Global Redis instance
redis_manager = RedisManager()