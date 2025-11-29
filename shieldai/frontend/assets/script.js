// ShieldAI Kenya - Enhanced Main JavaScript File

// Enhanced ShieldAPI with better error handling, performance, and security
window.ShieldAPI = {
    config: {
        API_BASE_URL: window.APP_CONFIG?.API_BASE_URL || 'https://shieldai-31j7.onrender.com',
        ENDPOINTS: {
            STATS: '/stats',
            ANALYZE: '/analyze',
            HEALTH: '/health',
            RESOURCES: '/resources/kenya',
            LANGUAGES: '/languages/supported'
        },
        TIMEOUT: 10000,
        MAX_RETRIES: 3,
        FALLBACK_STATS: {
            total_requests: 2847,
            toxic_requests: 426,
            toxicity_rate: 0.15,
            platform_count: 4,
            avg_response_time: 145
        }
    },

    // Request deduplication cache
    _pendingRequests: new Map(),
    _rateLimiter: new RateLimiter(10, 60000), // 10 requests per minute

    // Enhanced analyzeText with timeout, retry, and deduplication
    analyzeText: async function(text, platform = 'generic') {
        const requestKey = `${text.substring(0, 100)}-${platform}`;
        
        // Return pending request if exists
        if (this._pendingRequests.has(requestKey)) {
            console.log('📦 Returning cached pending request');
            return this._pendingRequests.get(requestKey);
        }

        // Check rate limiting
        const userKey = 'anonymous'; // In real app, use user ID or session
        if (!this._rateLimiter.isAllowed(userKey)) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }

        try {
            const promise = this._performAnalysis(text, platform);
            this._pendingRequests.set(requestKey, promise);
            
            const result = await promise;
            this._pendingRequests.delete(requestKey);
            
            // Track successful analysis
            trackEvent('analysis_success', {
                platform,
                text_length: text.length,
                is_toxic: result.is_toxic,
                response_time: result.processing_time
            });
            
            return result;
        } catch (error) {
            this._pendingRequests.delete(requestKey);
            
            // Track failed analysis
            trackEvent('analysis_failed', {
                platform,
                text_length: text.length,
                error: error.message
            });
            
            throw error;
        }
    },

    // Internal analysis method with retry logic
    _performAnalysis: async function(text, platform = 'generic') {
        let lastError;
        
        for (let attempt = 1; attempt <= this.config.MAX_RETRIES; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.config.TIMEOUT);

                console.log(`🛡️ Analyzing text (attempt ${attempt}):`, { 
                    text: text.substring(0, 50) + '...', 
                    platform 
                });

                const response = await fetch(`${this.config.API_BASE_URL}${this.config.ENDPOINTS.ANALYZE}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: text,
                        platform: platform,
                        context: { 
                            region: 'kenya',
                            language: 'auto',
                            attempt: attempt
                        }
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }

                const result = await response.json();
                console.log('✅ Analysis result:', result);
                return result;

            } catch (error) {
                lastError = error;
                console.warn(`Analysis attempt ${attempt} failed:`, error);
                
                if (attempt < this.config.MAX_RETRIES) {
                    const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        // All retries failed, use fallback
        console.log('🔄 Using fallback analysis after retries failed');
        return this.getFallbackAnalysis(text);
    },

    // Enhanced fallback analysis with more patterns
    getFallbackAnalysis: function(text) {
        const toxicPatterns = [
            /\b(stupid|idiot|moron|retard|dumb|foolish)\b/i,
            /\b(ugly|fat|disgusting|worthless|useless)\b/i,
            /\b(kill|die|hurt|harm|violence|attack)\b/i,
            /\b(hate|despise|loathe|abhor|detest)\b/i,
            /\b(women belong|kitchen|female driver|make me sandwich)\b/i,
            /\b(sexual|naked|porn|nudes|dick|pussy)\b/i,
            /\b(racist|racial|discriminate|superior|inferior)\b/i,
            /\b(terrorist|bomb|explode|shoot|gun)\b/i
        ];

        const kenyaSpecificToxic = [
            /\b(mtoto wa mama|child of mother)\b/i,
            /\b(prostitute|malaya|whore)\b/i,
            /\b(wash|waste|rubbish)\b/i,
            /\b(you think you fit|who do you think you are)\b/i,
            /\b(mbwa|dog in negative context)\b/i,
            /\b(kanyaga|step on|disrespect)\b/i
        ];

        const hasToxic = toxicPatterns.some(pattern => pattern.test(text));
        const hasKenyaToxic = kenyaSpecificToxic.some(pattern => pattern.test(text));
        
        // Calculate toxicity score based on pattern matches
        let toxicityScore = 0.15;
        let detectedIssues = [];
        
        if (hasToxic || hasKenyaToxic) {
            const toxicMatches = toxicPatterns.filter(pattern => pattern.test(text)).length;
            const kenyaMatches = kenyaSpecificToxic.filter(pattern => pattern.test(text)).length;
            
            toxicityScore = Math.min(0.15 + (toxicMatches * 0.2) + (kenyaMatches * 0.3), 0.95);
            
            detectedIssues = [];
            if (hasToxic) detectedIssues.push('harassment', 'insults');
            if (hasKenyaToxic) detectedIssues.push('kenya_harassment', 'cultural_insult');
        }

        return {
            is_toxic: hasToxic || hasKenyaToxic,
            toxicity_score: toxicityScore,
            confidence: 0.65,
            detected_issues: detectedIssues,
            warning_level: hasKenyaToxic ? 'high' : (hasToxic ? 'medium' : 'none'),
            processing_time: 120 + Math.random() * 50,
            fallback: true,
            message: 'Using fallback analysis - API unavailable',
            version: 'fallback-v2'
        };
    },

    // Enhanced stats with caching and validation
    getStats: async function() {
        try {
            const response = await fetch(`${this.config.API_BASE_URL}${this.config.ENDPOINTS.STATS}`);
            
            if (!response.ok) throw new Error(`Stats error: ${response.status}`);
            
            const stats = await response.json();
            
            // Validate stats structure
            const validatedStats = this._validateStats(stats);
            
            // Cache stats for 30 seconds
            localStorage.setItem('shieldai_stats', JSON.stringify({
                data: validatedStats,
                timestamp: Date.now()
            }));
            
            trackEvent('stats_loaded', { source: 'api' });
            return validatedStats;
        } catch (error) {
            console.error('Failed to fetch stats:', error);
            
            // Try to return cached stats
            const cached = this._getCachedStats();
            if (cached) {
                trackEvent('stats_loaded', { source: 'cache' });
                return cached;
            }
            
            trackEvent('stats_loaded', { source: 'fallback' });
            return this.config.FALLBACK_STATS;
        }
    },

    // Validate stats structure
    _validateStats: function(stats) {
        const required = ['total_requests', 'toxic_requests', 'toxicity_rate'];
        const defaults = this.config.FALLBACK_STATS;
        
        const validated = { ...defaults, ...stats };
        
        // Ensure numbers are valid
        Object.keys(validated).forEach(key => {
            if (typeof validated[key] === 'number') {
                validated[key] = isNaN(validated[key]) ? defaults[key] : validated[key];
            }
        });
        
        return validated;
    },

    // Get cached stats with expiry
    _getCachedStats: function() {
        try {
            const cached = localStorage.getItem('shieldai_stats');
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < 30000) { // 30 seconds
                    return data;
                }
            }
        } catch (error) {
            console.warn('Failed to read cached stats:', error);
        }
        return null;
    },

    // Enhanced health check with detailed diagnostics
    healthCheck: async function() {
        try {
            const startTime = Date.now();
            const response = await fetch(`${this.config.API_BASE_URL}${this.config.ENDPOINTS.HEALTH}`);
            const responseTime = Date.now() - startTime;
            
            if (!response.ok) {
                return { 
                    status: 'unhealthy', 
                    error: `HTTP ${response.status}`,
                    response_time: responseTime,
                    timestamp: new Date().toISOString()
                };
            }
            
            const health = await response.json();
            return { 
                status: 'healthy', 
                response_time: responseTime,
                ...health 
            };
        } catch (error) {
            return { 
                status: 'offline', 
                error: error.message,
                response_time: null,
                timestamp: new Date().toISOString()
            };
        }
    },

    // Get Kenya-specific resources with caching
    getKenyaResources: async function() {
        const cacheKey = 'kenya_resources';
        
        try {
            // Check cache first
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < 300000) { // 5 minutes
                    return data;
                }
            }

            const response = await fetch(`${this.config.API_BASE_URL}${this.config.ENDPOINTS.RESOURCES}`);
            
            if (!response.ok) throw new Error('Resources fetch failed');
            
            const resources = await response.json();
            
            // Cache successful response
            localStorage.setItem(cacheKey, JSON.stringify({
                data: resources,
                timestamp: Date.now()
            }));
            
            return resources;
        } catch (error) {
            console.error('Failed to fetch Kenya resources:', error);
            
            // Return cached data even if expired as fallback
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const { data } = JSON.parse(cached);
                return data;
            }
            
            return null;
        }
    }
};

// Rate Limiter Class
class RateLimiter {
    constructor(maxRequests, timeWindow) {
        this.requests = new Map();
        this.maxRequests = maxRequests;
        this.timeWindow = timeWindow;
    }

    isAllowed(key) {
        const now = Date.now();
        const userRequests = this.requests.get(key) || [];
        
        // Clean old requests
        const recentRequests = userRequests.filter(time => now - time < this.timeWindow);
        this.requests.set(key, recentRequests);
        
        if (recentRequests.length >= this.maxRequests) {
            return false;
        }
        
        recentRequests.push(now);
        return true;
    }

    getRemainingRequests(key) {
        const now = Date.now();
        const userRequests = this.requests.get(key) || [];
        const recentRequests = userRequests.filter(time => now - time < this.timeWindow);
        return Math.max(0, this.maxRequests - recentRequests.length);
    }
}

// Enhanced Toast Notification System with Accessibility
class ToastManager {
    constructor() {
        this.container = null;
        this.toastCount = 0;
        this.init();
    }

    init() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('aria-atomic', 'true');
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 5000) {
        const toastId = `toast-${++this.toastCount}`;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.id = toastId;
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
        toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <span class="toast-icon" aria-hidden="true">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Dismiss notification">&times;</button>
        `;

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.removeToast(toast));

        this.container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });

        if (duration > 0) {
            setTimeout(() => this.removeToast(toast), duration);
        }

        // Track toast event
        trackEvent('toast_shown', { type, message_length: message.length });

        return toastId;
    }

    removeToast(toast) {
        if (!toast.parentNode) return;
        
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    // Method to programmatically remove toast by ID
    removeById(toastId) {
        const toast = document.getElementById(toastId);
        if (toast) {
            this.removeToast(toast);
        }
    }
}

