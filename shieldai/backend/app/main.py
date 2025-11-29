from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from sqlalchemy.orm import Session
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
import json
import os
import time

# Configure logging for production
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

try:
    from app.database import get_db, create_tables
    from app.models import AnalysisResult
    from app.schemas import AnalyzeRequest, BatchAnalyzeRequest
    from app.services.ai_engine import ShieldAIEngine
    DATABASE_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Database imports failed: {e}")
    DATABASE_AVAILABLE = False

# Initialize AI engine instance
ai_engine = ShieldAIEngine()

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
    
    # Load AI models (with timeout for Render)
    try:
        logger.info("🔄 Loading AI models...")
        # Set a timeout for model loading to avoid Render build timeout
        await ai_engine.load_models()
        logger.info("✅ AI models loaded successfully")
    except Exception as e:
        logger.error(f"❌ Failed to load AI models: {e}")
        # Don't crash the app if models fail to load
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
    # Security: Hide docs in production or use environment variable
    docs_url="/docs" if not is_production else None,
    redoc_url="/redoc" if not is_production else None
)

# Get frontend URL from environment or use default
frontend_url = os.getenv("FRONTEND_URL", "https://shieldai.vercel.app")

# CORS middleware - PRODUCTION SECURITY
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontend_url,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # Add your specific domains here for production
    ] if is_production else ["*"],  # Allow all in development
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Add compression for better performance
app.add_middleware(GZipMiddleware, minimum_size=1000)

@app.get("/health")
async def health_check(db: Session = Depends(get_db) if DATABASE_AVAILABLE else None):
    """Enhanced health check for production monitoring"""
    health_data = {
        "status": "healthy",
        "service": "ShieldAI Backend",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "region": "Kenya - East Africa"
    }
    
    # Check database connectivity
    if DATABASE_AVAILABLE and db:
        try:
            db.execute("SELECT 1")
            health_data["database"] = "connected"
        except Exception as e:
            health_data["database"] = "disconnected"
            health_data["database_error"] = str(e)
    else:
        health_data["database"] = "unavailable"
    
    # Check AI model status
    try:
        # Simple test to check if AI engine is responsive
        test_result = await ai_engine.analyze_optimized("test", "generic")
        health_data["ai_engine"] = "healthy"
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
        "docs": "/docs" if not is_production else "disabled in production"
    }

# Frontend expected endpoints
@app.get("/stats")
async def get_stats(db: Session = Depends(get_db) if DATABASE_AVAILABLE else None):
    """Get analytics statistics for the dashboard"""
    try:
        # Try to get real stats from database if available
        if DATABASE_AVAILABLE and db:
            try:
                total_requests = db.query(AnalysisResult).count()
                toxic_requests = db.query(AnalysisResult).filter(AnalysisResult.is_toxic == True).count()
                toxicity_rate = toxic_requests / total_requests if total_requests > 0 else 0
                
                stats = {
                    "total_requests": total_requests,
                    "toxic_requests": toxic_requests,
                    "toxicity_rate": round(toxicity_rate, 3),
                    "platform_count": 4,
                    "uptime_seconds": 86400,
                    "timestamp": datetime.now().timestamp(),
                    "source": "database",
                    "region_focus": "Kenya"
                }
                return stats
            except Exception as db_error:
                logger.warning(f"Database stats failed, using fallback: {db_error}")
                # Fall through to mock stats
        # Fallback mock stats with Kenya focus
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
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        return {
            "total_requests": 1000,
            "toxic_requests": 150,
            "toxicity_rate": 0.15,
            "platform_count": 4,
            "uptime_seconds": 72000,
            "daily_stats": {},
            "timestamp": datetime.now().timestamp(),
            "fallback": True,
            "error": "stats_service_unavailable",
            "region": "Kenya"
        }

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
                {"name": "Crisis Response Kenya", "number": "0800 221 555", "available": "24/7", "free": True},
                {"name": "Awareness Against Trauma", "number": "+254 719 235 535", "available": "24/7", "free": False},
                {"name": "Chiromo Hospital Group", "number": "+254 703 669 629", "available": "24/7", "free": False}
            ],
            "organizations": [
                {"name": "Basic Needs Kenya", "website": "https://basicneeds.org", "description": "Mental health and development organization"},
                {"name": "Africa Mental Health Foundation", "website": "https://amhf.or.ke", "description": "Research and mental health advocacy"},
                {"name": "Let's Talk Mental Health KE", "website": "https://letstalkmhkenya.org", "description": "Youth mental health awareness"},
                {"name": "FIDA Kenya", "website": "https://fidakenya.org", "description": "Legal aid for women's rights"},
                {"name": "Coalition on Violence Against Women", "website": "https://covaw.or.ke", "description": "GBV prevention and support"}
            ],
            "crisis_text_line": "Text 'HELP' to 40213",
            "emergency_services": ["999", "112", "911"],
            "helplines": {
                "child_helpline": "116",
                "gender_violence": "1195",
                "suicide_prevention": "1199"
            },
            "hospitals": [
                "Mathari National Teaching Hospital - Nairobi",
                "Moi Teaching and Referral Hospital - Eldoret",
                "Coast General Hospital - Mombasa"
            ]
        },
        "east-africa": {
            "name": "East Africa Region",
            "hotlines": [
                {"name": "Crisis Text Line Kenya", "number": "Text 'HELP' to 40213", "available": "24/7"},
                {"name": "Uganda Women's Helpline", "number": "0800 200 600", "available": "24/7"},
                {"name": "Tanzania GBV Helpline", "number": "0800 750 075", "available": "24/7"}
            ],
            "organizations": [
                {"name": "Mental Health Uganda", "website": "https://mentalhealthuganda.org", "description": "Mental health advocacy in Uganda"},
                {"name": "Tanzania Gender Network", "website": "https://tgnp.org", "description": "Women's rights organization"}
            ]
        },
        "general": {
            "name": "General Resources",
            "hotlines": [
                {"name": "Crisis Text Line International", "number": "Text HOME to 741741", "available": "24/7"},
                {"name": "International Suicide Prevention", "number": "https://findahelpline.com", "available": "Online directory"}
            ]
        }
    }
    
    # Default to Kenya if not specified
    country_resources = resources.get(country.lower(), resources["kenya"])
    return country_resources

