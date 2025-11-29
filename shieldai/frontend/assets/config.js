// config.js - ShieldAI Configuration
// This file provides a canonical runtime config object (CONFIG).
// If `window.APP_CONFIG` is populated (for example by env.js or hosting platform),
// values from that object will be used/merged so the site has a single source-of-truth.
const CONFIG = {
    // API Configuration (default)
    API_BASE_URL: 'https://shieldai-31j7.onrender.com',
    API_TIMEOUT: 10000, // 10 seconds
    API_RETRY_ATTEMPTS: 3,
    API_RATE_LIMIT: 10, // requests per minute
    
    // API Endpoints
    ENDPOINTS: {
        ANALYZE: '/analyze',
        BATCH_ANALYZE: '/analyze/batch',
        STATS: '/stats',
        HEALTH: '/health',
        RESOURCES: '/resources',
        LANGUAGES: '/languages/supported',
        FEEDBACK: '/feedback',
        REPORT: '/report'
    },
    
    // Detection Settings
    DETECTION_THRESHOLD: 0.7,
    CONFIDENCE_THRESHOLD: 0.6,
    FALLBACK_ENABLED: true,
    
    // Text Processing
    MAX_TEXT_LENGTH: 1000,
    MIN_TEXT_LENGTH: 1,
    TRUNCATE_OVERFLOW: true,
    
    // Supported Platforms
    SUPPORTED_PLATFORMS: [
        'twitter', 
        'facebook', 
        'instagram', 
        'whatsapp', 
        'tiktok',
        'youtube',
        'linkedin',
        'reddit',
        'generic'
    ],
    
    // Platform-specific settings
    PLATFORM_SETTINGS: {
        twitter: {
            max_length: 280,
            char_count: true,
            emoji_support: true
        },
        facebook: {
            max_length: 63206,
            char_count: false,
            media_support: true
        },
        instagram: {
            max_length: 2200,
            char_count: true,
            hashtag_support: true
        },
        whatsapp: {
            max_length: 65536,
            char_count: false,
            group_chat_support: true
        },
        tiktok: {
            max_length: 150,
            char_count: true,
            video_context: true
        },
        generic: {
            max_length: 1000,
            char_count: true,
            emoji_support: true
        }
    },
    
    // UI/UX Settings
    TOXICITY_LEVELS: {
        safe: { 
            color: '#10B981', 
            label: 'Safe',
            threshold: 0.3,
            icon: '✅',
            message: 'Content appears safe'
        },
        low: { 
            color: '#F59E0B', 
            label: 'Low Risk',
            threshold: 0.5,
            icon: '⚠️',
            message: 'Minor concerns detected'
        },
        medium: { 
            color: '#F97316', 
            label: 'Medium Risk',
            threshold: 0.7,
            icon: '🚨',
            message: 'Potentially harmful content'
        },
        high: { 
            color: '#EF4444', 
            label: 'High Risk',
            threshold: 1.0,
            icon: '⛔',
            message: 'Dangerous content detected'
        }
    },
    
    // Analytics Configuration
    ANALYTICS: {
        ENABLED: true,
        ENDPOINT: '/api/v1/analytics/events',
        SAMPLE_RATE: 1.0, // 100% of events
        SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
        HEARTBEAT_INTERVAL: 30000, // 30 seconds
        PERSIST_EVENTS: true
    },
    
    // Feature Flags
    FEATURES: {
        BATCH_ANALYSIS: true,
        REAL_TIME_ANALYSIS: true,
        CULTURAL_CONTEXT: true,
        LANGUAGE_DETECTION: true,
        SENTIMENT_ANALYSIS: false, // Coming soon
        CONTENT_SUGGESTIONS: false, // Coming soon
        ADVANCED_REPORTING: true
    },
    
    // Localization - Kenya Focus
    SUPPORTED_LANGUAGES: [
        { code: 'en', name: 'English', nativeName: 'English', region: 'Kenya' },
        { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', region: 'Kenya', primary: true }
    ],
    
    DEFAULT_LANGUAGE: 'en',
    
    // Regional Settings - Kenya Primary with Future Africa Expansion
    REGIONS: {
        'kenya': {
            name: 'Kenya',
            countries: ['Kenya'],
            primary_language: 'sw',
            emergency_numbers: ['999', '112'],
            cities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Kericho', 'Kilifi']
        },
        'east-africa': {
            name: 'East Africa',
            countries: ['Kenya', 'Tanzania', 'Uganda', 'Rwanda', 'Burundi'],
            primary_language: 'sw',
            emergency_numbers: ['999', '112'],
            status: 'planned'
        },
        'west-africa': {
            name: 'West Africa',
            countries: ['Nigeria', 'Ghana', 'Senegal', "Côte d'Ivoire", 'Cameroon'],
            primary_language: 'en',
            emergency_numbers: ['112', '199'],
            status: 'planned'
        },
        'southern-africa': {
            name: 'Southern Africa',
            countries: ['South Africa', 'Zimbabwe', 'Zambia', 'Botswana'],
            primary_language: 'en',
            emergency_numbers: ['10111', '112'],
            status: 'planned'
        }
    },
    
    // Cache Settings
    CACHE: {
        ENABLED: true,
        DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
        STATS_TTL: 60 * 1000, // 1 minute
        RESOURCES_TTL: 60 * 60 * 1000, // 1 hour
        LANGUAGES_TTL: 24 * 60 * 60 * 1000 // 24 hours
    },
    
    // Error Handling
    ERROR_HANDLING: {
        SHOW_USER_FRIENDLY_ERRORS: true,
        LOG_LEVEL: 'warn', // 'debug', 'info', 'warn', 'error'
        MAX_ERROR_REPORTS: 50,
        AUTO_REPORT_ERRORS: true
    },
    
    // Performance Settings
    PERFORMANCE: {
        DEBOUNCE_DELAY: 300, // ms
        LAZY_LOAD_IMAGES: true,
        COMPRESS_REQUESTS: true,
        USE_WEB_WORKERS: false // Coming soon
    },
    
    // Security Settings
    SECURITY: {
        SANITIZE_INPUT: true,
        VALIDATE_REQUESTS: true,
        CORS_ENABLED: true,
        CONTENT_SECURITY_POLICY: true
    },
    
    // Theme and Styling
    THEME: {
        PRIMARY_COLOR: '#008751', // Africa green
        SECONDARY_COLOR: '#FFD700', // Gold
        ACCENT_COLOR: '#FD0D35', // Red
        DARK_COLOR: '#000000',
        LIGHT_COLOR: '#FFFFFF',
        
        GRADIENTS: {
            primary: 'linear-gradient(135deg, #008751 0%, #000000 33%, #FFD700 66%, #FD0D35 100%)',
            emergency: 'linear-gradient(135deg, #DC2626, #991B1B)',
            success: 'linear-gradient(135deg, #10B981, #059669)'
        },
        
        SHADOWS: {
            sm: '0 1px 2px rgba(0,0,0,0.1)',
            md: '0 4px 15px rgba(0,0,0,0.2)',
            lg: '0 10px 25px rgba(0,0,0,0.2)',
            xl: '0 20px 40px rgba(0,0,0,0.3)'
        },
        
        BORDER_RADIUS: {
            sm: '4px',
            md: '8px',
            lg: '12px',
            xl: '16px',
            full: '50%'
        }
    },
    
    // Notification Settings
    NOTIFICATIONS: {
        TOAST_DURATION: 5000, // ms
        AUTO_DISMISS: true,
        POSITION: 'top-right',
        MAX_VISIBLE: 3
    },
    
    // Demo/Development Settings - Kenya Focus
    DEMO: {
        ENABLED: true,
        REGION: 'Kenya',
        SAMPLE_TEXTS: [
            "This is a wonderful day in Nairobi!",
            "You are so stupid and worthless.",
            "Women belong in the kitchen, not leading companies.",
            "I think we should all work together peacefully.",
            "I hate you and hope something bad happens to you."
        ],
        MOCK_RESPONSES: true,
        SIMULATE_LATENCY: false
    },
    
    // Version and Build Info
    VERSION: '1.0.0',
    BUILD_DATE: '2024-01-15',
    ENVIRONMENT: 'production', // 'development', 'staging', 'production'
    
    // External Services
    EXTERNAL_SERVICES: {
        GOOGLE_ANALYTICS_ID: null, // 'G-XXXXXXXXXX'
        SENTRY_DSN: null, // Your Sentry DSN
        HOTJAR_ID: null // Your Hotjar ID
    }
};

// If a runtime `window.APP_CONFIG` exists (e.g. injected by env.js or hosting), merge
// it into the canonical CONFIG so all scripts can read one object. We also expose
// the same object on both `window.CONFIG` and `window.APP_CONFIG` for compatibility.
if (typeof window !== 'undefined' && window.APP_CONFIG && typeof window.APP_CONFIG === 'object') {
    // shallow merge (APP_CONFIG wins)
    Object.assign(CONFIG, window.APP_CONFIG);
}

// Expose on both names so other scripts referencing either will work
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
    window.APP_CONFIG = CONFIG;
}

