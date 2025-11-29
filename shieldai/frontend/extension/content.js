// ShieldAI Kenya Browser Extension - Content Script
console.log('🇰🇪 ShieldAI Kenya Extension Loaded');

class ShieldAIKenya {
    constructor() {
        this.apiBase = 'https://shieldai-31j7.onrender.com';
        this.isEnabled = true;
        this.protectedCount = 0;
        this.blockedCount = 0;
        this.init();
    }

    init() {
        console.log('🛡️ ShieldAI Kenya Protection Activated');
        this.injectShieldBadge();
        this.startMonitoring();
        this.setupMessageListener();
    }

    injectShieldBadge() {
        const badge = document.createElement('div');
        badge.id = 'shieldai-kenya-badge';
        badge.innerHTML = `
            <div style="
                position: fixed; 
                top: 10px; 
                right: 10px; 
                background: linear-gradient(135deg, #FF0000, #000000, #006600); 
                color: white; 
                padding: 8px 12px; 
                border-radius: 20px; 
                font-size: 12px; 
                font-weight: bold; 
                z-index: 10000; 
                border: 2px solid #FFD700;
                font-family: Arial, sans-serif;
            ">
                🇰🇪 ShieldAI Kenya Active
            </div>
        `;
        document.body.appendChild(badge);
    }

    startMonitoring() {
        // Scan existing content
        this.scanPageContent();
        
        // Monitor new content
        this.observeDOMChanges();
    }

    observeDOMChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        this.scanNode(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    scanPageContent() {
        // Scan for social media posts
        const selectors = [
            '[data-testid="tweetText"]', // Twitter
            '.userContent', // Facebook posts
            '.comment', // Generic comments
            '._3-8_', // WhatsApp
            '._2pin', // WhatsApp
            '[role="article"]', // Facebook/Twitter
            '.public-DraftStyleDefault-block' // Facebook comments
        ];

        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                this.scanElement(element);
            });
        });
    }

    scanNode(node) {
        if (node.querySelector && node.querySelector('[data-testid="tweetText"], .userContent, .comment, ._3-8_, ._2pin')) {
            this.scanPageContent();
        } else if (node.textContent && node.textContent.trim().length > 10) {
            this.scanElement(node);
        }
    }

    scanElement(element) {
        const text = element.textContent || element.innerText || '';
        if (text.trim().length > 5 && !element.hasAttribute('data-shieldai-scanned')) {
            element.setAttribute('data-shieldai-scanned', 'true');
            this.analyzeText(text, element);
        }
    }

    async analyzeText(text, element) {
        if (!this.isEnabled || text.length < 5) return;

        try {
            const response = await fetch(`${this.apiBase}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text.substring(0, 1000), // Limit length
                    platform: this.getCurrentPlatform(),
                    context: { region: 'kenya' }
                })
            });

            if (!response.ok) throw new Error('API response not ok');
            
            const result = await response.json();
            this.protectedCount++;
            
            if (result.is_toxic) {
                this.handleToxicContent(element, result, text);
            } else {
                this.markSafeContent(element);
            }
        } catch (error) {
            console.log('ShieldAI Analysis failed:', error);
        }
    }

    handleToxicContent(element, analysis, originalText) {
        this.blockedCount++;
        
        const warning = document.createElement('div');
        warning.className = 'shieldai-kenya-warning';
        warning.innerHTML = `
            <div class="shieldai-warning-content">
                <span class="shieldai-icon">🇰🇪</span>
                <strong>ShieldAI Kenya Protection</strong>
                <p>This content has been hidden for your safety</p>
                <small>Toxicity: ${Math.round(analysis.toxicity_score * 100)}% - ${analysis.warning_level} risk</small>
                <br>
                <button class="shieldai-show-btn">Show Anyway</button>
                <button class="shieldai-report-btn">Report Error</button>
            </div>
        `;

        // Store original content
        const originalDisplay = element.style.display;
        element.style.display = 'none';
        
        element.parentNode.insertBefore(warning, element);

        // Show button
        warning.querySelector('.shieldai-show-btn').addEventListener('click', () => {
            warning.remove();
            element.style.display = originalDisplay;
        });

        // Report button
        warning.querySelector('.shieldai-report-btn').addEventListener('click', () => {
            alert('Thank you for reporting. This helps improve ShieldAI Kenya.');
            warning.remove();
            element.style.display = originalDisplay;
        });
    }

    markSafeContent(element) {
        if (!element.querySelector('.shieldai-safe-badge')) {
            const badge = document.createElement('span');
            badge.className = 'shieldai-safe-badge';
            badge.textContent = ' ✅ Kenya Safe';
            badge.style.cssText = `
                margin-left: 8px;
                padding: 2px 6px;
                background: #10B981;
                color: white;
                border-radius: 12px;
                font-size: 10px;
                font-weight: bold;
                display: inline-block;
            `;
            element.appendChild(badge);
        }
    }

    getCurrentPlatform() {
        const hostname = window.location.hostname;
        if (hostname.includes('facebook')) return 'facebook';
        if (hostname.includes('twitter') || hostname.includes('x.com')) return 'twitter';
        if (hostname.includes('instagram')) return 'instagram';
        if (hostname.includes('whatsapp')) return 'whatsapp';
        return 'generic';
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'toggleProtection') {
                this.isEnabled = request.enabled;
                const badge = document.getElementById('shieldai-kenya-badge');
                if (badge) {
                    badge.style.display = this.isEnabled ? 'block' : 'none';
                }
                sendResponse({ status: 'success' });
            }
            
            if (request.action === 'getStats') {
                sendResponse({
                    protected: this.protectedCount,
                    blocked: this.blockedCount,
                    enabled: this.isEnabled
                });
            }
        });
    }
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ShieldAIKenya());
} else {
    new ShieldAIKenya();
}