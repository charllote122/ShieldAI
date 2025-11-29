// Enhanced Analytics Service for ShieldAI with comprehensive tracking
class ShieldAIAnalytics {
    constructor() {
        this.events = [];
        this.sessionStart = Date.now();
        this.sessionId = this.generateSessionId();
        this.userId = this.getOrCreateUserId();
        this.pageStartTime = Date.now();
        this.analysisCount = 0;
        this.toxicAnalysisCount = 0;
        this.initialized = false;
        
        this.init();
    }

    init() {
        if (this.initialized) return;

        try {
            // Track page view
            this.trackPageView();

            // Set up performance monitoring
            this.setupPerformanceMonitoring();

            // Set up error tracking
            this.setupErrorTracking();

            // Set up visibility change tracking
            this.setupVisibilityTracking();

            // Set up session heartbeat
            this.setupSessionHeartbeat();

            this.initialized = true;
            console.log('📊 Analytics initialized');
        } catch (error) {
            console.error('Failed to initialize analytics:', error);
        }
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getOrCreateUserId() {
        try {
            let userId = Utils.getStorage('shieldai_user_id');
            if (!userId) {
                userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                Utils.setStorage('shieldai_user_id', userId, 365 * 24 * 60 * 60 * 1000); // 1 year
            }
            return userId;
        } catch (error) {
            // Fallback to session-based ID if storage fails
            return `temp_user_${Date.now()}`;
        }
    }

    // Track page views with enhanced context
    trackPageView() {
        const event = {
            type: 'page_view',
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userId,
            page: {
                url: window.location.href,
                path: window.location.pathname,
                title: document.title,
                referrer: document.referrer
            },
            device: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                screen: {
                    width: screen.width,
                    height: screen.height
                },
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            },
            connection: {
                effectiveType: navigator.connection?.effectiveType,
                downlink: navigator.connection?.downlink,
                rtt: navigator.connection?.rtt
            }
        };

        this.events.push(event);
        this.sendEvent(event);
    }

    // Enhanced analysis tracking
    trackAnalysis(text, platform, result, context = {}) {
        this.analysisCount++;
        if (result.is_toxic) {
            this.toxicAnalysisCount++;
        }

        const event = {
            type: 'analysis',
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userId,
            platform,
            textMetadata: {
                length: text.length,
                wordCount: text.split(/\s+/).length,
                hasUnicode: /[^\u0000-\u007F]/.test(text),
                language: context.language || 'auto'
            },
            result: {
                is_toxic: result.is_toxic,
                toxicity_score: result.toxicity_score,
                confidence: result.confidence,
                warning_level: result.warning_level,
                categories: result.categories || [],
                detected_issues: result.detected_issues || [],
                processing_time: result.processing_time,
                fallback: result.fallback || false,
                version: result.version || 'unknown'
            },
            context: {
                platform,
                region: context.region || 'unknown',
                attempt: context.attempt || 1,
                api_used: !result.fallback
            }
        };

        this.events.push(event);
        this.sendEvent(event);

        // Track additional metrics for toxic content
        if (result.is_toxic) {
            this.trackToxicContent(result, platform, context);
        }
    }

    // Track toxic content specifically
    trackToxicContent(result, platform, context = {}) {
        const event = {
            type: 'toxic_content_detected',
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userId,
            platform,
            severity: result.warning_level,
            categories: result.categories || [],
            toxicity_score: result.toxicity_score,
            confidence: result.confidence,
            context: {
                has_cultural_context: result.cultural_context?.detected || false,
                fallback_used: result.fallback || false
            }
        };

        this.sendEvent(event);
    }

    // Enhanced user interaction tracking
    trackInteraction(action, element = '', details = {}) {
        const event = {
            type: 'interaction',
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userId,
            action,
            element,
            location: {
                page: window.location.pathname,
                x: details.x || 0,
                y: details.y || 0
            },
            details: {
                value: details.value,
                text: details.text?.substring(0, 100), // Limit text length
                ...details
            }
        };

        this.events.push(event);
        this.sendEvent(event);
    }

    // Track feature usage
    trackFeatureUsage(feature, details = {}) {
        const event = {
            type: 'feature_usage',
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userId,
            feature,
            details
        };

        this.events.push(event);
        this.sendEvent(event);
    }

    // Track performance metrics
    trackPerformance(metric, value, details = {}) {
        const event = {
            type: 'performance',
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userId,
            metric,
            value,
            details
        };

        this.events.push(event);
        this.sendEvent(event);
    }