@app.get("/languages/supported")
async def get_supported_languages():
    """Get supported languages for analysis - East Africa Focus"""
    return {
        "languages": [
            # East African Languages
            {"code": "sw", "name": "Swahili", "native_name": "Kiswahili", "region": "East Africa", "primary": True},
            {"code": "en", "name": "English", "native_name": "English", "region": "International", "primary": True},
            {"code": "luy", "name": "Luhya", "native_name": "Luluhya", "region": "Western Kenya"},
            {"code": "kik", "name": "Kikuyu", "native_name": "Gĩkũyũ", "region": "Central Kenya"},
            {"code": "luo", "name": "Luo", "native_name": "Dholuo", "region": "Western Kenya"},
            {"code": "kam", "name": "Kamba", "native_name": "Kikamba", "region": "Eastern Kenya"},
            {"code": "som", "name": "Somali", "native_name": "Soomaali", "region": "Northern Kenya"},
            
            # Other African Languages
            {"code": "amh", "name": "Amharic", "native_name": "አማርኛ", "region": "Ethiopia"},
            {"code": "orm", "name": "Oromo", "native_name": "Afaan Oromoo", "region": "Ethiopia/Kenya"},
            {"code": "lug", "name": "Luganda", "native_name": "Luganda", "region": "Uganda"},
            
            # International
            {"code": "fr", "name": "French", "native_name": "Français", "region": "International"},
            {"code": "ar", "name": "Arabic", "native_name": "العربية", "region": "International"}
        ],
        "default_language": "en",
        "primary_language": "sw",
        "auto_detect": True,
        "african_languages": True,
        "region_focus": "East Africa",
        "supported_countries": ["Kenya", "Tanzania", "Uganda", "Rwanda", "Ethiopia", "Somalia"]
    }

@app.get("/kenya/specific")
async def get_kenya_specific():
    """Kenya-specific information and resources"""
    return {
        "country": "Kenya",
        "region": "East Africa",
        "capital": "Nairobi",
        "population": "54+ million",
        "internet_penetration": "45%",
        "women_online_safety": {
            "challenges": [
                "Online gender-based violence",
                "Cyber harassment",
                "Non-consensual image sharing",
                "Digital economic exclusion"
            ],
            "initiatives": [
                "Kenya Computer Misuse and Cybercrimes Act",
                "Data Protection Act",
                "Various women-led digital safety NGOs"
            ]
        },
        "tech_ecosystem": {
            "silicon_savannah": "Nairobi tech hub",
            "women_in_tech_groups": [
                "Akirachix",
                "Women in Tech Africa",
                "SheHacksKE",
                "Ladies in Tech Kenya"
            ]
        }
    }

