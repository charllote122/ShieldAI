// Enhanced ShieldAPI with comprehensive error handling and performance optimizations
class ShieldAPI {
    static API_BASE = CONFIG.API_BASE_URL;
    static _cache = new Map();
    static _pendingRequests = new Map();
    static _rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

    static async analyzeText(text, platform = 'generic', options = {}) {
        const {
            timeout = 10000,
            useCache = true,
            retryAttempts = 2,
            language = 'auto'
        } = options;

        const cacheKey = `analyze_${platform}_${language}_${this._hashText(text)}`;
        
        // Check cache first
        if (useCache && this._cache.has(cacheKey)) {
            const cached = this._cache.get(cacheKey);
            if (Date.now() - cached.timestamp < 300000) { // 5 minutes
                console.log('📦 Returning cached analysis');
                return cached.data;
            }
        }

        // Check for pending requests
        if (this._pendingRequests.has(cacheKey)) {
            console.log('🔄 Returning pending request');
            return this._pendingRequests.get(cacheKey);
        }

        // Rate limiting check
        if (!this._rateLimiter.isAllowed('analyze')) {
            throw new Error('Rate limit exceeded. Please try again in a moment.');
        }

        try {
            console.log(`🔍 Analyzing text: "${text.substring(0, 50)}..."`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const requestPromise = (async () => {
                for (let attempt = 1; attempt <= retryAttempts + 1; attempt++) {
                    try {
                        const response = await fetch(`${this.API_BASE}${CONFIG.ENDPOINTS.ANALYZE}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Client-Version': CONFIG.VERSION,
                                'X-Request-ID': this._generateRequestId()
                            },
                            body: JSON.stringify({
                                text: text,
                                platform: platform,
                                language: language,
                                context: {
                                    region: 'Kenya',
                                    timestamp: new Date().toISOString(),
                                    attempt: attempt
                                }
                            }),
                            signal: controller.signal
                        });

                        clearTimeout(timeoutId);

                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(`API error ${response.status}: ${errorText}`);
                        }

                        const result = await response.json();
                        
                        // Validate response structure
                        const validatedResult = this._validateAnalysisResult(result);
                        
                        // Cache successful response
                        this._cache.set(cacheKey, {
                            data: validatedResult,
                            timestamp: Date.now()
                        });

                        console.log('✅ Analysis result:', validatedResult);
                        
                        // Track successful analysis
                        this._trackEvent('analysis_success', {
                            platform,
                            text_length: text.length,
                            is_toxic: validatedResult.is_toxic,
                            response_time: validatedResult.processing_time,
                            attempt: attempt
                        });

                        return validatedResult;

                    } catch (error) {
                        if (attempt === retryAttempts + 1) {
                            throw error;
                        }
                        
                        if (error.name === 'AbortError') {
                            throw new Error('Analysis request timeout');
                        }
                        
                        console.warn(`Attempt ${attempt} failed:`, error);
                        
                        // Exponential backoff
                        await new Promise(resolve => 
                            setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt), 10000))
                        );
                    }
                }
            })();

            this._pendingRequests.set(cacheKey, requestPromise);
            const result = await requestPromise;
            this._pendingRequests.delete(cacheKey);
            
            return result;

        } catch (error) {
            this._pendingRequests.delete(cacheKey);
            console.error('❌ Analysis API error:', error);
            
            // Track failed analysis
            this._trackEvent('analysis_failed', {
                platform,
                text_length: text.length,
                error: error.message
            });

            // Fallback to local analysis with enhanced context
            const fallbackResult = this.localAnalysis(text, platform, language);
            fallbackResult.fallback = true;
            fallbackResult.fallback_reason = error.message;
            
            return fallbackResult;
        }
    }

    static async analyzeBatch(texts, platform = 'generic', options = {}) {
        const {
            batchSize = 10,
            concurrency = 2,
            ...analysisOptions
        } = options;

        if (!Array.isArray(texts) || texts.length === 0) {
            throw new Error('Texts must be a non-empty array');
        }

        if (texts.length > 50) {
            throw new Error('Batch size cannot exceed 50 texts');
        }

        try {
            const response = await fetch(`${this.API_BASE}${CONFIG.ENDPOINTS.BATCH_ANALYZE}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Client-Version': CONFIG.VERSION
                },
                body: JSON.stringify({
                    texts: texts,
                    platform: platform,
                    batch_size: batchSize
                })
            });

            if (!response.ok) {
                throw new Error(`Batch API error: ${response.status}`);
            }

            const results = await response.json();
            
            // Validate batch results
            return results.map(result => this._validateAnalysisResult(result));

        } catch (error) {
            console.error('Batch API error:', error);
            
            // Fallback to sequential analysis with concurrency control
            const results = [];
            const batches = this._chunkArray(texts, batchSize);
            
            for (const batch of batches) {
                const batchPromises = batch.map(text => 
                    this.analyzeText(text, platform, { ...analysisOptions, useCache: false })
                );
                
                const batchResults = await Promise.allSettled(batchPromises);
                results.push(...batchResults.map(result => 
                    result.status === 'fulfilled' ? result.value : 
                    this.localAnalysis(result.reason?.text || '', platform)
                ));
                
                // Rate limiting between batches
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            return { results, fallback: true };
        }
    }

    static async getStats(options = {}) {
        const {
            useCache = true,
            refresh = false
        } = options;

        const cacheKey = 'stats';
        
        if (useCache && !refresh && this._cache.has(cacheKey)) {
            const cached = this._cache.get(cacheKey);
            if (Date.now() - cached.timestamp < 60000) { // 1 minute
                return cached.data;
            }
        }

        try {
            const response = await fetch(`${this.API_BASE}${CONFIG.ENDPOINTS.STATS}`, {
                headers: {
                    'X-Client-Version': CONFIG.VERSION
                }
            });

            if (!response.ok) {
                throw new Error(`Stats API error: ${response.status}`);
            }

            const stats = await response.json();
            const validatedStats = this._validateStats(stats);
            
            // Cache validated stats
            this._cache.set(cacheKey, {
                data: validatedStats,
                timestamp: Date.now()
            });

            console.log('📊 Stats loaded:', validatedStats);
            return validatedStats;

        } catch (error) {
            console.error('Stats API error:', error);
            
            // Return cached stats even if expired, or fallback
            if (this._cache.has(cacheKey)) {
                return this._cache.get(cacheKey).data;
            }
            
            return this.getFallbackStats();
        }
    }

    static async getSupportResources(country = 'kenya', options = {}) {
        const { useCache = true } = options;
        const cacheKey = `resources_${country}`;

        if (useCache && this._cache.has(cacheKey)) {
            return this._cache.get(cacheKey).data;
        }

        try {
            const response = await fetch(`${this.API_BASE}${CONFIG.ENDPOINTS.RESOURCES}/kenya`, {
                headers: {
                    'X-Client-Version': CONFIG.VERSION
                }
            });

            if (!response.ok) {
                throw new Error(`Resources API error: ${response.status}`);
            }

            const resources = await response.json();
            
            // Cache for longer period (1 hour)
            this._cache.set(cacheKey, {
                data: resources,
                timestamp: Date.now()
            });

            return resources;

        } catch (error) {
            console.error('Resources API error:', error);
            
            if (this._cache.has(cacheKey)) {
                return this._cache.get(cacheKey).data;
            }
            
            return this.getFallbackResources('kenya');
        }
    }

    static async getSupportedLanguages() {
        const cacheKey = 'languages';

        if (this._cache.has(cacheKey)) {
            return this._cache.get(cacheKey).data;
        }

        try {
            const response = await fetch(`${this.API_BASE}${CONFIG.ENDPOINTS.LANGUAGES}`);
            
            if (!response.ok) {
                throw new Error(`Languages API error: ${response.status}`);
            }

            const languages = await response.json();
            
            // Cache languages for a long time (24 hours)
            this._cache.set(cacheKey, {
                data: languages,
                timestamp: Date.now()
            });

            return languages;

        } catch (error) {
            console.error('Languages API error:', error);
            
            if (this._cache.has(cacheKey)) {
                return this._cache.get(cacheKey).data;
            }
            
            return { 
                languages: [
                    { code: 'en', name: 'English', native_name: 'English', region: 'Kenya' },
                    { code: 'sw', name: 'Swahili', native_name: 'Kiswahili', region: 'Kenya' }
                ],
                fallback: true,
                region: 'Kenya'
            };
        }
    }

    static async healthCheck() {
        try {
            const startTime = Date.now();
            const response = await fetch(`${this.API_BASE}${CONFIG.ENDPOINTS.HEALTH}`);
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
            console.error('Health check failed:', error);
            return { 
                status: 'offline', 
                error: error.message,
                response_time: null,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Enhanced local analysis with better pattern matching
    static localAnalysis(text, platform = 'generic', language = 'en') {
        const lowerText = text.toLowerCase();
        let toxicityScore = 0.1;
        let categories = new Set(['safe']);
        let warningLevel = 'none';

        // Comprehensive toxic pattern detection
        const toxicPatterns = [
            // Basic insults and harassment
            { pattern: /\b(stupid|idiot|moron|retard|dumb|fool)\b/i, score: 0.3, category: 'insult' },
            { pattern: /\b(ugly|fat|disgusting|worthless|useless)\b/i, score: 0.25, category: 'harassment' },
            { pattern: /\b(hate|despise|loathe|abhor)\b/i, score: 0.2, category: 'hostility' },
            
            // Threats and violence
            { pattern: /\b(kill|murder|destroy|harm|hurt)\b/i, score: 0.4, category: 'threat' },
            { pattern: /\b(die|suicide|end.*life)\b/i, score: 0.6, category: 'severe_threat' },
            { pattern: /\b(attack|fight|violence|beat)\b/i, score: 0.35, category: 'violence' },
            
            // Gender-based harassment
            { pattern: /\b(women.*kitchen|make.*sandwich|belong.*home)\b/i, score: 0.4, category: 'gender_harassment' },
            { pattern: /\b(female.*driver|women.*shouldn.*code)\b/i, score: 0.35, category: 'gender_discrimination' },
            
            // Cultural and regional patterns
            { pattern: /\b(na wash|you fit think|your head no correct)\b/i, score: 0.3, category: 'cultural_harassment' },
            { pattern: /\b(go marry|your mate|rubbish person)\b/i, score: 0.25, category: 'cultural_insult' },
            { pattern: /\b(mtoto wa mama|child of mother)\b/i, score: 0.4, category: 'cultural_harassment' },
            
            // Sexual content
            { pattern: /\b(sexual|naked|porn|nudes)\b/i, score: 0.5, category: 'sexual_content' },
            { pattern: /\b(dick|pussy|fuck|shit)\b/i, score: 0.4, category: 'explicit' },
            
            // Racism and discrimination
            { pattern: /\b(racist|racial|discriminate)\b/i, score: 0.6, category: 'discrimination' },
            { pattern: /\b(superior|inferior|better.*than)\b/i, score: 0.3, category: 'discrimination' }
        ];

        // Calculate toxicity score based on pattern matches
        let matchCount = 0;
        toxicPatterns.forEach(({ pattern, score, category }) => {
            const matches = lowerText.match(pattern);
            if (matches) {
                matchCount += matches.length;
                toxicityScore += score * matches.length;
                categories.add(category);
            }
        });

        // Adjust score based on match frequency
        if (matchCount > 0) {
            toxicityScore += Math.min(matchCount * 0.1, 0.3);
        }

        // Cap score and determine warning level
        toxicityScore = Math.min(Math.max(toxicityScore, 0.1), 0.95);
        const isToxic = toxicityScore > CONFIG.DETECTION_THRESHOLD;
        
        if (toxicityScore > 0.7) warningLevel = 'high';
        else if (toxicityScore > 0.5) warningLevel = 'medium';
        else if (toxicityScore > 0.3) warningLevel = 'low';

        // Calculate confidence based on text length and match quality
        const baseConfidence = 0.7;
        const lengthBonus = Math.min(text.length / 500, 0.2);
        const matchBonus = Math.min(matchCount * 0.05, 0.1);
        const confidence = baseConfidence + lengthBonus + matchBonus;

        return {
            toxicity_score: parseFloat(toxicityScore.toFixed(3)),
            is_toxic: isToxic,
            categories: Array.from(categories),
            confidence: parseFloat(confidence.toFixed(3)),
            warning_level: warningLevel,
            processing_time: 80 + (Math.random() * 70),
            detected_issues: Array.from(categories).filter(cat => cat !== 'safe'),
            cultural_context: { 
                detected: Array.from(categories).some(cat => cat.includes('cultural')),
                language: language
            },
            version: 'local-fallback-v2',
            platform: platform
        };
    }

    // Utility methods
    static _hashText(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    static _generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    static _chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    static _validateAnalysisResult(result) {
        const defaults = {
            toxicity_score: 0.1,
            is_toxic: false,
            categories: ['safe'],
            confidence: 0.8,
            warning_level: 'none',
            processing_time: 100,
            detected_issues: [],
            cultural_context: { detected: false }
        };

        const validated = { ...defaults, ...result };
        
        // Ensure numeric values are within bounds
        validated.toxicity_score = Math.max(0, Math.min(1, parseFloat(validated.toxicity_score) || 0.1));
        validated.confidence = Math.max(0, Math.min(1, parseFloat(validated.confidence) || 0.8));
        validated.processing_time = Math.max(0, parseInt(validated.processing_time) || 100);
        
        // Ensure arrays
        if (!Array.isArray(validated.categories)) validated.categories = ['safe'];
        if (!Array.isArray(validated.detected_issues)) validated.detected_issues = [];
        
        return validated;
    }

    static _validateStats(stats) {
        const defaults = this.getFallbackStats();
        const validated = { ...defaults, ...stats };
        
        // Ensure numeric values are valid
        const numericFields = ['total_requests', 'toxic_requests', 'toxicity_rate', 'platform_count', 'uptime_seconds'];
        numericFields.forEach(field => {
            if (typeof validated[field] === 'number') {
                validated[field] = isNaN(validated[field]) ? defaults[field] : validated[field];
            }
        });
        
        return validated;
    }

    static _trackEvent(eventName, properties = {}) {
        // Integration with analytics service
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, properties);
        }
        
        // Console logging for development
        if (CONFIG.DEBUG) {
            console.log(`📊 Event: ${eventName}`, properties);
        }
    }

    static clearCache() {
        this._cache.clear();
        console.log('🧹 API cache cleared');
    }

    static getFallbackStats() {
        return {
            total_requests: 2847,
            toxic_requests: 426,
            toxicity_rate: 0.15,
            platform_count: 4,
            avg_response_time: 145,
            uptime_seconds: 2592000, // 30 days
            daily_stats: {
                '2024-01-15': { requests: 124, toxic: 19 },
                '2024-01-16': { requests: 135, toxic: 21 },
                '2024-01-17': { requests: 118, toxic: 17 }
            },
            timestamp: Math.floor(Date.now() / 1000),
            fallback: true
        };
    }

    static getFallbackResources(country = 'kenya') {
        const resources = {
            kenya: {
                name: "Kenya",
                country_code: "KE",
                region: "East Africa",
                hotlines: [
                    { name: "Kenya Mental Health Hotline", number: "1199", available: "24/7", free: true, languages: ["sw", "en"] },
                    { name: "Nairobi Women's Hospital GBV Hotline", number: "0800 720 715", available: "24/7", free: true, languages: ["sw", "en"] },
                    { name: "Gender-Based Violence Hotline", number: "1199", available: "24/7", free: true, languages: ["sw", "en"] }
                ],
                organizations: [
                    { name: "Basic Needs Kenya", website: "https://basicneeds.org", focus: "Mental health support", languages: ["sw", "en"] },
                    { name: "Africa Mental Health Foundation", website: "https://amhf.or.ke", focus: "Mental health research", languages: ["en"] }
                ],
                emergency_services: {
                    ambulance: "999",
                    police: "112",
                    fire: "911",
                    general_emergency: "112"
                },
                supported_cities: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Kericho", "Kilifi"],
                fallback: true
            }
        };

        return resources[country] || resources.kenya;
    }
}

// Rate Limiter Helper Class
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