    // Enhanced error tracking
    trackError(error, context = '', severity = 'medium', additionalData = {}) {
        const event = {
            type: 'error',
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userId,
            severity,
            message: error.message,
            name: error.name,
            stack: error.stack?.substring(0, 1000), // Limit stack trace length
            context,
            page: window.location.href,
            userAgent: navigator.userAgent,
            additionalData
        };

        this.events.push(event);
        this.sendEvent(event);

        // Also log to console for development
        if (Utils.isDevelopment()) {
            console.error(`🔴 Analytics Error [${severity}]:`, error.message, context);
        }
    }

    // Track API calls
    trackAPICall(endpoint, method, status, duration, details = {}) {
        const event = {
            type: 'api_call',
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userId,
            endpoint,
            method,
            status,
            duration,
            details
        };

        this.events.push(event);
        this.sendEvent(event);
    }

    // Send event to analytics service
    async sendEvent(event) {
        if (!CONFIG.ANALYTICS_ENABLED) return;

        try {
            // Add common metadata to all events
            const enrichedEvent = {
                ...event,
                _metadata: {
                    version: CONFIG.VERSION,
                    environment: Utils.isDevelopment() ? 'development' : 'production',
                    timestamp: new Date().toISOString()
                }
            };

            // Log to console in development
            if (Utils.isDevelopment()) {
                console.log('📊 Analytics Event:', enrichedEvent);
            }

            // Send to backend analytics endpoint
            if (CONFIG.ANALYTICS_ENDPOINT) {
                // Use sendBeacon for better performance and reliability
                const blob = new Blob([JSON.stringify(enrichedEvent)], {
                    type: 'application/json'
                });

                if (navigator.sendBeacon) {
                    navigator.sendBeacon(CONFIG.ANALYTICS_ENDPOINT, blob);
                } else {
                    // Fallback to fetch
                    fetch(CONFIG.ANALYTICS_ENDPOINT, {
                        method: 'POST',
                        body: JSON.stringify(enrichedEvent),
                        headers: { 'Content-Type': 'application/json' },
                        keepalive: true // Ensure request completes even if page unloads
                    }).catch(err => {
                        console.warn('Failed to send analytics via fetch:', err);
                    });
                }
            }

            // Also send to external analytics services if configured
            this.sendToExternalServices(enrichedEvent);

        } catch (error) {
            console.warn('Failed to send analytics event:', error);
        }
    }

    // Send to external analytics services
    sendToExternalServices(event) {
        // Google Analytics 4
        if (typeof gtag !== 'undefined') {
            try {
                gtag('event', event.type, {
                    event_category: 'shieldai',
                    event_label: JSON.stringify(event),
                    value: 1
                });
            } catch (error) {
                console.warn('Failed to send to Google Analytics:', error);
            }
        }

        // Microsoft Clarity
        if (window.clarity) {
            try {
                window.clarity('event', event.type, event);
            } catch (error) {
                console.warn('Failed to send to Microsoft Clarity:', error);
            }
        }
    }

