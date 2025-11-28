class ShieldAIExtension {
    constructor() {
        this.initialized = false;
        this.settings = {
            enabled: true,
            sensitivity: 0.7,
            showWarnings: true,
            platform: 'auto'
        };
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.initializeObserver();
        this.initialized = true;
        console.log('🛡️ ShieldAI Extension initialized');
    }

    async loadSettings() {
        const stored = await chrome.storage.sync.get(['shieldAISettings']);
        this.settings = { ...this.settings, ...stored.shieldAISettings };
    }

    initializeObserver() {
        // Monitor for new social media text areas
        const observer = new MutationObserver((mutations) => {
            if (!this.settings.enabled) return;

            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        this.scanForTextAreas(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Also scan existing text areas
        this.scanForTextAreas(document.body);
    }

    scanForTextAreas(element) {
        if (!this.settings.enabled) return;

        const textAreas = element.querySelectorAll?.(
            `textarea, 
            [contenteditable="true"],
            [data-testid="tweetTextarea"],
            [aria-label*="comment" i],
            [aria-label*="post" i],
            [aria-label*="message" i],
            .public-DraftEditor-content,
            .editable`
        ) || [];

        textAreas.forEach(area => {
            if (!area.hasAttribute('data-shieldai-enhanced')) {
                this.enhanceTextArea(area);
                area.setAttribute('data-shieldai-enhanced', 'true');
            }
        });
    }

    enhanceTextArea(textArea) {
        // Add event listeners for real-time analysis
        const events = ['input', 'blur', 'focus'];
        
        events.forEach(event => {
            textArea.addEventListener(event, debounce(() => {
                this.analyzeTextArea(textArea);
            }, 500));
        });

        // Add ShieldAI indicator
        this.addIndicator(textArea);
    }

    async analyzeTextArea(textArea) {
        const text = this.getTextFromElement(textArea);
        
        if (!text || text.length < 3) {
            this.clearIndicator(textArea);
            return;
        }

        try {
            this.showAnalyzingIndicator(textArea);

            const response = await fetch('http://localhost:8000/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    platform: this.detectPlatform(),
                    language: 'auto'
                })
            });

            if (!response.ok) throw new Error('Analysis failed');

            const data = await response.json();
            this.handleAnalysisResult(textArea, data);

        } catch (error) {
            console.error('ShieldAI analysis error:', error);
            this.showErrorIndicator(textArea);
        }
    }

    getTextFromElement(element) {
        if (element.tagName === 'TEXTAREA') {
            return element.value;
        } else if (element.isContentEditable) {
            return element.textContent || element.innerText;
        }
        return '';
    }

    detectPlatform() {
        const hostname = window.location.hostname;
        
        if (hostname.includes('twitter.com')) return 'twitter';
        if (hostname.includes('facebook.com')) return 'facebook';
        if (hostname.includes('instagram.com')) return 'instagram';
        if (hostname.includes('whatsapp.com')) return 'whatsapp';
        
        return 'general';
    }

    handleAnalysisResult(textArea, data) {
        if (data.is_toxic && data.confidence > this.settings.sensitivity) {
            this.showWarningIndicator(textArea, data);
            
            if (this.settings.showWarnings) {
                this.showWarningMessage(textArea, data);
            }
        } else {
            this.showSafeIndicator(textArea);
        }
    }

    addIndicator(textArea) {
        const indicator = document.createElement('div');
        indicator.className = 'shieldai-indicator';
        indicator.innerHTML = '🛡️';
        indicator.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            font-size: 14px;
            opacity: 0.7;
            z-index: 1000;
            pointer-events: none;
            transition: all 0.3s ease;
        `;

        // Position relative to text area
        textArea.style.position = 'relative';
        textArea.parentNode.style.position = 'relative';
        textArea.parentNode.appendChild(indicator);
    }

    showAnalyzingIndicator(textArea) {
        const indicator = textArea.parentNode.querySelector('.shieldai-indicator');
        if (indicator) {
            indicator.innerHTML = '🔍';
            indicator.style.color = '#f59e0b';
        }
    }

    showSafeIndicator(textArea) {
        const indicator = textArea.parentNode.querySelector('.shieldai-indicator');
        if (indicator) {
            indicator.innerHTML = '🛡️';
            indicator.style.color = '#10b981';
        }
    }

    showWarningIndicator(textArea, data) {
        const indicator = textArea.parentNode.querySelector('.shieldai-indicator');
        if (indicator) {
            indicator.innerHTML = '🚨';
            indicator.style.color = '#ef4444';
            indicator.title = `Toxicity: ${Math.round(data.toxicity_score * 100)}% - ${data.suggested_rewrite}`;
        }
    }

    showErrorIndicator(textArea) {
        const indicator = textArea.parentNode.querySelector('.shieldai-indicator');
        if (indicator) {
            indicator.innerHTML = '❌';
            indicator.style.color = '#6b7280';
        }
    }

    clearIndicator(textArea) {
        const indicator = textArea.parentNode.querySelector('.shieldai-indicator');
        if (indicator) {
            indicator.innerHTML = '🛡️';
            indicator.style.color = '#6b7280';
        }
    }

    showWarningMessage(textArea, data) {
        // Remove existing warning
        this.removeWarningMessage(textArea);

        const warning = document.createElement('div');
        warning.className = 'shieldai-warning-message';
        warning.innerHTML = `
            <div style="
                background: #fef3cd;
                border: 1px solid #f59e0b;
                border-radius: 8px;
                padding: 12px;
                margin: 8px 0;
                font-size: 14px;
                color: #92400e;
                display: flex;
                align-items: flex-start;
                gap: 8px;
            ">
                <span style="font-size: 16px;">⚠️</span>
                <div>
                    <strong>ShieldAI:</strong> ${data.suggested_rewrite}
                    <div style="font-size: 12px; margin-top: 4px; opacity: 0.8;">
                        Toxicity confidence: ${Math.round(data.confidence * 100)}%
                    </div>
                </div>
            </div>
        `;

        textArea.parentNode.insertBefore(warning, textArea.nextSibling);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            this.removeWarningMessage(textArea);
        }, 10000);
    }

    removeWarningMessage(textArea) {
        const existingWarning = textArea.parentNode.querySelector('.shieldai-warning-message');
        if (existingWarning) {
            existingWarning.remove();
        }
    }
}

// Utility function
function debounce(func, wait) {
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

// Initialize extension
const shieldAI = new ShieldAIExtension();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShieldAIExtension;
}