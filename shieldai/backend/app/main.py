from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
import json
import os
import time
import sys
import asyncio

# Add current directory to Python path
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# Configure logging for production
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import ShieldAIEngine with proper error handling
try:
    from app.services.ai_engine import ShieldAIEngine
    ai_engine = ShieldAIEngine()
    AI_ENGINE_AVAILABLE = True
    logger.info("✅ AI Engine loaded successfully")
except ImportError as e:
    logger.error(f"❌ Failed to load AI Engine: {e}")
    AI_ENGINE_AVAILABLE = False
    # Create a mock engine if import fails
    class MockAIEngine:
        async def load_models(self):
            logger.info("🔄 Mock AI models loaded")
        async def analyze_optimized(self, text, platform, context=None):
            return {
                "is_toxic": False,
                "toxicity_score": 0.1,
                "confidence": 0.9,
                "warning_level": "low",
                "detected_issues": [],
                "processing_time": 0.05,
                "cultural_context": {"region": "Kenya"}
            }
    ai_engine = MockAIEngine()

# Database imports with error handling
try:
    from app.database import get_db, create_tables
    from app.models import AnalysisResult
    from app.schemas import AnalyzeRequest, BatchAnalyzeRequest
    DATABASE_AVAILABLE = True
    logger.info("✅ Database imports successful")
    
    # Mock get_db for health check if database fails
    def get_db_mock():
        return None
        
except ImportError as e:
    logger.warning(f"Database imports failed: {e}")
    DATABASE_AVAILABLE = False
    # Create mock functions
    def get_db():
        return None
    def create_tables():
        pass
    class AnalysisResult:
        pass
    class AnalyzeRequest:
        def __init__(self, text="", platform="generic"):
            self.text = text
            self.platform = platform
    class BatchAnalyzeRequest:
        def __init__(self, texts=None, platform="generic"):
            self.texts = texts or []
            self.platform = platform

@asynccontextmanager
async def lifespan(app: FastAPI):
    startup_time = time.time()
    logger.info("🚀 Starting ShieldAI Backend...")
    
    # Database initialization
    if DATABASE_AVAILABLE:
        try:
            create_tables()
            logger.info("✅ Database tables created")
        except Exception as e:
            logger.warning(f"Could not create database tables: {e}")
    
    # Load AI models
    try:
        logger.info("🔄 Loading AI models...")
        await ai_engine.load_models()
        logger.info("✅ AI models loaded successfully")
    except Exception as e:
        logger.error(f"❌ Failed to load AI models: {e}")
        logger.info("🔄 Continuing without AI models - will use fallback")
    
    startup_duration = time.time() - startup_time
    logger.info(f"✅ Startup completed in {startup_duration:.2f} seconds")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down ShieldAI Backend...")

# Production settings
is_production = os.getenv("ENVIRONMENT") == "production"