    // Setup performance monitoring
    setupPerformanceMonitoring() {
        if ('PerformanceObserver' in window) {
            // Core Web Vitals
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    this.trackPerformance(entry.name, entry.value, {
                        rating: entry.rating,
                        navigationType: entry.navigationType
                    });
                });
            });

            try {
                observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
            } catch (error) {
                this.trackError(error, 'performance_observer_setup');
            }
        }

        // Page load time
        window.addEventListener('load', () => {
            const loadTime = Date.now() - this.pageStartTime;
            this.trackPerformance('page_load_time', loadTime);
        });
    }

    // Setup error tracking
    setupErrorTracking() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.trackError(event.error, 'global_error', 'high', {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.trackError(event.reason, 'unhandled_promise_rejection', 'medium', {
                promise: event.promise
            });
        });
    }

    // Setup visibility change tracking
    setupVisibilityTracking() {
        document.addEventListener('visibilitychange', () => {
            this.trackInteraction('visibility_change', 'document', {
                state: document.visibilityState,
                hidden: document.hidden
            });
        });
    }

    // Setup session heartbeat
    setupSessionHeartbeat() {
        // Send heartbeat every 30 seconds
        this.heartbeatInterval = setInterval(() => {
            this.trackInteraction('heartbeat', 'session', {
                events_count: this.events.length,
                analysis_count: this.analysisCount,
                toxic_analysis_count: this.toxicAnalysisCount,
                memory_usage: performance.memory?.usedJSHeapSize
            });
        }, 30000);
    }

    // Get comprehensive session statistics
    getSessionStats() {
        const sessionDuration = Date.now() - this.sessionStart;
        const analysisEvents = this.events.filter(e => e.type === 'analysis');
        const toxicEvents = analysisEvents.filter(e => e.result?.is_toxic);
        const errorEvents = this.events.filter(e => e.type === 'error');
        const interactionEvents = this.events.filter(e => e.type === 'interaction');

        return {
            sessionId: this.sessionId,
            userId: this.userId,
            sessionDuration,
            totalEvents: this.events.length,
            analysisCount: analysisEvents.length,
            toxicCount: toxicEvents.length,
            errorCount: errorEvents.length,
            interactionCount: interactionEvents.length,
            toxicityRate: analysisEvents.length > 0 
                ? (toxicEvents.length / analysisEvents.length) * 100 
                : 0,
            platformBreakdown: this.getPlatformBreakdown(),
            errorSeverity: this.getErrorSeverityBreakdown(),
            performance: this.getPerformanceMetrics()
        };
    }

    getPlatformBreakdown() {
        const analysisEvents = this.events.filter(e => e.type === 'analysis');
        const platformCount = analysisEvents.reduce((acc, event) => {
            acc[event.platform] = (acc[event.platform] || 0) + 1;
            return acc;
        }, {});

        return platformCount;
    }

    getErrorSeverityBreakdown() {
        const errorEvents = this.events.filter(e => e.type === 'error');
        const severityCount = errorEvents.reduce((acc, event) => {
            acc[event.severity] = (acc[event.severity] || 0) + 1;
            return acc;
        }, {});

        return severityCount;
    }

    getPerformanceMetrics() {
        const performanceEvents = this.events.filter(e => e.type === 'performance');
        const metrics = {};

        performanceEvents.forEach(event => {
            if (!metrics[event.metric]) {
                metrics[event.metric] = [];
            }
            metrics[event.metric].push(event.value);
        });

        // Calculate averages
        const averages = {};
        Object.keys(metrics).forEach(metric => {
            const values = metrics[metric];
            averages[metric] = values.reduce((a, b) => a + b, 0) / values.length;
        });

        return averages;
    }

    // Clear events (useful for testing)
    clearEvents() {
        this.events = [];
        this.analysisCount = 0;
        this.toxicAnalysisCount = 0;
        console.log('🧹 Analytics events cleared');
    }

    // Export events for debugging or backup
    exportEvents() {
        return {
            sessionId: this.sessionId,
            userId: this.userId,
            sessionStart: this.sessionStart,
            events: this.events,
            stats: this.getSessionStats(),
            summary: {
                totalEvents: this.events.length,
                analysisCount: this.analysisCount,
                toxicAnalysisCount: this.toxicAnalysisCount,
                sessionDuration: Date.now() - this.sessionStart
            }
        };
    }

    // Destroy analytics instance (clean up)
    destroy() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        // Send final session summary
        this.trackInteraction('session_end', 'analytics', this.getSessionStats());

        this.initialized = false;
        console.log('📊 Analytics destroyed');
    }
}

// Enhanced utility functions
const Utils = {
    getStorage(key) {
        try {
            return localStorage.getItem(`shieldai_${key}`);
        } catch (error) {
            console.warn('LocalStorage not available:', error);
            return null;
        }
    },

    setStorage(key, value, ttl = null) {
        try {
            const item = ttl ? {
                value,
                expiry: Date.now() + ttl
            } : value;

            localStorage.setItem(`shieldai_${key}`, JSON.stringify(item));
        } catch (error) {
            console.warn('LocalStorage not available:', error);
        }
    },

    isDevelopment() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               CONFIG.ENVIRONMENT === 'development';
    }
};

// Configuration
const CONFIG = {
    ANALYTICS_ENABLED: true,
    ANALYTICS_ENDPOINT: 'https://api.shieldai.com/v1/analytics/events',
    VERSION: '1.0.0',
    ENVIRONMENT: 'production'
};

// Create global analytics instance
const Analytics = new ShieldAIAnalytics();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Analytics.init());
} else {
    Analytics.init();
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ShieldAIAnalytics, Analytics };
} else {
    window.ShieldAIAnalytics = ShieldAIAnalytics;
    window.Analytics = Analytics;
}