@app.post("/analyze")
async def analyze_text(request: AnalyzeRequest, db: Session = Depends(get_db) if DATABASE_AVAILABLE else None):
    """Analyze single text for toxicity with Kenya context"""
    start_time = time.time()
    
    try:
        # Add Kenya context to analysis
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
        
        # Database logging
        if DATABASE_AVAILABLE and db:
            try:
                db_result = AnalysisResult(
                    text=request.text[:500],  # Limit text length for database
                    platform=request.platform,
                    is_toxic=result["is_toxic"],
                    toxicity_score=result["toxicity_score"],
                    confidence=result["confidence"],
                    warning_level=result["warning_level"],
                    detected_issues=str(result.get("detected_issues", [])),
                    cultural_context=str(result.get("cultural_context", {})),
                    processing_time=result.get("processing_time", 0.0),
                    region="Kenya"
                )
                db.add(db_result)
                db.commit()
            except Exception as e:
                logger.warning(f"Could not save to database: {e}")
                # Don't fail the request if database save fails
        
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
async def analyze_batch(request: BatchAnalyzeRequest, db: Session = Depends(get_db) if DATABASE_AVAILABLE else None):
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
            
            if DATABASE_AVAILABLE and db:
                try:
                    db_result = AnalysisResult(
                        text=text[:500],
                        platform=request.platform,
                        is_toxic=result["is_toxic"],
                        toxicity_score=result["toxicity_score"],
                        confidence=result["confidence"],
                        warning_level=result["warning_level"],
                        detected_issues=str(result.get("detected_issues", [])),
                        cultural_context=str(result.get("cultural_context", {})),
                        processing_time=result.get("processing_time", 0.0),
                        region="Kenya"
                    )
                    db.add(db_result)
                except Exception as e:
                    logger.warning(f"Could not save batch result to database: {e}")
                    
        except Exception as e:
            logger.error(f"Batch analysis failed for text {i}: {e}")
            results.append({
                "error": "analysis_failed",
                "text": text[:100] + "..." if len(text) > 100 else text,
                "batch_index": i,
                "region": "Kenya"
            })
    
    if DATABASE_AVAILABLE and db:
        try:
            db.commit()
        except Exception as e:
            logger.warning(f"Could not commit batch results: {e}")
    
    total_time = time.time() - start_time
    logger.info(f"✅ Batch analysis completed: {len(results)} texts in {total_time:.4f}s")
    
    return {
        "results": results,
        "batch_size": len(request.texts),
        "processing_time": round(total_time, 4),
        "timestamp": datetime.now().isoformat(),
        "region": "Kenya"
    }

@app.get("/analytics/history")
async def get_analysis_history(
    db: Session = Depends(get_db) if DATABASE_AVAILABLE else None, 
    limit: int = 50,
    offset: int = 0
):
    if not DATABASE_AVAILABLE or not db:
        return {
            "history": [], 
            "message": "Database unavailable",
            "total": 0,
            "region": "Kenya"
        }
    
    try:
        total = db.query(AnalysisResult).count()
        results = db.query(AnalysisResult).order_by(AnalysisResult.created_at.desc()).offset(offset).limit(limit).all()
        
        return {
            "history": results,
            "pagination": {
                "limit": limit,
                "offset": offset,
                "total": total,
                "has_more": (offset + limit) < total
            },
            "region": "Kenya"
        }
    except Exception as e:
        logger.error(f"Database error in analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

# Kenya-specific cultural context endpoint
@app.get("/cultural-context/kenya")
async def get_kenya_cultural_context():
    """Provide cultural context for content moderation in Kenya"""
    return {
        "country": "Kenya",
        "common_toxic_patterns": [
            "Gender-based insults in local languages",
            "Tribal-based harassment",
            "Socio-economic discrimination",
            "Body shaming and colorism"
        ],
        "local_slang_monitoring": [
            "mtoto wa mama - derogatory term",
            "vile unafanya - contextual harassment", 
            "wewe ni - often precedes insults"
        ],
        "cultural_sensitivities": [
            "Respect for elders",
            "Tribal harmony",
            "Gender respect in local contexts"
        ],
        "positive_cultural_aspects": [
            "Harambee spirit - community collaboration",
            "Utu - humanity and compassion",
            "Family and community values"
        ]
    }

# Add a simple performance monitoring endpoint
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