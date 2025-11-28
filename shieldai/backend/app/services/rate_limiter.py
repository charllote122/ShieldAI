import time
from typing import Optional, Tuple
import logging
from app.core.redis import redis_manager
from app.core.config import settings

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(self):
        self.windows = {
            'minute': 60,
            'hour': 3600,
            'day': 86400
        }
    
    async def is_rate_limited(
        self, 
        identifier: str, 
        limit: int, 
        window: int,
        cost: int = 1
    ) -> Tuple[bool, dict]:
        """
        Check if request should be rate limited using sliding window algorithm
        """
        try:
            key = f"rate_limit:{identifier}:{window}"
            current_time = time.time()
            window_start = current_time - window
            
            # Use Redis pipeline for atomic operations
            pipeline = await redis_manager.pipeline()
            
            # Remove old timestamps
            pipeline.zremrangebyscore(key, 0, window_start)
            
            # Count current requests in window
            pipeline.zcard(key)
            
            # Add current request
            pipeline.zadd(key, {str(current_time): current_time})
            
            # Set expiration
            pipeline.expire(key, window + 10)  # Extra 10 seconds grace period
            
            results = await pipeline.execute()
            
            current_count = results[1] if results else 0
            
            # Check if limit exceeded
            if current_count + cost > limit:
                # Get oldest timestamp to calculate reset time
                oldest = await redis_manager.zrange(key, 0, 0, withscores=True)
                reset_time = oldest[0][1] + window if oldest else current_time + window
                
                return True, {
                    "limit": limit,
                    "remaining": 0,
                    "reset_time": reset_time,
                    "retry_after": max(0, reset_time - current_time)
                }
            
            return False, {
                "limit": limit,
                "remaining": limit - (current_count + cost),
                "reset_time": current_time + window,
                "retry_after": 0
            }
            
        except Exception as e:
            logger.error(f"Rate limit check failed for {identifier}: {e}")
            # Fail open - don't rate limit if Redis is down
            return False, {
                "limit": limit,
                "remaining": limit,
                "reset_time": time.time() + window,
                "retry_after": 0
            }
    
    async def check_api_rate_limit(
        self, 
        user_id: Optional[str] = None, 
        ip_address: Optional[str] = None
    ) -> Tuple[bool, dict]:
        """
        Check rate limits for API endpoints
        """
        identifier = user_id or ip_address or "anonymous"
        
        limits = [
            (settings.RATE_LIMIT_PER_MINUTE, self.windows['minute']),
            (settings.RATE_LIMIT_PER_HOUR, self.windows['hour']),
        ]
        
        for limit, window in limits:
            is_limited, details = await self.is_rate_limited(
                f"{identifier}:{window}", limit, window
            )
            if is_limited:
                return True, details
        
        return False, {
            "limit": limits[0][0],
            "remaining": limits[0][0],
            "reset_time": time.time() + self.windows['minute'],
            "retry_after": 0
        }

# Global rate limiter instance
rate_limiter = RateLimiter()