// API Service for ShieldAI
class ShieldAIAPI {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.cache = new Map();
        this.pendingRequests = new Map();
    }

    // Generic request method with error handling and caching
    async request(endpoint, options = {}) {
        const cacheKey = `${endpoint}-${JSON.stringify(options.body || {})}`;
        const cachedResponse = Utils.getCache(cacheKey);
        
        if (cachedResponse && !options.forceRefresh) {
            Utils.trackEvent('api', 'cache_hit', endpoint);
            return cachedResponse;
        }

        // Check if request is already pending
        if (this.pendingRequests.has(cacheKey)) {
            Utils.trackEvent('api', 'request_deduplicated', endpoint);
            return this.pendingRequests.get(cacheKey);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        try {
            Utils.startTimer(`api_${endpoint}`);
            
            const requestPromise = fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Client-Version': '2.0.0'
                },
                signal: controller.signal,
                ...options
            });

            this.pendingRequests.set(cacheKey, requestPromise);

            const response = await requestPromise;
            const duration = Utils.endTimer(`api_${endpoint}`);

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Cache successful responses
            if (response.status === 200 && !endpoint.includes('/stats')) {
                Utils.setCache(cacheKey, data);
            }

            Utils.trackEvent('api', 'success', `${endpoint} (${duration}ms)`);
            
            return data;

        } catch (error) {
            Utils.endTimer(`api_${endpoint}`);
            clearTimeout(timeoutId);

            const errorContext = `API Request to ${endpoint}`;
            const errorInfo = Utils.handleError(error, errorContext);

            // Return fallback data for critical endpoints
            if (endpoint === '/stats') {
                return this.getFallbackStats();
            }

            throw error;

        } finally {
            this.pendingRequests.delete(cacheKey);
        }
    }

    // Analysis endpoints
    async analyzeText(text, platform = 'general', language = 'auto') {
        if (!Utils.isValidText(text)) {
            throw new Error('Text must be at least 2 characters long');
        }

        Utils.trackEvent('analysis', 'text_submitted', platform);

        return this.request('/analyze', {
            method: 'POST',
            body: JSON.stringify({
                text: Utils.sanitizeInput(text),
                platform,
                language
            })
        });
    }

    async analyzeBatch(texts, platform = 'general') {
        if (!Array.isArray(texts) || texts.length === 0) {
            throw new Error('Texts array must not be empty');
        }

        Utils.trackEvent('analysis', 'batch_submitted', `${texts.length} texts`);

        return this.request('/analyze/batch', {
            method: 'POST',
            body: JSON.stringify({
                texts: texts.map(text => Utils.sanitizeInput(text)),
                platform
            })
        });
    }

    // Analytics endpoints
    async getStats(forceRefresh = false) {
        return this.request('/stats', { forceRefresh });
    }

    async getResources(country = 'nigeria') {
        return this.request(`/resources/${country}`);
    }

    async getSupportedLanguages() {
        return this.request('/languages/supported');
    }

    // Health check
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) throw new Error('Health check failed');
            
            return await response.json();
        } catch (error) {
            Utils.handleError(error, 'health_check');
            return { status: 'unhealthy', error: error.message };
        }
    }

    // Fallback data for when API is unavailable
    getFallbackStats() {
        return {
            total_requests: 1250,
            toxic_requests: 187,
            toxicity_rate: 0.15,
            platform_count: 4,
            uptime_seconds: 86400,
            daily_stats: {
                [new Date().toISOString().split('T')[0]]: {
                    total_analyses: 150,
                    toxic_analyses: 23,
                    platforms: {
                        twitter: 45,
                        facebook: 35,
                        instagram: 40,
                        whatsapp: 30
                    }
                }
            },
            timestamp: Date.now() / 1000,
            fallback: true
        };
    }

    // Real-time analysis with debouncing
    createRealTimeAnalyzer() {
        let lastAnalysis = null;
        
        return Utils.debounce(async (text, platform, callback) => {
            if (!Utils.isValidText(text)) {
                callback({ status: 'empty' });
                return;
            }

            if (text === lastAnalysis?.text) {
                callback(lastAnalysis.result);
                return;
            }

            try {
                const result = await this.analyzeText(text, platform);
                lastAnalysis = { text, result };
                callback(result);
            } catch (error) {
                callback({ 
                    status: 'error', 
                    error: error.message,
                    is_toxic: false,
                    confidence: 0
                });
            }
        }, CONFIG.DEBOUNCE_DELAY);
    }

    // Batch processing with progress
    async processBatchWithProgress(texts, platform, onProgress) {
        const results = [];
        const batchSize = 5; // Process 5 texts at a time
        
        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            
            try {
                const batchResults = await this.analyzeBatch(batch, platform);
                results.push(...batchResults.results);
                
                if (onProgress) {
                    onProgress({
                        processed: Math.min(i + batchSize, texts.length),
                        total: texts.length,
                        percentage: Math.round(((i + batchSize) / texts.length) * 100)
                    });
                }
            } catch (error) {
                // If batch fails, process individually
                for (const text of batch) {
                    try {
                        const result = await this.analyzeText(text, platform);
                        results.push(result);
                    } catch (individualError) {
                        results.push({
                            text,
                            error: individualError.message,
                            is_toxic: false,
                            confidence: 0
                        });
                    }
                }
            }
        }
        
        return results;
    }

    // Cache management
    clearCache() {
        this.cache.clear();
        Utils.clearCache();
    }

    getCacheStats() {
        return {
            size: this.cache.size,
            pendingRequests: this.pendingRequests.size
        };
    }
}

// Create global API instance
const API = new ShieldAIAPI();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShieldAIAPI;
}