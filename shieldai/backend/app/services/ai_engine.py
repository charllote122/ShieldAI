import logging
import re
from datetime import datetime

logger = logging.getLogger(__name__)

class ShieldAIEngine:
    def __init__(self):
        self.use_ai = False  # Use rule-based for now
        self.toxic_patterns = [
            # Gender-based harassment
            (r'(women|girls|females).*(belong|should|stay).*(kitchen|home|cook)', 0.9, 'gender_harassment'),
            (r'(female|woman).*(not|shouldn\'t|can\'t).*(code|tech|stem)', 0.8, 'gender_harassment'),
            (r'(make me a sandwich|cook for me)', 0.7, 'gender_harassment'),
            
            # Direct insults and threats
            (r'(stupid|idiot|moron|retard|dumb).*(woman|girl|female)', 0.8, 'personal_attack'),
            (r'(ugly|fat|disgusting|worthless).*(bitch|slut|whore)', 0.9, 'personal_attack'),
            (r'(kill|hurt|attack|beat).*(you|her|women)', 0.95, 'threat'),
            (r'(die|death|suicide).*(yourself|herself)', 0.9, 'severe_threat'),
            
            # Kenya-specific context
            (r'(na wash|you fit|go marry|husband will)', 0.6, 'cultural_harassment'),
            (r'(mtoto wa mama|wewe ni mjinga)', 0.7, 'local_insult'),
        ]

    async def load_models(self):
        logger.info("🤖 Using rule-based analysis (lightweight mode)")
        # Skip heavy model loading

    async def analyze_optimized(self, text: str, platform: str = "generic", context: dict = None):
        start_time = datetime.now()
        text_lower = text.lower()
        
        toxicity_score = 0.0
        detected_categories = []
        detected_issues = []
        
        # Check toxic patterns
        for pattern, score, category in self.toxic_patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                toxicity_score = max(toxicity_score, score)
                if category not in detected_categories:
                    detected_categories.append(category)
                detected_issues.append(f"Pattern: {pattern}")
        
        # Determine warning level
        if toxicity_score > 0.8:
            warning_level = "high"
        elif toxicity_score > 0.6:
            warning_level = "medium"
        elif toxicity_score > 0.4:
            warning_level = "low"
        else:
            warning_level = "none"
            detected_categories = ["safe"]
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return {
            "toxicity_score": round(toxicity_score, 3),
            "is_toxic": toxicity_score > 0.7,
            "categories": detected_categories,
            "confidence": 0.85,
            "warning_level": warning_level,
            "processing_time": round(processing_time, 2),
            "detected_issues": detected_issues if detected_issues else ["No toxic patterns detected"],
            "cultural_context": {
                "region": "kenya",
                "model_type": "rule_based",
                "local_context_aware": True
            },
            "model_type": "rule_based"
        }
