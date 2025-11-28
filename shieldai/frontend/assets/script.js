// Main Application Script
class ShieldAIApp {
    constructor() {
        this.currentPlatform = 'twitter';
        this.analysisHistory = [];
        this.isInitialized = false;
        this.realTimeAnalyzer = null;
        
        // State
        this.state = {
            currentAnalysis: null,
            stats: null,
            resources: [],
            isOnline: true
        };
    }

    async initialize() {
        try {
            Utils.trackEvent('app', 'initialization_started');
            
            // Show loading screen
            this.showLoadingScreen();
            
            // Initialize components
            await this.initializeComponents();
            
            // Load initial data
            await this.loadInitialData();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize real-time analyzer
            this.realTimeAnalyzer = API.createRealTimeAnalyzer();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            this.isInitialized = true;
            
            Utils.trackEvent('app', 'initialization_completed');
            
            console.log('🚀 ShieldAI Frontend initialized successfully');
            
        } catch (error) {
            Utils.handleError(error, 'app_initialization');
            this.hideLoadingScreen();
        }
    }

    async initializeComponents() {
        // Load scenarios
        this.loadDemoScenarios();
        
        // Load platform tabs
        this.loadPlatformTabs();
        
        // Load features
        this.loadFeatures();
        
        // Check online status
        this.checkOnlineStatus();
    }

    async loadInitialData() {
        try {
            // Load stats
            await this.loadStats();
            
            // Load resources
            await this.loadResources();
            
            // Start stats auto-refresh
            this.startStatsAutoRefresh();
            
        } catch (error) {
            Utils.handleError(error, 'initial_data_loading');
        }
    }

