const CONFIG = {
    // For Codespaces - backend is on the same machine
    API_BASE_URL: 'http://localhost:8000',
    
    DETECTION_THRESHOLD: 0.7,
    SUPPORTED_LANGUAGES: ['en', 'fr', 'sw', 'yo', 'ig'],
    SUPPORTED_PLATFORMS: ['twitter', 'facebook', 'instagram', 'whatsapp', 'linkedin'],
    
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
