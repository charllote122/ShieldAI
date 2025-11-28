import time
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging
from collections import defaultdict, Counter

from app.core.redis import redis_manager
from app.core.config import settings

logger = logging.getLogger(__name__)

class AnalyticsService:
    def __init__(self):
        self.redis = redis_manager
        
    async def track_analysis(self, analysis_result: Dict[str, Any], platform: str, user_id: str = None):
        """Track analysis results for real-time analytics"""
        try:
            timestamp = int(time.time())
            date_key = datetime.now().strftime("%Y-%m-%d")
            hour_key = datetime.now().strftime("%Y-%m-%d-%H")
            
            # Use pipeline for multiple operations
            pipeline = await self.redis.pipeline()
            
            # Real-time counters
            pipeline.incr("analytics:total_requests")
            
            if analysis_result.get("is_toxic"):
                pipeline.incr("analytics:toxic_requests")
            
            # Platform statistics
            pipeline.zadd("analytics:platforms", {platform: timestamp})
            pipeline.incr(f"analytics:platform:{platform}")
            
            # Hourly statistics
            pipeline.incr(f"analytics:hourly:{hour_key}:total")
            if analysis_result.get("is_toxic"):
                pipeline.incr(f"analytics:hourly:{hour_key}:toxic")
            
            # Daily aggregates
            pipeline.hincrby(f"analytics:daily:{date_key}", "total", 1)
            if analysis_result.get("is_toxic"):
                pipeline.hincrby(f"analytics:daily:{date_key}", "toxic", 1)
            
            # User behavior (anonymous)
            if user_id:
                user_hash = f"user:{hash(user_id)}"  # Anonymous tracking
                pipeline.hincrby(user_hash, "total_analyses", 1)
                if analysis_result.get("is_toxic"):
                    pipeline.hincrby(user_hash, "toxic_analyses", 1)
                pipeline.expire(user_hash, 30 * 24 * 3600)  # 30 days
            
            # Response time tracking
            processing_time = analysis_result.get("processing_time", 0)
            pipeline.rpush("analytics:response_times", processing_time)
            pipeline.ltrim("analytics:response_times", 0, 999)  # Keep last 1000
            
            await pipeline.execute()
            
        except Exception as e:
            logger.error(f"Analytics tracking failed: {e}")
    
    async def get_realtime_stats(self) -> Dict[str, Any]:
        """Get real-time statistics"""
        try:
            pipeline = await self.redis.pipeline()
            
            # Basic counts
            pipeline.get("analytics:total_requests")
            pipeline.get("analytics:toxic_requests")
            
            # Platform counts
            pipeline.zcard("analytics:platforms")
            
            # Response times
            pipeline.lrange("analytics:response_times", 0, -1)
            
            results = await pipeline.execute()
            
            total_requests = int(results[0] or 0)
            toxic_requests = int(results[1] or 0)
            platform_count = results[2] or 0
            response_times = [float(rt) for rt in (results[3] or [])]
            
            # Calculate metrics
            toxicity_rate = toxic_requests / total_requests if total_requests > 0 else 0
            avg_response_time = sum(response_times) / len(response_times) if response_times else 0
            
            return {
                "total_requests": total_requests,
                "toxic_requests": toxic_requests,
                "toxicity_rate": round(toxicity_rate, 4),
                "platform_count": platform_count,
                "avg_response_time": round(avg_response_time, 3),
                "response_time_samples": len(response_times),
                "timestamp": time.time()
            }
            
        except Exception as e:
            logger.error(f"Realtime stats failed: {e}")
            return self._get_fallback_stats()
    
    async def get_daily_stats(self, days: int = 7) -> Dict[str, Any]:
        """Get daily statistics for the last N days"""
        try:
            dates = []
            for i in range(days):
                date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
                dates.append(date)
            
            pipeline = await self.redis.pipeline()
            for date in dates:
                pipeline.hgetall(f"analytics:daily:{date}")
            
            results = await pipeline.execute()
            
            daily_stats = {}
            for i, date in enumerate(dates):
                data = results[i] or {}
                if data:
                    daily_stats[date] = {
                        "total": int(data.get("total", 0)),
                        "toxic": int(data.get("toxic", 0)),
                        "toxicity_rate": round(int(data.get("toxic", 0)) / max(1, int(data.get("total", 0))), 4)
                    }
            
            return {
                "period_days": days,
                "daily_stats": daily_stats,
                "total_requests": sum(day["total"] for day in daily_stats.values()),
                "total_toxic": sum(day["toxic"] for day in daily_stats.values())
            }
            
        except Exception as e:
            logger.error(f"Daily stats failed: {e}")
            return {"error": str(e)}
    
    async def get_platform_stats(self) -> Dict[str, int]:
        """Get statistics by platform"""
        try:
            # Get all platform keys
            platform_keys = await self.redis.keys("analytics:platform:*")
            
            pipeline = await self.redis.pipeline()
            for key in platform_keys:
                pipeline.get(key)
            
            results = await pipeline.execute()
            
            platform_stats = {}
            for i, key in enumerate(platform_keys):
                platform_name = key.split(":")[-1]
                count = int(results[i] or 0)
                platform_stats[platform_name] = count
            
            return platform_stats
            
        except Exception as e:
            logger.error(f"Platform stats failed: {e}")
            return {}
    
    async def cleanup_old_data(self, days_to_keep: int = 30):
        """Clean up analytics data older than specified days"""
        try:
            cutoff_date = (datetime.now() - timedelta(days=days_to_keep)).strftime("%Y-%m-%d")
            
            # Get all daily keys
            daily_keys = await self.redis.keys("analytics:daily:*")
            keys_to_delete = []
            
            for key in daily_keys:
                date_str = key.split(":")[-1]
                if date_str < cutoff_date:
                    keys_to_delete.append(key)
            
            # Get old hourly keys (keep only 48 hours)
            hourly_cutoff = (datetime.now() - timedelta(hours=48)).strftime("%Y-%m-%d-%H")
            hourly_keys = await self.redis.keys("analytics:hourly:*")
            
            for key in hourly_keys:
                hour_str = key.split(":")[-1]
                if hour_str < hourly_cutoff:
                    keys_to_delete.append(key)
            
            if keys_to_delete:
                deleted = await self.redis.delete(*keys_to_delete)
                logger.info(f"Cleaned up {deleted} old analytics keys")
                
            return len(keys_to_delete)
            
        except Exception as e:
            logger.error(f"Analytics cleanup failed: {e}")
            return 0
    
    def _get_fallback_stats(self) -> Dict[str, Any]:
        """Fallback statistics when Redis is unavailable"""
        return {
            "total_requests": 0,
            "toxic_requests": 0,
            "toxicity_rate": 0.0,
            "platform_count": 0,
            "avg_response_time": 0.0,
            "response_time_samples": 0,
            "timestamp": time.time(),
            "fallback": True
        }

# Global analytics service instance
analytics_service = AnalyticsService()