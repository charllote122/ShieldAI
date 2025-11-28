// Configuration and Constants
const CONFIG = {
    // API Configuration
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:8000'
        : 'https://your-production-api.com',
    
    // Feature Flags
    FEATURES: {
        REAL_TIME_ANALYSIS: true,
        BATCH_ANALYSIS: true,
        OFFLINE_MODE: true,
        PWA: true
    },
    
    // Performance Settings
    CACHE_TTL: 5 * 60 * 1000, // 5 minutes
    DEBOUNCE_DELAY: 500,
    STATS_REFRESH_INTERVAL: 10000, // 10 seconds
    
    // Analytics
    ANALYTICS_ENABLED: true,
    
    // Demo Settings
    DEMO_TEXTS: [
        {
            id: 1,
            title: "🚨 Severe Cyberbullying",
            text: "You're so ugly and stupid, you should just kill yourself. Nobody will ever love you.",
            expected: "HIGH toxicity - Prevents severe emotional harm",
            platform: "twitter"
        },
        {
            id: 2,
            title: "👩‍💻 Gender-Based Harassment", 
            text: "Women belong in the kitchen, not coding. This is why we don't hire female developers.",
            expected: "HIGH toxicity - Blocks gender discrimination",
            platform: "twitter"
        },
        {
            id: 3,
            title: "🌍 African Context - Nigeria",
            text: "This Naija babe is such an ashawo, she's acting like a mumu with her stupid startup.",
            expected: "MEDIUM toxicity - Detects Nigerian slang harassment",
            platform: "instagram"
        },
        {
            id: 4,
            title: "💬 Subtle Put-Down",
            text: "For a woman, you're actually pretty smart. I'm surprised you understand this.",
            expected: "LOW toxicity - Catches subtle sexism",
            platform: "facebook"
        },
        {
            id: 5,
            title: "✅ Positive Example",
            text: "I respect your opinion even though I disagree. Let's discuss this respectfully.",
            expected: "SAFE - Encourages healthy discussion",
            platform: "whatsapp"
        }
    ],
    
    // Platform Configuration
    PLATFORMS: [
        { id: 'twitter', name: 'Twitter', icon: '🐦' },
        { id: 'instagram', name: 'Instagram', icon: '📸' },
        { id: 'facebook', name: 'Facebook', icon: '👥' },
        { id: 'whatsapp', name: 'WhatsApp', icon: '💬' }
    ],
    
    // Features List
    FEATURES_LIST: [
        {
            icon: "🌍",
            title: "African Context Aware",
            description: "Understands regional slang, cultural context, and local harassment patterns across Nigeria, Kenya, Ghana, and South Africa"
        },
        {
            icon: "⚡",
            title: "Real-time Analysis",
            description: "Analyzes messages in under 500ms with 95%+ accuracy using advanced AI models"
        },
        {
            icon: "🛡️",
            title: "Multi-Platform Support",
            description: "Works across Twitter, Instagram, Facebook, WhatsApp, and all major social platforms"
        },
        {
            icon: "💬",
            title: "Constructive Feedback",
            description: "Provides helpful suggestions to rephrase harmful content instead of just blocking"
        },
        {
            icon: "🔒",
            title: "Privacy First",
            description: "All analysis happens locally when possible. Your data never leaves your device unnecessarily"
        },
        {
            icon: "🌐",
            title: "Multi-language",
            description: "Supports English, French, Swahili, Pidgin, and other African languages"
        }
    ]
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}