    setupEventListeners() {
        // Mobile menu
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const navLinks = document.getElementById('navLinks');
        
        if (mobileMenuBtn && navLinks) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenuBtn.classList.toggle('active');
                navLinks.classList.toggle('active');
            });
        }

        // Real-time analysis
        const commentInput = document.getElementById('liveCommentInput');
        if (commentInput) {
            commentInput.addEventListener('input', (e) => {
                this.handleRealTimeAnalysis(e.target.value);
            });
            
            // Enter key to analyze
            commentInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.analyzeLiveComment();
                }
            });
        }

        // Analyze button
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => {
                this.analyzeLiveComment();
            });
        }

        // Online/offline detection
        window.addEventListener('online', () => {
            this.handleOnlineStatusChange(true);
        });
        
        window.addEventListener('offline', () => {
            this.handleOnlineStatusChange(false);
        });

        // Scroll events for header
        window.addEventListener('scroll', Utils.throttle(() => {
            this.handleScroll();
        }, 100));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Page visibility
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.loadStats(true); // Refresh stats when page becomes visible
            }
        });
    }

    // Demo Scenarios
    loadDemoScenarios() {
        const scenariosGrid = document.getElementById('scenariosGrid');
        if (!scenariosGrid) return;

        const scenariosHTML = CONFIG.DEMO_TEXTS.map(scenario => `
            <div class="scenario-card" onclick="app.loadScenario(${scenario.id - 1})">
                <div class="scenario-emoji">${scenario.title.split(' ')[0]}</div>
                <div class="scenario-title">${scenario.title.split(' ').slice(1).join(' ')}</div>
                <div class="scenario-text">"${scenario.text}"</div>
                <div class="scenario-expected">Expected: ${scenario.expected}</div>
            </div>
        `).join('');

        scenariosGrid.innerHTML = scenariosHTML;
    }

    async loadScenario(index) {
        const scenario = CONFIG.DEMO_TEXTS[index];
        if (!scenario) return;

        // Update platform
        this.switchPlatform(scenario.platform);
        
        // Set input text
        const commentInput = document.getElementById('liveCommentInput');
        if (commentInput) {
            commentInput.value = scenario.text;
        }
        
        // Auto-analyze after a short delay
        setTimeout(() => {
            this.analyzeLiveComment();
        }, 300);

        Utils.trackEvent('demo', 'scenario_loaded', scenario.title);
    }

    // Platform Management
    loadPlatformTabs() {
        const platformTabs = document.getElementById('platformTabs');
        if (!platformTabs) return;

        const tabsHTML = CONFIG.PLATFORMS.map(platform => `
            <button class="platform-tab ${platform.id === this.currentPlatform ? 'active' : ''}" 
                    onclick="app.switchPlatform('${platform.id}')">
                <span>${platform.icon}</span>
                <span>${platform.name}</span>
            </button>
        `).join('');

        platformTabs.innerHTML = tabsHTML;
    }

    switchPlatform(platformId) {
        this.currentPlatform = platformId;
        
        // Update active tab
        document.querySelectorAll('.platform-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[onclick="app.switchPlatform('${platformId}')"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Update input placeholder
        const commentInput = document.getElementById('liveCommentInput');
        if (commentInput) {
            commentInput.placeholder = `Try typing a ${platformId} comment... (e.g., "This is stupid" or "You're ugly")`;
        }

        Utils.trackEvent('platform', 'switched', platformId);
    }

    // Features
    loadFeatures() {
        const featuresGrid = document.getElementById('featuresGrid');
        if (!featuresGrid) return;

        const featuresHTML = CONFIG.FEATURES_LIST.map(feature => `
            <div class="feature-card">
                <div class="feature-icon">${feature.icon}</div>
                <h3>${feature.title}</h3>
                <p>${feature.description}</p>
            </div>
        `).join('');

        featuresGrid.innerHTML = featuresHTML;
    }

    // Real-time Analysis
    handleRealTimeAnalysis(text) {
        if (!this.realTimeAnalyzer) return;

        this.realTimeAnalyzer(text, this.currentPlatform, (result) => {
            this.displayRealTimeAnalysis(result);
        });
    }

    displayRealTimeAnalysis(result) {
        const analysisResult = document.getElementById('analysisResult');
        if (!analysisResult) return;

        if (result.status === 'empty') {
            analysisResult.innerHTML = '<span>Type something to see real-time analysis...</span>';
            return;
        }

        if (result.status === 'error') {
            analysisResult.innerHTML = `
                <span style="color: var(--danger);">
                    ❌ Analysis temporarily unavailable
                </span>
            `;
            return;
        }

        const confidencePercent = Math.round(result.confidence * 100);
        let html = '';

        if (result.is_toxic) {
            html = `
                <div style="color: var(--danger);">
                    <strong>🚨 Potential Issue Detected (${confidencePercent}% confidence)</strong>
                    <div style="font-size: 0.875rem; margin-top: 0.5rem; color: var(--warning);">
                        ${result.suggested_rewrite}
                    </div>
                </div>
            `;
        } else {
            html = `
                <div style="color: var(--safe);">
                    <strong>✅ Message appears respectful (${confidencePercent}% confidence)</strong>
                </div>
            `;
        }

        analysisResult.innerHTML = html;
    }

    // Live Analysis
    async analyzeLiveComment() {
        const commentInput = document.getElementById('liveCommentInput');
        if (!commentInput) return;

        const text = commentInput.value.trim();
        
        if (!Utils.isValidText(text)) {
            Utils.showToast('Please enter some text to analyze', 'warning');
            return;
        }

        try {
            Utils.trackEvent('analysis', 'live_analysis_started', this.currentPlatform);
            
            this.showAnalysisLoading();
            
            const result = await API.analyzeText(text, this.currentPlatform);
            
            this.displayAnalysisResult(result);
            this.addToAnalysisHistory(result);
            
            // Clear input
            commentInput.value = '';
            this.displayRealTimeAnalysis({ status: 'empty' });
            
            Utils.trackEvent('analysis', 'live_analysis_completed', this.currentPlatform);
            
        } catch (error) {
            Utils.handleError(error, 'live_analysis');
            this.showAnalysisError('Analysis service unavailable. Please try again.');
        }
    }

    displayAnalysisResult(result) {
        const analysisResults = document.getElementById('analysisResults');
        if (!analysisResults) return;

        const toxicityPercent = Math.round(result.toxicity_score * 100);
        const confidencePercent = Math.round(result.confidence * 100);
        
        let html = `
            <div class="analysis-header">
                <h3>🛡️ Analysis Results</h3>
                <div class="processing-time">Processed in ${result.processing_time?.toFixed(3) || '0'}s</div>
            </div>
            
            <div class="toxicity-score">
                <div class="score-header">
                    <span>Toxicity Score</span>
                    <span class="score-value ${this.getToxicityColorClass(result.toxicity_score)}">${toxicityPercent}%</span>
                </div>
                <div class="meter-bar">
                    <div class="meter-fill" style="width: ${toxicityPercent}%"></div>
                </div>
                <div class="meter-labels">
                    <span>Safe</span>
                    <span>Warning</span>
                    <span>Toxic</span>
                </div>
            </div>
            
            <div class="warning-level ${result.warning_level}">
                <strong>Warning Level:</strong> ${result.warning_level.toUpperCase()}
            </div>
        `;

        // Detected issues
        if (result.detected_issues && result.detected_issues.length > 0) {
            html += `
                <div class="detected-issues">
                    <strong>🚩 Detected Issues:</strong>
                    <ul>
                        ${result.detected_issues.map(issue => `<li>${issue}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        // Cultural context
        if (result.cultural_context && result.cultural_context.detected_regions && result.cultural_context.detected_regions.length > 0) {
            html += `
                <div class="cultural-context">
                    <strong>🌍 Cultural Context:</strong>
                    <p>Detected regional context: ${result.cultural_context.detected_regions.join(', ')}</p>
                </div>
            `;
        }

        // Suggestion
        html += `
            <div class="suggestion">
                <strong>💡 Suggestion:</strong>
                <p>${result.suggested_rewrite}</p>
            </div>
            
            <div class="confidence">
                <strong>Confidence:</strong> ${confidencePercent}%
            </div>
        `;

        analysisResults.innerHTML = html;
        
        // Scroll to results
        analysisResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    getToxicityColorClass(score) {
        if (score > 0.8) return 'toxic-high';
        if (score > 0.6) return 'toxic-medium';
        if (score > 0.4) return 'toxic-low';
        return 'toxic-none';
    }

    showAnalysisLoading() {
        const analysisResults = document.getElementById('analysisResults');
        if (!analysisResults) return;

        analysisResults.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
                <p>Analyzing your message for safety...</p>
            </div>
        `;
    }

    showAnalysisError(message) {
        const analysisResults = document.getElementById('analysisResults');
        if (!analysisResults) return;

        analysisResults.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--danger);">
                <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
                <p>${message}</p>
            </div>
        `;
    }

    // Stats Management
    async loadStats(forceRefresh = false) {
        try {
            const stats = await API.getStats(forceRefresh);
            this.state.stats = stats;
            this.updateStatsDisplay(stats);
        } catch (error) {
            Utils.handleError(error, 'stats_loading');
            // Use fallback stats
            this.updateStatsDisplay(API.getFallbackStats());
        }
    }

    updateStatsDisplay(stats) {
        // Update hero stats
        this.updateElementText('liveRequests', Utils.formatNumber(stats.total_requests));
        this.updateElementText('toxicityRate', Utils.formatPercentage(stats.toxicity_rate));
        
        // Update impact dashboard
        this.updateElementText('totalAnalyzed', Utils.formatNumber(stats.total_requests));
        this.updateElementText('toxicBlocked', Utils.formatNumber(stats.toxic_requests));
        this.updateElementText('avgResponseTime', Math.round(stats.average_response_time * 1000) + 'ms');
        
        // Update regional stats
        this.updateRegionalStats(stats);
        
        // Update chart if available
        this.updateStatsChart(stats);
    }

    updateRegionalStats(stats) {
        const regionalStats = document.getElementById('regionalStats');
        if (!regionalStats) return;

        // Simplified regional distribution for demo
        const regions = {
            'Nigeria': 45,
            'Kenya': 25,
            'South Africa': 20,
            'Ghana': 10
        };

        const html = Object.entries(regions).map(([region, percent]) => `
            <div class="region-stat">
                <span class="region-name">${region}</span>
                <div class="region-bar">
                    <div class="region-fill" style="width: ${percent}%"></div>
                </div>
                <span class="region-percent">${percent}%</span>
            </div>
        `).join('');

        regionalStats.innerHTML = html;
    }

    updateStatsChart(stats) {
        const chartCanvas = document.getElementById('protectionChart');
        if (!chartCanvas) return;

        const ctx = chartCanvas.getContext('2d');
        
        // Destroy existing chart
        if (this.statsChart) {
            this.statsChart.destroy();
        }

        // Create new chart
        this.statsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['6h ago', '5h ago', '4h ago', '3h ago', '2h ago', '1h ago', 'Now'],
                datasets: [{
                    label: 'Messages Analyzed',
                    data: [120, 150, 180, 200, 170, 190, stats.total_requests % 1000],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    }
                }
            }
        });
    }

    startStatsAutoRefresh() {
        setInterval(() => {
            if (!document.hidden && this.state.isOnline) {
                this.loadStats(true);
            }
        }, CONFIG.STATS_REFRESH_INTERVAL);
    }

    // Resources
    async loadResources(country = 'nigeria') {
        try {
            const resources = await API.getResources(country);
            this.state.resources = resources;
            this.displayResources(resources);
        } catch (error) {
            Utils.handleError(error, 'resources_loading');
            this.displayDefaultResources();
        }
    }

    displayResources(resources) {
        const resourcesGrid = document.getElementById('resourcesGrid');
        if (!resourcesGrid) return;

        const html = resources.map(resource => `
            <div class="resource-card">
                <h4>${resource.name}</h4>
                <div class="resource-phone">${resource.phone}</div>
                <div class="resource-services">${resource.services.join(', ')}</div>
                <div class="resource-availability">${resource.availability}</div>
            </div>
        `).join('');

        resourcesGrid.innerHTML = html;
    }

    displayDefaultResources() {
        const defaultResources = [
            {
                name: 'Local Emergency Services',
                phone: '112 or 911',
                services: ['Emergency Response'],
                availability: '24/7'
            },
            {
                name: 'Mental Health Support',
                phone: 'Text SUPPORT to 741741',
                services: ['Crisis Counseling'],
                availability: '24/7'
            }
        ];
        
        this.displayResources(defaultResources);
    }

    // UI Helpers
    updateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    // Online/Offline Handling
    checkOnlineStatus() {
        this.state.isOnline = Utils.isOnline();
        this.updateOnlineIndicator();
    }

    handleOnlineStatusChange(isOnline) {
        this.state.isOnline = isOnline;
        this.updateOnlineIndicator();
        
        if (isOnline) {
            Utils.showToast('Back online', 'success');
            this.loadStats(true); // Refresh data when coming online
        } else {
            Utils.showToast('You are offline', 'warning');
        }
        
        Utils.trackEvent('network', isOnline ? 'online' : 'offline');
    }

    updateOnlineIndicator() {
        // Could add a small indicator in the header
        console.log(`🌐 Online status: ${this.state.isOnline ? 'Online' : 'Offline'}`);
    }

    // Scroll Handling
    handleScroll() {
        const header = document.querySelector('.header');
        if (header) {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    }

    // Keyboard Shortcuts
    handleKeyboardShortcuts(event) {
        // Number keys 1-5 for demo scenarios
        if (event.altKey && event.key >= '1' && event.key <= '5') {
            const index = parseInt(event.key) - 1;
            if (CONFIG.DEMO_TEXTS[index]) {
                event.preventDefault();
                this.loadScenario(index);
            }
        }
        
        // Escape to clear input
        if (event.key === 'Escape') {
            const commentInput = document.getElementById('liveCommentInput');
            if (commentInput) {
                commentInput.value = '';
                this.displayRealTimeAnalysis({ status: 'empty' });
            }
        }
    }

    // Analysis History
    addToAnalysisHistory(result) {
        this.analysisHistory.unshift({
            ...result,
            timestamp: new Date().toISOString(),
            platform: this.currentPlatform
        });
        
        // Keep only last 50 analyses
        if (this.analysisHistory.length > 50) {
            this.analysisHistory = this.analysisHistory.slice(0, 50);
        }
        
        // Store in localStorage
        Utils.setStorage('analysisHistory', this.analysisHistory);
    }

    getAnalysisHistory() {
        return Utils.getStorage('analysisHistory', []);
    }

    clearAnalysisHistory() {
        this.analysisHistory = [];
        Utils.removeStorage('analysisHistory');
    }

    // Extension Methods
    showExtensionModal() {
        this.showModal('extensionModal');
        Utils.trackEvent('extension', 'modal_opened');
    }

    installExtension() {
        Utils.trackEvent('extension', 'install_clicked');
        Utils.showToast('Extension installation coming soon!', 'info');
    }

    // Modal Management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
        }
    }

    // Navigation
    scrollToDemo() {
        const demoSection = document.getElementById('demo');
        if (demoSection) {
            demoSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Global functions for HTML onclick handlers
function scrollToDemo() {
    if (window.app) {
        window.app.scrollToDemo();
    }
}

function showExtensionModal() {
    if (window.app) {
        window.app.showExtensionModal();
    }
}

function closeModal(modalId) {
    if (window.app) {
        window.app.closeModal(modalId);
    }
}

function installExtension() {
    if (window.app) {
        window.app.installExtension();
    }
}

function analyzeLiveComment() {
    if (window.app) {
        window.app.analyzeLiveComment();
    }
}

function showExtensionDemo() {
    Utils.showToast('Extension demo coming soon!', 'info');
}

function downloadExtension() {
    Utils.showToast('Extension download coming soon!', 'info');
}

function showApiDocs() {
    Utils.showToast('API documentation: http://localhost:8000/docs', 'info');
}

function showPrivacyPolicy() {
    Utils.showToast('Privacy policy coming soon!', 'info');
}

function showAbout() {
    Utils.showToast('ShieldAI - Protecting women and girls from digital violence', 'info');
}

function showContact() {
    Utils.showToast('Contact us at: hello@shieldai.com', 'info');
}

function showCareers() {
    Utils.showToast('Join our team! Visit careers.shieldai.com', 'info');
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ShieldAIApp();
    window.app.initialize();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShieldAIApp;
}