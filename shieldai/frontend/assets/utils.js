// Number formatting
console.log(ShieldUtils.formatNumber(1234.567)); // "1,234.57"
console.log(ShieldUtils.formatNumber(1234.567, { maximumFractionDigits: 0 })); // "1,235"

// Text sanitization
const safeText = ShieldUtils.sanitizeText('<script>alert("xss")</script> Hello!', {
    maxLength: 100,
    stripEmojis: true
});

// Debounced search
const searchHandler = ShieldUtils.debounce(
    (query) => console.log('Searching:', query), 
    300, 
    true
);

// Language detection
const lang = ShieldUtils.detectLanguage('Bonjour comment allez-vous aujourd\'hui?', {
    minConfidence: 0.2,
    supportedLanguages: ['en', 'fr', 'es']
});

// Utility functions
const id = ShieldUtils.generateId(12);
const isEmpty = ShieldUtils.isEmpty({});
const capitalized = ShieldUtils.capitalizeWords('hello world');
const truncated = ShieldUtils.truncateText('This is a long text that needs truncating', 20);
const fileSize = ShieldUtils.formatFileSize(1048576); // "1 MB"