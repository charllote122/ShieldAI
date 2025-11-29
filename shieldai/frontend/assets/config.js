const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const CONFIG = {
    API_BASE_URL: isDevelopment 
        ? 'http://localhost:8000' 
        : 'https://shieldai-backend.onrender.com',  // Your Render URL
    
    DETECTION_THRESHOLD: 0.7,
    SUPPORTED_LANGUAGES: ['en', 'sw', 'luy', 'kik', 'luo', 'kam', 'som'], // Kenya languages
    SUPPORTED_PLATFORMS: ['twitter', 'facebook', 'instagram', 'whatsapp', 'linkedin'],
    
    // Kenya-focused default country
    DEFAULT_COUNTRY: 'kenya',
    
    ENDPOINTS: {
        ANALYZE: '/analyze',
        BATCH_ANALYZE: '/analyze/batch',
        STATS: '/stats',
        RESOURCES: '/resources',
        HEALTH: '/health',
        LANGUAGES: '/languages/supported',
        ANALYTICS: '/analytics/history'
    }
};