// Environment-specific overrides
if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Development environment
        CONFIG.ENVIRONMENT = 'development';
        CONFIG.API_BASE_URL = 'http://localhost:8000';
        CONFIG.ANALYTICS.SAMPLE_RATE = 0.1; // 10% in development
        CONFIG.ERROR_HANDLING.LOG_LEVEL = 'debug';
        CONFIG.DEMO.MOCK_RESPONSES = true;
    } else if (hostname.includes('staging.')) {
        // Staging environment
        CONFIG.ENVIRONMENT = 'staging';
        CONFIG.API_BASE_URL = 'https://shieldai-staging.onrender.com';
        CONFIG.ANALYTICS.SAMPLE_RATE = 0.5; // 50% in staging
    }
}

// Freeze configuration to prevent accidental changes
Object.freeze(CONFIG);
Object.freeze(CONFIG.ENDPOINTS);
Object.freeze(CONFIG.TOXICITY_LEVELS);
Object.freeze(CONFIG.ANALYTICS);
Object.freeze(CONFIG.FEATURES);
Object.freeze(CONFIG.SUPPORTED_LANGUAGES);
Object.freeze(CONFIG.REGIONS);
Object.freeze(CONFIG.CACHE);
Object.freeze(CONFIG.ERROR_HANDLING);
Object.freeze(CONFIG.PERFORMANCE);
Object.freeze(CONFIG.SECURITY);
Object.freeze(CONFIG.THEME);
Object.freeze(CONFIG.NOTIFICATIONS);
Object.freeze(CONFIG.DEMO);
Object.freeze(CONFIG.EXTERNAL_SERVICES);

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else if (typeof define === 'function' && define.amd) {
    define([], () => CONFIG);
} else {
    window.CONFIG = CONFIG;
}

// Utility function to get platform-specific settings
CONFIG.getPlatformSettings = (platform) => {
    return CONFIG.PLATFORM_SETTINGS[platform] || CONFIG.PLATFORM_SETTINGS.generic;
};

// Utility function to determine toxicity level
CONFIG.getToxicityLevel = (score) => {
    const levels = CONFIG.TOXICITY_LEVELS;
    
    if (score >= levels.high.threshold) return 'high';
    if (score >= levels.medium.threshold) return 'medium';
    if (score >= levels.low.threshold) return 'low';
    return 'safe';
};

// Utility function to check if feature is enabled
CONFIG.isFeatureEnabled = (feature) => {
    return CONFIG.FEATURES[feature] === true;
};

// Utility function to get region by country
CONFIG.getRegionByCountry = (country) => {
    for (const [regionKey, region] of Object.entries(CONFIG.REGIONS)) {
        if (region.countries.includes(country)) {
            return regionKey;
        }
    }
    return null;
};

// Development helper - log config in non-production environments
if (CONFIG.ENVIRONMENT !== 'production') {
    console.log('🛠️ ShieldAI Config Loaded:', CONFIG);
}