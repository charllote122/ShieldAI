import logging
from typing import Dict, Any, List
import time

logger = logging.getLogger(__name__)

class ShieldAIEngine:
    def __init__(self):
        logger.info("🛡️ ShieldAI Engine initializing...")
        self.models_loaded = False
        self.toxicity_model = None
        self.tokenizer = None
        
    async def load_models(self):
        """Load ML models for content moderation"""
        if not self.models_loaded:
            try:
                logger.info("Loading AI models...")
                
                # Try to load real models if transformers is available
                try:
                    from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
                    
                    # Load a pre-trained toxicity detection model
                    logger.info("Loading toxicity detection model...")
                    self.toxicity_model = pipeline(
                        "text-classification",
                        model="unitary/unbiased-toxic-roberta",
                        tokenizer="unitary/unbiased-toxic-roberta",
                        top_k=None
                    )
                    logger.info("✅ Toxicity model loaded successfully")
                    
                except ImportError:
                    logger.warning("Transformers not available, using placeholder models")
                    self.toxicity_model = None
                
                self.models_loaded = True
                logger.info("✅ AI models loaded")
                
            except Exception as e:
                logger.error(f"❌ Failed to load AI models: {e}")
                logger.info("🔄 Using fallback analysis mode")
                self.models_loaded = True  # Mark as loaded to use fallback
    
    async def analyze_optimized(self, text: str, platform: str = "general") -> Dict[str, Any]:
        """Analyze text for toxicity with real ML models or fallback"""
        start_time = time.time()
        
        try:
            # Use real ML model if available
            if self.toxicity_model and self.models_loaded:
                return await self._analyze_with_ml(text, platform, start_time)
            else:
                return await self._analyze_fallback(text, platform, start_time)
                
        except Exception as e:
            logger.error(f"Analysis error: {e}")
            return await self._analyze_fallback(text, platform, start_time)
    
    async def _analyze_with_ml(self, text: str, platform: str, start_time: float) -> Dict[str, Any]:
        """Analyze text using real ML models"""
        try:
            # Use the toxicity model
            results = self.toxicity_model(text)
            
            # Extract toxicity score (assuming the model returns probabilities)
            toxicity_score = 0.0
            is_toxic = False
            
            for result in results[0]:
                if result['label'] in ['toxic', 'hate', 'insult', 'obscene', 'threat', 'identity_hate']:
                    toxicity_score = max(toxicity_score, result['score'])
            
            is_toxic = toxicity_score > 0.7
            confidence = toxicity_score
            
            # Determine warning level
            if is_toxic:
                warning_level = "high" if toxicity_score > 0.8 else "medium"
            else:
                warning_level = "low"
            
            # Detect specific issues
            detected_issues = []
            if toxicity_score > 0.7:
                detected_issues.append("toxicity")
            
            # Add platform-specific context
            cultural_context = {
                "platform": platform,
                "language": "en",  # Could detect language here
                "region": "global",
                "model_used": "unbiased-toxic-roberta"
            }
            
            processing_time = time.time() - start_time
            
            return {
                "is_toxic": is_toxic,
                "toxicity_score": round(toxicity_score, 4),
                "confidence": round(confidence, 4),
                "warning_level": warning_level,
                "detected_issues": detected_issues,
                "cultural_context": cultural_context,
                "processing_time": round(processing_time, 4),
                "model_type": "ml"
            }
            
        except Exception as e:
            logger.error(f"ML analysis failed: {e}")
            return await self._analyze_fallback(text, platform, start_time)
    
    async def _analyze_fallback(self, text: str, platform: str, start_time: float) -> Dict[str, Any]:
        """Fallback analysis when ML models are unavailable"""
        # Simple heuristic-based analysis
        toxicity_score = len(text) * 0.01  # Basic placeholder
        is_toxic = toxicity_score > 0.7
        confidence = min(toxicity_score * 1.2, 1.0)
        
        if is_toxic:
            warning_level = "high" if toxicity_score > 0.8 else "medium"
        else:
            warning_level = "low"
        
        detected_issues = []
        text_lower = text.lower()
        
        # Simple keyword detection
        toxic_keywords = ['hate', 'kill', 'violence', 'stupid', 'idiot', 'attack']
        for keyword in toxic_keywords:
            if keyword in text_lower:
                detected_issues.append(f"{keyword}_related")
                break
        
        cultural_context = {
            "platform": platform,
            "language": "en",
            "region": "global",
            "model_used": "fallback"
        }
        
        processing_time = time.time() - start_time
        
        return {
            "is_toxic": is_toxic,
            "toxicity_score": round(toxicity_score, 4),
            "confidence": round(confidence, 4),
            "warning_level": warning_level,
            "detected_issues": detected_issues,
            "cultural_context": cultural_context,
            "processing_time": round(processing_time, 4),
            "model_type": "fallback"
        }
