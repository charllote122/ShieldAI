// Main JavaScript functionality for ShieldAI

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Hide loading screen
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }, 1500);

    // Initialize components
    initializeMobileMenu();
    initializeDemoFeatures();
    initializeStats();
    initializeEventListeners();
}

// Mobile Menu functionality
function initializeMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });
    }
}

// Demo functionality
function initializeDemoFeatures() {
    // Initialize live comment analysis
    const commentInput = document.getElementById('liveCommentInput');
    if (commentInput) {
        commentInput.addEventListener('input', function() {
            analyzeCommentInRealTime(this.value);
        });
    }

    // Initialize scenario buttons
    const scenarioCards = document.querySelectorAll('.scenario-card');
    scenarioCards.forEach(card => {
        card.addEventListener('click', function() {
            const scenarioType = this.getAttribute('data-scenario');
            loadScenario(scenarioType);
        });
    });
}

// Real-time comment analysis
function analyzeCommentInRealTime(text) {
    const analysisResult = document.getElementById('analysisResult');
    if (!analysisResult) return;

    if (text.length === 0) {
        analysisResult.innerHTML = '<span>Type something to see real-time analysis...</span>';
        return;
    }

    // Simulate AI analysis
    const toxicityScore = Math.min(Math.floor(Math.random() * 100), 95);
    const responseTime = Math.floor(Math.random() * 200) + 100;

    let analysisText = '';
    let analysisClass = '';

    if (toxicityScore > 70) {
        analysisText = `🚨 High toxicity detected (${toxicityScore}%) - This content appears harmful`;
        analysisClass = 'toxic';
    } else if (toxicityScore > 30) {
        analysisText = `⚠️ Moderate toxicity detected (${toxicityScore}%) - Proceed with caution`;
        analysisClass = 'warning';
    } else {
        analysisText = `✅ Low toxicity (${toxicityScore}%) - This content appears safe`;
        analysisClass = 'safe';
    }

    analysisResult.innerHTML = `
        <div class="analysis ${analysisClass}">
            <strong>${analysisText}</strong>
            <br>
            <small>Analysis time: ${responseTime}ms</small>
        </div>
    `;
}

// Analyze live comment
function analyzeLiveComment() {
    const commentInput = document.getElementById('liveCommentInput');
    const resultsDetails = document.getElementById('resultsDetails');
    const resultsPlaceholder = document.getElementById('resultsPlaceholder');
    const toxicityScore = document.getElementById('toxicityScore');
    const toxicityCategory = document.getElementById('toxicityCategory');
    const responseTime = document.getElementById('responseTime');
    const confidenceFill = document.getElementById('confidenceFill');
    const confidenceValue = document.getElementById('confidenceValue');

    if (!commentInput || commentInput.value.trim() === '') {
        alert('Please enter a comment to analyze');
        return;
    }

    // Show loading state
    if (resultsPlaceholder) resultsPlaceholder.style.display = 'none';
    if (resultsDetails) resultsDetails.style.display = 'block';

    // Simulate API call
    setTimeout(() => {
        const text = commentInput.value.toLowerCase();
        let score, category, confidence;

        // Simple pattern matching for demo
        if (text.includes('stupid') || text.includes('ugly') || text.includes('hate') || text.includes('kill')) {
            score = '92%';
            category = 'Harassment & Threats';
            confidence = 95;
        } else if (text.includes('women') && (text.includes('kitchen') || text.includes('belong'))) {
            score = '88%';
            category = 'Gender-based Harassment';
            confidence = 92;
        } else if (text.includes('na wash') || text.includes('you fit')) {
            score = '76%';
            category = 'Cultural Context Harassment';
            confidence = 85;
        } else {
            score = '12%';
            category = 'Safe Content';
            confidence = 98;
        }

        // Update UI
        if (toxicityScore) toxicityScore.textContent = score;
        if (toxicityCategory) toxicityCategory.textContent = category;
        if (responseTime) responseTime.textContent = `${Math.floor(Math.random() * 200) + 100}ms`;
        if (confidenceFill) confidenceFill.style.width = `${confidence}%`;
        if (confidenceValue) confidenceValue.textContent = `${confidence}%`;

        // Add animation
        if (resultsDetails) {
            resultsDetails.classList.add('fade-in');
        }
    }, 800);
}

// Load demo scenario
function loadScenario(scenarioType) {
    const scenarios = {
        harassment: {
            text: "You're too pretty to be in tech. Stick to modeling or find a rich husband instead.",
            type: "Gender-based Harassment"
        },
        hate_speech: {
            text: "Women like you are destroying our culture with your Western ideas. Go back to where you came from!",
            type: "Hate Speech"
        },
        threats: {
            text: "I know where you work. Watch your back, you won't last long in this industry.",
            type: "Direct Threats"
        },
        cultural: {
            text: "This na wash! You think say you fit code? Go marry make your husband take care of you!",
            type: "Cultural Context Harassment"
        }
    };

    const scenario = scenarios[scenarioType];
    if (scenario) {
        const commentInput = document.getElementById('liveCommentInput');
        if (commentInput) {
            commentInput.value = scenario.text;
            analyzeLiveComment();
        }
    }
}

// Initialize statistics
function initializeStats() {
    // Animate stat counters
    const statElements = document.querySelectorAll('.stat-number');
    statElements.forEach(stat => {
        if (stat.textContent.includes('%') || stat.textContent.includes('ms')) {
            return; // Skip percentages and time values
        }
        
        const target = parseInt(stat.textContent.replace(/,/g, ''));
        if (!isNaN(target)) {
            animateCounter(stat, 0, target, 2000);
        }
    });
}

// Animate counter
function animateCounter(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value.toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Initialize event listeners
function initializeEventListeners() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Platform selector
    const platformSelect = document.getElementById('platformSelect');
    if (platformSelect) {
        platformSelect.addEventListener('change', function() {
            updateDemoPlatform(this.value);
        });
    }
}

// Update demo platform
function updateDemoPlatform(platform) {
    const platformNames = {
        twitter: 'Twitter/X',
        facebook: 'Facebook',
        instagram: 'Instagram',
        whatsapp: 'WhatsApp'
    };

    console.log(`Switched to ${platformNames[platform]} demo`);
    // In a real implementation, this would update the UI to match the selected platform
}

// Extension installation
function installExtension() {
    // Simulate extension installation
    const modal = document.getElementById('extensionModal');
    if (modal) {
        modal.style.display = 'block';
    } else {
        alert('Extension installation would redirect to Chrome Web Store. This is a demo.');
    }
}

// Modal functionality
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Scroll to demo section
function scrollToDemo() {
    const demoSection = document.getElementById('demo');
    if (demoSection) {
        demoSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        window.location.href = 'demo.html';
    }
}

// Show extension modal
function showExtensionModal() {
    const modal = document.getElementById('extensionModal');
    if (modal) {
        modal.style.display = 'block';
    } else {
        window.location.href = 'extension.html';
    }
}

// Toast notifications
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);

    // Remove after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 5000);
}

// Export functions for global access
window.analyzeLiveComment = analyzeLiveComment;
window.scrollToDemo = scrollToDemo;
window.showExtensionModal = showExtensionModal;
window.installExtension = installExtension;
window.closeModal = closeModal;
window.testScenario = loadScenario;