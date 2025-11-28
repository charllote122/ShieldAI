// Analytics Service for ShieldAI
class ShieldAIAnalytics {
    constructor() {
        this.events = [];
        this.sessionStart = Date.now();
        this.sessionId = this.generateSessionId();
        this.userId = this.getOrCreateUserId();
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getOrCreateUserId() {
        let userId = Utils.getStorage('shieldai_user_id');
        if (!userId) {
            userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            Utils.setStorage('shieldai_user_id', userId);
        }
        return userId;
    }

    // Track analysis events
    trackAnalysis(text, platform, result) {
        const event = {
            type: 'analysis',
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userId,
            platform,
            textLength: text.length,
            isToxic: result.is_toxic,
            toxicityScore: result.toxicity_score,
            confidence: result.confidence
        };

        this.events.push(event);
        this.sendEvent(event);
    }

    // Track user interactions
    trackInteraction(action, details = {}) {
        const event = {
            type: 'interaction',
            action,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userId,
            ...details
        };

        this.events.push(event);
        this.sendEvent(event);
    }

    // Track errors
    trackError(error, context = '') {
        const event = {
            type: 'error',
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userId,
            message: error.message,
            stack: error.stack,
            context,
            url: window.location.href
        };

        this.events.push(event);
        this.sendEvent(event);
    }

    // Send event to server (placeholder - can be extended)
    sendEvent(event) {
        if (!CONFIG.ANALYTICS_ENABLED) return;

        // Log to console in development
        if (Utils.isDevelopment()) {
            console.log('📊 Analytics:', event);
        }

        // Send to backend analytics endpoint if available
        // This can be extended to send to a real analytics service
        // fetch('/api/v1/analytics/events', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(event)
        // }).catch(err => console.error('Failed to send analytics:', err));
    }

    // Get session statistics
    getSessionStats() {
        const sessionDuration = Date.now() - this.sessionStart;
        const analysisEvents = this.events.filter(e => e.type === 'analysis');
        const toxicEvents = analysisEvents.filter(e => e.isToxic);

        return {
            sessionId: this.sessionId,
            userId: this.userId,
            sessionDuration,
            totalEvents: this.events.length,
            analysisCount: analysisEvents.length,
            toxicCount: toxicEvents.length,
            toxicityRate: analysisEvents.length > 0 
                ? (toxicEvents.length / analysisEvents.length) * 100 
                : 0
        };
    }

    // Clear events (useful for testing)
    clearEvents() {
        this.events = [];
    }

    // Export events for debugging
    exportEvents() {
        return {
            sessionId: this.sessionId,
            userId: this.userId,
            events: this.events,
            stats: this.getSessionStats()
        };
    }
}

// Create global analytics instance
const Analytics = new ShieldAIAnalytics();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShieldAIAnalytics;
}