// Analytics Tracking
function trackEvent(eventName, properties = {}) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, properties);
    }
    
    // Custom analytics logging
    const eventData = {
        event: eventName,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        user_agent: navigator.userAgent,
        ...properties
    };
    
    console.log('📊 Analytics Event:', eventData);
    
    // Store in session for batch processing
    if (!window._shieldAnalytics) {
        window._shieldAnalytics = [];
    }
    window._shieldAnalytics.push(eventData);
    
    // Limit storage size
    if (window._shieldAnalytics.length > 50) {
        window._shieldAnalytics = window._shieldAnalytics.slice(-25);
    }
}

// Input Validation Helper
function validateCommentInput(text, options = {}) {
    const {
        maxLength = 1000,
        minLength = 1,
        allowedLanguages = ['en', 'sw', 'fr']
    } = options;
    
    if (typeof text !== 'string') {
        return { valid: false, error: 'Input must be text' };
    }
    
    const trimmed = text.trim();
    
    if (trimmed.length < minLength) {
        return { valid: false, error: 'Comment too short' };
    }
    
    if (trimmed.length > maxLength) {
        return { valid: false, error: `Comment too long (max ${maxLength} characters)` };
    }
    
    // Basic profanity check before sending to API
    const quickProfanityCheck = /(fuck|shit|asshole|bitch)/i.test(trimmed);
    if (quickProfanityCheck) {
        console.log('🚫 Quick profanity filter triggered');
    }
    
    return { 
        valid: true, 
        text: trimmed,
        length: trimmed.length,
        has_quick_profanity: quickProfanityCheck
    };
}

