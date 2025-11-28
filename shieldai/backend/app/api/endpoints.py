from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from fastapi_limiter.depends import RateLimiter
from typing import List, Optional
import logging

from app.core.config import settings
from app.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    BatchAnalyzeRequest,
    StatsResponse,
    HealthResponse
)
from app.services.ai_engine import ShieldAIEngine
from app.services.analytics import AnalyticsService
from app.api.dependencies import get_ai_engine, get_analytics_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    summary="Analyze text for toxicity",
    description="Analyze text content for harmful language with African context awareness",
    dependencies=[Depends(RateLimiter(times=settings.RATE_LIMIT_PER_MINUTE, minutes=1))]
)
async def analyze_text(
    request: AnalyzeRequest,
    background_tasks: BackgroundTasks,
    ai_engine: ShieldAIEngine = Depends(get_ai_engine),
    analytics: AnalyticsService = Depends(get_analytics_service)
):
    """
    Analyze text for toxic content with comprehensive scoring and African context analysis.
    """
    try:
        result = await ai_engine.analyze_optimized(
            text=request.text,
            platform=request.platform,
            language=request.language
        )
        
        # Track analytics in background
        background_tasks.add_task(
            analytics.track_analysis,
            analysis_result=result,
            platform=request.platform,
            user_id=request.user_id
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Text analysis failed")

@router.post(
    "/analyze/batch",
    summary="Batch analyze texts",
    description="Analyze multiple texts in a single request for efficiency",
    dependencies=[Depends(RateLimiter(times=10, minutes=1))]
)
async def analyze_batch(
    request: BatchAnalyzeRequest,
    ai_engine: ShieldAIEngine = Depends(get_ai_engine)
):
    """
    Analyze multiple texts in batch for better performance.
    """
    try:
        results = await ai_engine.batch_analyze(
            texts=request.texts,
            platform=request.platform
        )
        
        return {
            "results": results,
            "total_processed": len(results),
            "toxic_count": sum(1 for r in results if r["is_toxic"]),
            "batch_id": analytics.generate_batch_id()
        }
        
    except Exception as e:
        logger.error(f"Batch analysis failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Batch analysis failed")

@router.get(
    "/stats",
    response_model=StatsResponse,
    summary="Get system statistics",
    description="Retrieve real-time statistics about the ShieldAI system"
)
async def get_statistics(
    analytics: AnalyticsService = Depends(get_analytics_service)
):
    """
    Get comprehensive system statistics and analytics.
    """
    try:
        stats = await analytics.get_system_stats()
        return stats
    except Exception as e:
        logger.error(f"Stats retrieval failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Statistics unavailable")

@router.get(
    "/resources/{country}",
    summary="Get support resources",
    description="Get local support resources for survivors of digital violence"
)
async def get_resources(
    country: str,
    resource_type: Optional[str] = Query(None, description="Filter by resource type")
):
    """
    Get support resources for specific countries.
    """
    try:
        resources = await get_support_resources(country.upper(), resource_type)
        if not resources:
            raise HTTPException(status_code=404, detail=f"No resources found for {country}")
        return resources
    except Exception as e:
        logger.error(f"Resources retrieval failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Resources unavailable")

@router.get(
    "/languages/supported",
    summary="Get supported languages",
    description="Get list of supported languages for analysis"
)
async def get_supported_languages(
    ai_engine: ShieldAIEngine = Depends(get_ai_engine)
):
    """
    Get list of languages supported by the AI engine.
    """
    return ai_engine.get_supported_languages()

@router.get("/health", response_model=HealthResponse, include_in_schema=False)
async def health_check():
    """
    Comprehensive health check endpoint.
    """
    return {
        "status": "healthy",
        "service": "ShieldAI API",
        "version": settings.VERSION,
        "timestamp": time.time()
    }