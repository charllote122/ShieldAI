from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class AnalyzeRequest(BaseModel):
    text: str
    platform: str = "general"
    language: Optional[str] = "auto"

class BatchAnalyzeRequest(BaseModel):
    texts: List[str]
    platform: str = "general"

class AnalyzeResponse(BaseModel):
    is_toxic: bool
    toxicity_score: float
    confidence: float
    warning_level: str
    detected_issues: List[str]
    cultural_context: Dict[str, Any]
    processing_time: float

class HealthResponse(BaseModel):
    status: str
    message: str
    timestamp: str