// Initialize toast manager
const toast = new ToastManager();

// Enhanced real API analysis function with validation
async function analyzeLiveComment() {
    const commentInput = document.getElementById('liveCommentInput');
    const resultsDetails = document.getElementById('resultsDetails');
    const resultsPlaceholder = document.getElementById('resultsPlaceholder');
    const analyzeBtn = document.querySelector('.analyze-btn');

    if (!commentInput) {
        toast.show('Comment input not found', 'error');
        return;
    }

    // Validate input
    const validation = validateCommentInput(commentInput.value);
    if (!validation.valid) {
        toast.show(validation.error, 'warning');
        commentInput.focus();
        return;
    }

    const commentText = validation.text;
    
    // Show loading state
    if (resultsPlaceholder) resultsPlaceholder.style.display = 'none';
    if (resultsDetails) {
        resultsDetails.style.display = 'block';
        resultsDetails.innerHTML = `
            <div class="loading-state">
                <div style="font-size: 2rem; margin-bottom: 1rem;">🛡️</div>
                <div>Analyzing with ShieldAI Kenya...</div>
                <div style="font-size: 0.875rem; margin-top: 0.5rem; opacity: 0.7;">
                    Checking for harmful content
                </div>
            </div>
        `;
    }

    // Disable analyze button
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.classList.add('btn-loading');
        analyzeBtn.innerHTML = '<span class="btn-spinner"></span> Analyzing...';
    }

    try {
        const platformSelect = document.getElementById('platformSelect');
        const platform = platformSelect ? platformSelect.value : 'generic';
        
        // Track analysis start
        trackEvent('analysis_started', {
            platform,
            text_length: commentText.length,
            has_quick_profanity: validation.has_quick_profanity
        });
        
        // Call real backend API
        const result = await ShieldAPI.analyzeText(commentText, platform);
        
        // Update UI with real results
        updateAnalysisResults(result, commentText);

    } catch (error) {
        console.error('Analysis failed:', error);
        
        let errorMessage = 'Analysis service temporarily unavailable';
        if (error.message.includes('Rate limit')) {
            errorMessage = 'Too many requests. Please wait a moment.';
        }
        
        toast.show(errorMessage, 'error');
        
        if (resultsDetails) {
            resultsDetails.innerHTML = `
                <div class="error-message">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
                    <div>${errorMessage}</div>
                    <div style="font-size: 0.875rem; margin-top: 0.5rem; opacity: 0.7;">
                        Error: ${error.message}
                    </div>
                    <button onclick="analyzeLiveComment()" class="btn-primary" style="margin-top: 1rem;">
                        Try Again
                    </button>
                </div>
            `;
        }
        
        trackEvent('analysis_error', { error: error.message });
    } finally {
        // Re-enable analyze button
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            analyzeBtn.classList.remove('btn-loading');
            analyzeBtn.innerHTML = 'Analyze Comment';
        }
    }
}