app = FastAPI(
    title="ShieldAI API",
    description="AI-Powered Digital Protection for African Women",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add compression for better performance
app.add_middleware(GZipMiddleware, minimum_size=1000)

@app.get("/health")
async def health_check():
    """Enhanced health check for production monitoring"""
    health_data = {
        "status": "healthy",
        "service": "ShieldAI Backend",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "region": "Kenya - East Africa",
        "database": "unavailable",
        "ai_engine": "healthy" if AI_ENGINE_AVAILABLE else "mock"
    }
    
    # Check AI model status
    try:
        test_result = await ai_engine.analyze_optimized("test", "generic")
        health_data["ai_response_time"] = test_result.get("processing_time", 0)
    except Exception as e:
        health_data["ai_engine"] = "unhealthy"
        health_data["ai_error"] = str(e)
    
    return health_data

@app.get("/")
async def root():
    return {
        "message": "ShieldAI Content Moderation API - Protecting Women in Kenya & Beyond",
        "version": "1.0.0",
        "status": "operational",
        "region_focus": "Kenya & East Africa",
        "docs": "/docs"
    }

@app.get("/stats")
async def get_stats():
    """Get analytics statistics for the dashboard"""
    today = datetime.now().date().isoformat()
    stats = {
        "total_requests": 2847,
        "toxic_requests": 426,
        "toxicity_rate": 0.15,
        "platform_count": 4,
        "uptime_seconds": 86400,
        "region_focus": "Kenya",
        "cities_served": ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"],
        "daily_stats": {
            today: {
                "total_analyses": 187,
                "toxic_analyses": 28,
                "platforms": {
                    "twitter": 65,
                    "facebook": 45,
                    "instagram": 52,
                    "whatsapp": 25
                }
            }
        },
        "timestamp": datetime.now().timestamp(),
        "fallback": True,
        "source": "mock"
    }
    return stats

@app.get("/resources/{country}")
async def get_resources(country: str):
    """Get mental health resources for a specific country - Kenya Focus"""
    resources = {
        "kenya": {
            "name": "Kenya",
            "country_code": "KE",
            "hotlines": [
                {"name": "Kenya Mental Health Hotline", "number": "1199", "available": "24/7", "free": True},
                {"name": "Nairobi Women's Hospital GBV Hotline", "number": "0800 720 715", "available": "24/7", "free": True},
            ],
            "organizations": [
                {"name": "Basic Needs Kenya", "website": "https://basicneeds.org", "description": "Mental health and development organization"},
                {"name": "Africa Mental Health Foundation", "website": "https://amhf.or.ke", "description": "Research and mental health advocacy"},
            ],
            "crisis_text_line": "Text 'HELP' to 40213",
            "emergency_services": ["999", "112", "911"],
        }
    }
    
    country_resources = resources.get(country.lower(), resources["kenya"])
    return country_resources

@app.get("/languages/supported")
async def get_supported_languages():
    """Get supported languages for analysis - East Africa Focus"""
    return {
        "languages": [
            {"code": "sw", "name": "Swahili", "native_name": "Kiswahili", "region": "East Africa", "primary": True},
            {"code": "en", "name": "English", "native_name": "English", "region": "International", "primary": True},
        ],
        "default_language": "en",
        "primary_language": "sw",
        "auto_detect": True,
        "african_languages": True,
        "region_focus": "East Africa",
        "supported_countries": ["Kenya", "Tanzania", "Uganda", "Rwanda", "Ethiopia", "Somalia"]
    }

@app.post("/analyze")
async def analyze_text(request: AnalyzeRequest):
    """Analyze single text for toxicity with Kenya context"""
    start_time = time.time()
    
    try:
        analysis_context = {
            "platform": request.platform,
            "region": "Kenya",
            "cultural_context": "east_africa"
        }
        
        result = await ai_engine.analyze_optimized(request.text, request.platform, analysis_context)
        
        # Add request metadata
        result["request_id"] = f"req_{int(start_time)}"
        result["timestamp"] = datetime.now().isoformat()
        result["region"] = "Kenya"
        
        total_processing_time = time.time() - start_time
        result["total_processing_time"] = round(total_processing_time, 4)
        
        logger.info(f"✅ Analysis completed in {total_processing_time:.4f}s - Toxicity: {result['toxicity_score']}")
        return result
        
    except Exception as e:
        logger.error(f"❌ Analysis failed: {e}")
        raise HTTPException(
            status_code=500, 
            detail={
                "error": "analysis_failed",
                "message": "Unable to analyze text",
                "request_id": f"req_{int(start_time)}",
                "region": "Kenya"
            }
        )

@app.post("/analyze/batch")
async def analyze_batch(request: BatchAnalyzeRequest):
    """Analyze multiple texts in batch with Kenya context"""
    start_time = time.time()
    results = []
    
    for i, text in enumerate(request.texts):
        try:
            analysis_context = {
                "platform": request.platform,
                "region": "Kenya",
                "cultural_context": "east_africa"
            }
            
            result = await ai_engine.analyze_optimized(text, request.platform, analysis_context)
            result["batch_index"] = i
            result["region"] = "Kenya"
            results.append(result)
                    
        except Exception as e:
            logger.error(f"Batch analysis failed for text {i}: {e}")
            results.append({
                "error": "analysis_failed",
                "text": text[:100] + "..." if len(text) > 100 else text,
                "batch_index": i,
                "region": "Kenya"
            })
    
    total_time = time.time() - start_time
    logger.info(f"✅ Batch analysis completed: {len(results)} texts in {total_time:.4f}s")
    
    return {
        "results": results,
        "batch_size": len(request.texts),
        "processing_time": round(total_time, 4),
        "timestamp": datetime.now().isoformat(),
        "region": "Kenya"
    }

@app.get("/cultural-context/kenya")
async def get_kenya_cultural_context():
    """Provide cultural context for content moderation in Kenya"""
    return {
        "country": "Kenya",
        "common_toxic_patterns": [
            "Gender-based insults in local languages",
            "Tribal-based harassment",
            "Socio-economic discrimination",
        ],
        "cultural_sensitivities": [
            "Respect for elders",
            "Tribal harmony",
            "Gender respect in local contexts"
        ]
    }

@app.get("/performance")
async def get_performance():
    return {
        "timestamp": datetime.now().isoformat(),
        "environment": os.getenv("ENVIRONMENT", "development"),
        "service": "ShieldAI API",
        "status": "operational",
        "region": "Kenya",
        "server_location": "East Africa"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
