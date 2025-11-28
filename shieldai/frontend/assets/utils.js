// Utility Functions
class ShieldAIUtils {
    constructor() {
        this.cache = new Map();
        this.performance = {
            startTimes: new Map(),
            metrics: []
        };
    }

    // Performance Monitoring
    startTimer(name) {
        this.performance.startTimes.set(name, performance.now());
    }

    endTimer(name) {
        const startTime = this.performance.startTimes.get(name);
        if (startTime) {
            const duration = performance.now() - startTime;
            this.performance.metrics.push({ name, duration });
            this.performance.startTimes.delete(name);
            
            // Log to console in development
            if (this.isDevelopment()) {
                console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
            }
            
            return duration;
        }
        return 0;
    }

    // Caching with TTL
    setCache(key, value, ttl = CONFIG.CACHE_TTL) {
        const item = {
            value,
            expiry: Date.now() + ttl
        };
        this.cache.set(key, item);
    }

    getCache(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    clearCache() {
        this.cache.clear();
    }

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Error handling
    handleError(error, context = '') {
        const errorInfo = {
            message: error.message,
            context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Log to console
        console.error(`❌ Error in ${context}:`, error);

        // Send to analytics if enabled
        if (CONFIG.ANALYTICS_ENABLED) {
            this.trackEvent('error', errorInfo);
        }

        // Show user-friendly error message
        this.showToast(
            'An error occurred. Please try again.',
            'error'
        );

        return errorInfo;
    }

    // Toast notifications
    showToast(message, type = 'info', duration = 5000) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

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
        `;

        toastContainer.appendChild(toast);

        // Auto-remove after duration
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, duration);

        return toast;
    }

    // Local storage with validation
    setStorage(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(key, serializedValue);
            return true;
        } catch (error) {
            this.handleError(error, 'localStorage set');
            return false;
        }
    }

    getStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            this.handleError(error, 'localStorage get');
            return defaultValue;
        }
    }

    removeStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            this.handleError(error, 'localStorage remove');
            return false;
        }
    }

    // Environment detection
    isDevelopment() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1';
    }

    isProduction() {
        return !this.isDevelopment();
    }

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // DOM utilities
    $(selector) {
        return document.querySelector(selector);
    }

    $$(selector) {
        return document.querySelectorAll(selector);
    }

    createElement(tag, classes = '', content = '') {
        const element = document.createElement(tag);
        if (classes) element.className = classes;
        if (content) element.innerHTML = content;
        return element;
    }

    // Animation helpers
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = Math.min(progress / duration, 1);
            
            element.style.opacity = opacity.toString();
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    fadeOut(element, duration = 300) {
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = Math.max(1 - progress / duration, 0);
            
            element.style.opacity = opacity.toString();
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        };
        
        requestAnimationFrame(animate);
    }

    // Formatting utilities
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    formatPercentage(value) {
        return Math.round(value * 100) + '%';
    }

    formatTime(seconds) {
        if (seconds < 1) {
            return Math.round(seconds * 1000) + 'ms';
        }
        return seconds.toFixed(2) + 's';
    }

    // Validation
    isValidText(text) {
        return text && typeof text === 'string' && text.trim().length >= 2;
    }

    sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    // Event tracking
    trackEvent(category, action, label = '') {
        if (!CONFIG.ANALYTICS_ENABLED) return;

        const eventData = {
            category,
            action,
            label,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };

        // Send to analytics service
        if (window.gtag) {
            gtag('event', action, {
                event_category: category,
                event_label: label
            });
        }

        // Log to console in development
        if (this.isDevelopment()) {
            console.log('📊 Analytics Event:', eventData);
        }
    }

    // Performance metrics collection
    getPerformanceMetrics() {
        return this.performance.metrics;
    }

    clearPerformanceMetrics() {
        this.performance.metrics = [];
    }

    // Network status
    isOnline() {
        return navigator.onLine;
    }

    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copied to clipboard!', 'success');
            return true;
        } catch (error) {
            this.handleError(error, 'clipboard copy');
            return false;
        }
    }

    // Download helper
    downloadFile(content, filename, contentType = 'text/plain') {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Create global utils instance
const Utils = new ShieldAIUtils();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShieldAIUtils;
}