// Update analysis results in UI
function updateAnalysisResults(result, originalText) {
    const resultsDetails = document.getElementById('resultsDetails');
    const toxicityScore = document.getElementById('toxicityScore');
    const toxicityCategory = document.getElementById('toxicityCategory');
    const responseTime = document.getElementById('responseTime');
    const confidenceFill = document.getElementById('confidenceFill');
    const confidenceValue = document.getElementById('confidenceValue');

    // Update individual metric elements if they exist
    if (toxicityScore) {
        toxicityScore.textContent = `${Math.round(result.toxicity_score * 100)}%`;
        toxicityScore.className = `metric-value ${
            result.toxicity_score > 0.7 ? 'toxic' : 
            result.toxicity_score > 0.4 ? 'warning' : 'safe'
        }`;
    }
    
    if (toxicityCategory) {
        toxicityCategory.textContent = result.detected_issues && result.detected_issues.length > 0 
            ? result.detected_issues.join(', ') 
            : 'Safe Content';
    }
    
    if (responseTime) responseTime.textContent = `${result.processing_time || 150}ms`;
    if (confidenceFill) confidenceFill.style.width = `${(result.confidence || 0.8) * 100}%`;
    if (confidenceValue) confidenceValue.textContent = `${Math.round((result.confidence || 0.8) * 100)}%`;

    // Show appropriate message and toast
    let resultMessage = '';
    let toastMessage = '';
    let toastType = 'info';

    if (result.is_toxic) {
        resultMessage = `🚨 Blocked - ${result.warning_level || 'high'} risk content detected`;
        toastMessage = 'Toxic content detected and blocked!';
        toastType = 'error';
    } else {
        resultMessage = '✅ Safe - No harmful content detected';
        toastMessage = 'Content appears safe!';
        toastType = 'success';
    }

    if (result.fallback) {
        toastMessage += ' (Using fallback analysis)';
        toastType = 'warning';
    }

    toast.show(toastMessage, toastType);

    // Update results details
    if (resultsDetails) {
        const messageClass = result.is_toxic ? 'toxic-message' : 'safe-message';
        
        resultsDetails.innerHTML = `
            <h3 style="margin-bottom: 1.5rem; color: var(--darker);">Analysis Results</h3>
            
            <div class="result-metrics">
                <div class="metric">
                    <span class="metric-label">Toxicity Score</span>
                    <span class="metric-value ${result.is_toxic ? 'toxic' : 'safe'}">
                        ${Math.round(result.toxicity_score * 100)}%
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Category</span>
                    <span class="metric-value">${
                        result.detected_issues && result.detected_issues.length > 0 
                            ? result.detected_issues.join(', ') 
                            : 'Safe'
                    }</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Response Time</span>
                    <span class="metric-value">${result.processing_time || 150}ms</span>
                </div>
            </div>
            
            <div class="confidence-meter">
                <label>AI Confidence Level:</label>
                <div class="meter-bar">
                    <div class="meter-fill" style="width: ${(result.confidence || 0.8) * 100}%"></div>
                </div>
                <span class="confidence-value">${Math.round((result.confidence || 0.8) * 100)}% confidence</span>
            </div>
            
            <div class="result-message ${messageClass}">
                ${resultMessage}
                ${result.fallback ? '<div style="font-size: 0.875rem; margin-top: 0.5rem; opacity: 0.8;">Fallback analysis used - API unavailable</div>' : ''}
                ${result.version ? `<div style="font-size: 0.75rem; margin-top: 0.25rem; opacity: 0.6;">Version: ${result.version}</div>` : ''}
            </div>
            
            ${result.is_toxic ? `
            <div class="safety-recommendation">
                <strong>⚠️ Safety Recommendation:</strong>
                <div style="margin-top: 0.5rem; font-size: 0.875rem;">
                    This content has been flagged as potentially harmful. Consider:
                    <ul style="margin: 0.5rem 0 0 1rem;">
                        <li>Blocking the user</li>
                        <li>Reporting the content to platform moderators</li>
                        <li>Educating the user about community guidelines</li>
                    </ul>
                </div>
            </div>
            ` : ''}
        `;
    }
}

