// Utility functions
class ShieldUtils {
    static formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }

    static sanitizeText(text) {
        return text.trim().replace(/[<>]/g, '');
    }

    static debounce(func, wait) {
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

    static detectLanguage(text) {
        // Simple language detection for demo
        const patterns = {
            'fr': /\b(le|la|les|un|une|des|je|tu|il|elle|nous|vous|ils|elles)\b/i,
            'sw': /\b(na|ni|ya|wa|za|ku|m|ki|vi)\b/i,
            'yo': /\b(ṣe|ki|ni|o|a|ti|ko|pe)\b/i,
            'ig': /\b(na|bụ|maka|n'ihi|mgbe)\b/i
        };

        for (const [lang, pattern] of Object.entries(patterns)) {
            if (pattern.test(text)) return lang;
        }
        return 'en';
    }
}