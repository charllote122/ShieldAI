from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from sqlalchemy.sql import func
from app.database import Base

class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    
    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    platform = Column(String(50), nullable=False)
    is_toxic = Column(Boolean, default=False)
    toxicity_score = Column(Float, default=0.0)
    confidence = Column(Float, default=0.0)
    warning_level = Column(String(20), default="low")
    detected_issues = Column(Text, default="[]")
    cultural_context = Column(Text, default="{}")
    processing_time = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