// Load real stats from backend
async function loadRealStats() {
    try {
        console.log('📊 Loading Kenya stats from backend...');
        const stats = await ShieldAPI.getStats();
        
        // Update dashboard stats
        updateStatElement('totalAnalyzed', stats.total_requests?.toLocaleString() || '1,250');
        updateStatElement('toxicBlocked', stats.toxic_requests?.toLocaleString() || '187');
        updateStatElement('avgResponseTime', `${stats.avg_response_time || 145}ms`);
        
        // Update hero stats
        updateStatElement('liveRequests', stats.total_requests?.toLocaleString() || '12,847');
        updateStatElement('toxicityRate', `${Math.round((stats.toxicity_rate || 0.15) * 100)}%`);
        
        console.log('✅ Stats loaded successfully:', stats);
        
    } catch (error) {
        console.error('Failed to load stats:', error);
        // Fallback stats are already set in the HTML
    }
}

// Helper function to update stat elements
function updateStatElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        // Add animation for stat updates
        element.style.transform = 'scale(1.1)';
        setTimeout(() => {
            element.textContent = value;
            element.style.transform = 'scale(1)';
        }, 150);
    }
}

// Check backend health on startup
async function checkBackendHealth() {
    try {
        const health = await ShieldAPI.healthCheck();
        console.log('🔍 Backend health check:', health);
        
        updateApiStatus(health.status);
        
        if (health.status === 'healthy') {
            toast.show('ShieldAI Kenya backend connected!', 'success', 3000);
        } else if (health.status === 'unhealthy') {
            toast.show('Backend has issues - using fallback mode', 'warning', 5000);
        } else {
            toast.show('Backend offline - using demo mode', 'error', 5000);
        }
        
        trackEvent('health_check', health);
        return health;
    } catch (error) {
        console.error('Health check failed:', error);
        updateApiStatus('offline');
        toast.show('Backend connection failed', 'error', 5000);
        trackEvent('health_check_failed', { error: error.message });
        return { status: 'offline', error: error.message };
    }
}

