// Background script for ShieldAI Kenya
chrome.runtime.onInstalled.addListener(() => {
    console.log('🇰🇪 ShieldAI Kenya Extension Installed');
    chrome.storage.sync.set({ protectionEnabled: true });
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: 'toggleProtection' });
});