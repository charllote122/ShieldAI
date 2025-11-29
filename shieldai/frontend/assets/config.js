// config.js or in your main frontend file
const CONFIG = {
    // Update this to your live Render URL
    API_BASE_URL: 'https://shieldai-31j7.onrender.com',
    
    ENDPOINTS: {
        ANALYZE: '/analyze',
        BATCH_ANALYZE: '/analyze/batch',
        STATS: '/stats',
        HEALTH: '/health',
        RESOURCES: '/resources',
        LANGUAGES: '/languages/supported'
    },
    
    DETECTION_THRESHOLD: 0.7,
    
    // Frontend settings
    MAX_TEXT_LENGTH: 1000,
    SUPPORTED_PLATFORMS: ['twitter', 'facebook', 'instagram', 'whatsapp', 'generic'],
    
    // UI settings
    TOXICITY_LEVELS: {
        safe: { color: '#10B981', label: 'Safe' },
        low: { color: '#F59E0B', label: 'Low Risk' },
        medium: { color: '#F97316', label: 'Medium Risk' },
        high: { color: '#EF4444', label: 'High Risk' }
    }
};