// Update API status indicator
function updateApiStatus(status) {
    let statusElement = document.getElementById('apiStatus');
    
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = 'apiStatus';
        statusElement.className = 'api-status';
        document.body.appendChild(statusElement);
    }
    
    statusElement.className = `api-status ${status}`;
    statusElement.textContent = `API: ${status.toUpperCase()}`;
    statusElement.setAttribute('aria-live', 'polite');
    
    // Also update trust badge if exists
    const trustBadge = document.querySelector('.trust-badges .badge');
    if (trustBadge) {
        if (status === 'healthy') {
            trustBadge.innerHTML = '✅ Kenya API Live';
            trustBadge.style.backgroundColor = '#10B981';
        } else {
            trustBadge.innerHTML = '❌ Kenya API Offline';
            trustBadge.style.backgroundColor = '#EF4444';
        }
    }
}

// Enhanced Mobile Menu with Accessibility
function initializeMobileMenu() {
    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('nav-menu');
    
    if (toggle && menu) {
        // Add ARIA attributes
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-controls', 'nav-menu');
        toggle.setAttribute('aria-label', 'Toggle navigation menu');
        
        toggle.addEventListener('click', () => {
            const isExpanded = menu.classList.contains('active');
            
            menu.classList.toggle('active');
            toggle.classList.toggle('active');
            toggle.setAttribute('aria-expanded', !isExpanded);
            
            // Animate hamburger to X
            const bars = toggle.querySelectorAll('.toggle-bar');
            if (menu.classList.contains('active')) {
                bars[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                bars[1].style.opacity = '0';
                bars[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
                
                // Trap focus in mobile menu
                trapFocus(menu);
            } else {
                bars[0].style.transform = 'none';
                bars[1].style.opacity = '1';
                bars[2].style.transform = 'none';
            }
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (menu.classList.contains('active') && 
                !menu.contains(e.target) && 
                !toggle.contains(e.target)) {
                menu.classList.remove('active');
                toggle.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
                
                const bars = toggle.querySelectorAll('.toggle-bar');
                bars[0].style.transform = 'none';
                bars[1].style.opacity = '1';
                bars[2].style.transform = 'none';
            }
        });
        
        // Enhance keyboard navigation
        enhanceMobileMenuAccessibility();
    }
}

// Focus trapping for mobile menu
function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
        'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    element.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
        
        if (e.key === 'Escape') {
            const toggle = document.getElementById('nav-toggle');
            if (toggle) {
                toggle.click();
                toggle.focus();
            }
        }
    });
    
    firstElement.focus();
}

// Enhanced keyboard navigation for mobile menu
function enhanceMobileMenuAccessibility() {
    const menuItems = document.querySelectorAll('#nav-menu a, #nav-menu button');
    
    menuItems.forEach((item, index) => {
        item.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                menuItems[(index + 1) % menuItems.length].focus();
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                menuItems[(index - 1 + menuItems.length) % menuItems.length].focus();
            }
        });
    });
}

