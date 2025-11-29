// ShieldAI Africa - Environment Configuration
window.APP_CONFIG = {
    // API Configuration
    API_BASE_URL: 'https://shieldai-31j7.onrender.com',
    ENVIRONMENT: 'production',
    APP_VERSION: '1.0.0',
    
    // Africa-specific settings
    AFRICA_EMERGENCY_NUMBERS: {
        kenya_mental_health: '1199',
        kenya_gbv: '1195',
        south_africa_gbv: '0800 428 428',
        nigeria_emergency: '112',
        ghana_emergency: '112',
        egypt_emergency: '123'
    },
    
    // African languages support
    LANGUAGES: {
        swahili: true,
        hausa: true,
        yoruba: true,
        zulu: true,
        amharic: true,
        french: true,
        arabic: true,
        english: true
    },
    
    // Feature flags
    FEATURES: {
        REAL_TIME_ANALYSIS: true,
        LIVE_STATS: true,
        MULTILINGUAL_SUPPORT: true,
        REGIONAL_RESOURCES: true
    },
    
    // UI Settings
    UI: {
        THEME: 'africa',
        PRIMARY_COLOR: '#008751', // African green
        SECONDARY_COLOR: '#000000', // Black
        ACCENT_COLOR: '#FD0D35', // Red
        GOLD: '#FFD700' // Gold
    }
};