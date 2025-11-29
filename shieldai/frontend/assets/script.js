// ShieldAI Kenya - Main JavaScript File

// Enhanced ShieldAPI with better error handling
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
        FALLBACK_STATS: {
            total_requests: 2847,
            toxic_requests: 426,
            toxicity_rate: 0.15,
            platform_count: 4,
            avg_response_time: 145
        }
    },

    // Enhanced analyzeText with timeout and fallback
    analyzeText: async function(text, platform = 'generic') {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.TIMEOUT);

            console.log('🛡️ Analyzing text:', { text: text.substring(0, 50) + '...', platform });

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
                        language: 'auto'
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
            console.error('ShieldAPI analysis error:', error);
            return this.getFallbackAnalysis(text);
        }
    },

    // Smart fallback analysis
    getFallbackAnalysis: function(text) {
        const toxicPatterns = [
            /\b(stupid|idiot|moron|retard|dumb)\b/i,
            /\b(ugly|fat|disgusting|worthless)\b/i,
            /\b(kill|die|hurt|harm)\b/i,
            /\b(hate|despise|loathe)\b/i,
            /\b(women belong|kitchen|female driver)\b/i,
            /\b(sexual|naked|porn)\b/i,
            /\b(racist|racial|discriminate)\b/i
        ];

        const kenyaSpecificToxic = [
            /\b(mtoto wa mama|child of mother)\b/i,
            /\b(prostitute|malaya)\b/i,
            /\b(wash|waste)\b/i,
            /\b(you think you fit)\b/i
        ];

        const hasToxic = toxicPatterns.some(pattern => pattern.test(text));
        const hasKenyaToxic = kenyaSpecificToxic.some(pattern => pattern.test(text));
        
        let toxicityScore = 0.15;
        let detectedIssues = [];
        
        if (hasToxic || hasKenyaToxic) {
            toxicityScore = hasKenyaToxic ? 0.92 : 0.78;
            detectedIssues = hasKenyaToxic ? 
                ['kenya_harassment', 'cultural_insult'] : 
                ['harassment', 'insults'];
        }

        return {
            is_toxic: hasToxic || hasKenyaToxic,
            toxicity_score: toxicityScore,
            confidence: 0.65,
            detected_issues: detectedIssues,
            warning_level: hasKenyaToxic ? 'high' : (hasToxic ? 'medium' : 'none'),
            processing_time: 120,
            fallback: true,
            message: 'Using fallback analysis - API unavailable'
        };
    },

    // Enhanced stats with caching
    getStats: async function() {
        try {
            const response = await fetch(`${this.config.API_BASE_URL}${this.config.ENDPOINTS.STATS}`);
            
            if (!response.ok) throw new Error(`Stats error: ${response.status}`);
            
            const stats = await response.json();
            
            // Cache stats for 30 seconds
            localStorage.setItem('shieldai_stats', JSON.stringify({
                data: stats,
                timestamp: Date.now()
            }));
            
            return stats;
        } catch (error) {
            console.error('Failed to fetch stats:', error);
            
            // Try to return cached stats
            const cached = localStorage.getItem('shieldai_stats');
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < 30000) {
                    return data;
                }
            }
            
            return this.config.FALLBACK_STATS;
        }
    },

    // Health check with detailed status
    healthCheck: async function() {
        try {
            const response = await fetch(`${this.config.API_BASE_URL}${this.config.ENDPOINTS.HEALTH}`);
            
            if (!response.ok) {
                return { status: 'unhealthy', error: `HTTP ${response.status}` };
            }
            
            const health = await response.json();
            return { status: 'healthy', ...health };
        } catch (error) {
            return { 
                status: 'offline', 
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    },

    // Get Kenya-specific resources
    getKenyaResources: async function() {
        try {
            const response = await fetch(`${this.config.API_BASE_URL}${this.config.ENDPOINTS.RESOURCES}`);
            
            if (!response.ok) throw new Error('Resources fetch failed');
            
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch Kenya resources:', error);
            return null;
        }
    }
};

// Toast Notification System
class ToastManager {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close">&times;</button>
        `;

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.removeToast(toast));

        this.container.appendChild(toast);

        if (duration > 0) {
            setTimeout(() => this.removeToast(toast), duration);
        }

        return toast;
    }

    removeToast(toast) {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

// Initialize toast manager
const toast = new ToastManager();

// Enhanced real API analysis function
async function analyzeLiveComment() {
    const commentInput = document.getElementById('liveCommentInput');
    const resultsDetails = document.getElementById('resultsDetails');
    const resultsPlaceholder = document.getElementById('resultsPlaceholder');
    const analyzeBtn = document.querySelector('.analyze-btn');

    if (!commentInput || commentInput.value.trim() === '') {
        toast.show('🇰🇪 Please enter a comment to analyze', 'warning');
        return;
    }

    const commentText = commentInput.value.trim();
    
    // Show loading state
    if (resultsPlaceholder) resultsPlaceholder.style.display = 'none';
    if (resultsDetails) {
        resultsDetails.style.display = 'block';
        resultsDetails.innerHTML = `
            <div class="loading-state">
                <div style="font-size: 2rem; margin-bottom: 1rem;">🛡️</div>
                <div>Analyzing with ShieldAI Kenya...</div>
            </div>
        `;
    }

    // Disable analyze button
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.classList.add('btn-loading');
    }

    try {
        const platformSelect = document.getElementById('platformSelect');
        const platform = platformSelect ? platformSelect.value : 'generic';
        
        // Call real backend API
        const result = await ShieldAPI.analyzeText(commentText, platform);
        
        // Update UI with real results
        updateAnalysisResults(result, commentText);

    } catch (error) {
        console.error('Analysis failed:', error);
        toast.show('Analysis service temporarily unavailable', 'error');
        
        if (resultsDetails) {
            resultsDetails.innerHTML = `
                <div class="error-message">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
                    <div>Service unavailable. Please try again later.</div>
                    <div style="font-size: 0.875rem; margin-top: 0.5rem; opacity: 0.7;">
                        Backend connection failed
                    </div>
                </div>
            `;
        }
    } finally {
        // Re-enable analyze button
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            analyzeBtn.classList.remove('btn-loading');
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
            </div>
            
            ${result.is_toxic ? `
            <div style="margin-top: 1.5rem; padding: 1rem; background: #fef3c7; border-radius: 8px; border-left: 4px solid var(--warning);">
                <strong>⚠️ Safety Recommendation:</strong>
                <div style="margin-top: 0.5rem; font-size: 0.875rem;">
                    This content has been flagged as potentially harmful. Consider blocking the user and reporting the content.
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
        element.textContent = value;
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
        
        return health;
    } catch (error) {
        console.error('Health check failed:', error);
        updateApiStatus('offline');
        toast.show('Backend connection failed', 'error', 5000);
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

// Mobile menu functionality
function initializeMobileMenu() {
    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('nav-menu');
    
    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            menu.classList.toggle('active');
            toggle.classList.toggle('active');
            
            // Animate hamburger to X
            const bars = toggle.querySelectorAll('.toggle-bar');
            if (menu.classList.contains('active')) {
                bars[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                bars[1].style.opacity = '0';
                bars[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
            } else {
                bars[0].style.transform = 'none';
                bars[1].style.opacity = '1';
                bars[2].style.transform = 'none';
            }
        });
    }
}

// Loading screen handler
function handleLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        // Simulate loading time
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 1500);
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
                
                toast.show('Scenario loaded! Click "Analyze Comment" to test.', 'info');
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

// Main initialization function
async function initializeApp() {
    console.log('🚀 Initializing ShieldAI Kenya...');
    
    // Initialize components
    initializeMobileMenu();
    handleLoadingScreen();
    initializeDemoScenarios();
    
    // Load initial data
    await Promise.all([
        loadRealStats(),
        checkBackendHealth()
    ]);
    
    // Start auto-refresh
    startStatsAutoRefresh();
    
    console.log('✅ ShieldAI Kenya initialized successfully');
    
    // Global error handler
    window.addEventListener('error', function(e) {
        console.error('Global error:', e.error);
        toast.show('An unexpected error occurred', 'error');
    });
}

// Make functions globally available
window.analyzeLiveComment = analyzeLiveComment;
window.showToast = (message, type) => toast.show(message, type);

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
        initializeApp
    };
}