// Loading screen handler
function handleLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        // Simulate minimum loading time for better UX
        const startTime = Date.now();
        const minLoadTime = 1000;
        
        const completeLoading = () => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, minLoadTime - elapsed);
            
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    trackEvent('app_loaded', { load_time: elapsed + remaining });
                }, 500);
            }, remaining);
        };
        
        // Wait for critical resources
        if (document.readyState === 'complete') {
            completeLoading();
        } else {
            window.addEventListener('load', completeLoading);
        }
    }
}

// Initialize demo scenarios
function initializeDemoScenarios() {
    const scenarioCards = document.querySelectorAll('.scenario-card');
    
    scenarioCards.forEach(card => {
        card.addEventListener('click', function() {
            const scenarioText = this.getAttribute('data-scenario');
            const commentInput = document.getElementById('liveCommentInput');
            
            if (commentInput && scenarioText) {
                commentInput.value = scenarioText;
                commentInput.focus();
                
                // Highlight the input to show it's been populated
                commentInput.style.borderColor = '#10B981';
                setTimeout(() => {
                    commentInput.style.borderColor = '';
                }, 2000);
                
                toast.show('Scenario loaded! Click "Analyze Comment" to test.', 'info');
                
                trackEvent('demo_scenario_loaded', {
                    scenario_length: scenarioText.length,
                    scenario_preview: scenarioText.substring(0, 50)
                });
            }
        });
        
        // Add keyboard support
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });
    });
}

// Auto-refresh stats
function startStatsAutoRefresh() {
    // Refresh stats every 30 seconds
    setInterval(loadRealStats, 30000);
    
    // Refresh health check every minute
    setInterval(checkBackendHealth, 60000);
}

// Performance monitoring
function initializePerformanceMonitoring() {
    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                trackEvent('performance_metric', {
                    metric: entry.name,
                    value: entry.value,
                    rating: entry.rating
                });
            });
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    }
    
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.duration > 50) {
                    trackEvent('long_task', {
                        duration: entry.duration,
                        start_time: entry.startTime
                    });
                }
            });
        });
        
        observer.observe({ entryTypes: ['longtask'] });
    }
}

// Error boundary for the app
function initializeErrorBoundary() {
    window.addEventListener('error', function(e) {
        console.error('Global error:', e.error);
        
        trackEvent('global_error', {
            message: e.error?.message,
            stack: e.error?.stack,
            filename: e.filename,
            lineno: e.lineno,
            colno: e.colno
        });
        
        toast.show('An unexpected error occurred', 'error');
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', function(e) {
        console.error('Unhandled promise rejection:', e.reason);
        
        trackEvent('unhandled_rejection', {
            reason: e.reason?.message || String(e.reason)
        });
        
        toast.show('A system error occurred', 'error');
    });
}

// Export analytics data (for debugging or sending to backend)
function exportAnalyticsData() {
    return window._shieldAnalytics || [];
}

// Clear analytics data
function clearAnalyticsData() {
    window._shieldAnalytics = [];
}

// Main initialization function
async function initializeApp() {
    console.log('🚀 Initializing ShieldAI Kenya...');
    
    try {
        // Initialize components
        initializeMobileMenu();
        handleLoadingScreen();
        initializeDemoScenarios();
        initializePerformanceMonitoring();
        initializeErrorBoundary();
        
        // Load initial data
        await Promise.all([
            loadRealStats(),
            checkBackendHealth()
        ]);
        
        // Start auto-refresh
        startStatsAutoRefresh();
        
        console.log('✅ ShieldAI Kenya initialized successfully');
        
        trackEvent('app_initialized', {
            user_agent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            online: navigator.onLine
        });
        
    } catch (error) {
        console.error('❌ App initialization failed:', error);
        trackEvent('app_initialization_failed', { error: error.message });
        
        toast.show('App initialization failed', 'error');
    }
}

// Make functions globally available
window.analyzeLiveComment = analyzeLiveComment;
window.showToast = (message, type) => toast.show(message, type);
window.exportAnalyticsData = exportAnalyticsData;
window.clearAnalyticsData = clearAnalyticsData;
window.ShieldAPI = ShieldAPI;

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ShieldAPI,
        analyzeLiveComment,
        initializeApp,
        ToastManager,
        RateLimiter,
        validateCommentInput,
        exportAnalyticsData
    };
}