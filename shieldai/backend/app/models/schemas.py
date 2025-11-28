from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class AnalyzeRequest(BaseModel):
    text: str
    platform: str = "general"
    language: str = "auto"
    user_id: Optional[str] = None


class AnalyzeResponse(BaseModel):
    is_toxic: bool
    confidence: float
    toxicity_score: float
    suggested_rewrite: Optional[str] = None
    detected_issues: List[str] = []
    warning_level: str = "none"
    cultural_context: Dict[str, Any] = {}
    processing_time: float = 0.0
    message_id: Optional[str] = None


class BatchAnalyzeRequest(BaseModel):
    texts: List[str]
    platform: str = "general"


class StatsResponse(BaseModel):
    total_requests: int
    toxic_requests: int
    toxicity_rate: float
    average_response_time: float


class HealthResponse(BaseModel):
    status: str
    service: str
    version: Optional[str] = None
    timestamp: Optional[float] = None
