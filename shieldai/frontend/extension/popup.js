// Popup script for ShieldAI Kenya
document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('protectionToggle');
    const refreshBtn = document.getElementById('refreshBtn');
    const settingsBtn = document.getElementById('settingsBtn');

    // Load saved settings
    chrome.storage.sync.get(['protectionEnabled'], function(result) {
        toggle.checked = result.protectionEnabled !== false;
    });

    // Toggle protection
    toggle.addEventListener('change', function() {
        chrome.storage.sync.set({ protectionEnabled: this.checked });
        
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'toggleProtection',
                enabled: toggle.checked
            }, updateStats);
        });
    });

    // Refresh protection
    refreshBtn.addEventListener('click', function() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.reload(tabs[0].id);
        });
    });

    // Settings
    settingsBtn.addEventListener('click', function() {
        chrome.runtime.openOptionsPage();
    });

    // Get current stats
    updateStats();
});

function updateStats() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getStats' }, function(response) {
            if (response) {
                document.getElementById('protectedCount').textContent = response.protected || 0;
                document.getElementById('safeCount').textContent = (response.protected - response.blocked) || 0;
                document.getElementById('blockedCount').textContent = response.blocked || 0;
            }
        });
    });
}