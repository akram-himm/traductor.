// Service Worker pour Quick Translator Pro

// Gestion de l'installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('🎉 Quick Translator Pro installé avec succès!');
    
    // Définir les paramètres par défaut
    chrome.storage.sync.set({
      targetLanguage: 'fr',
      isEnabled: true,
      buttonColor: '#3b82f6',
      isPro: false,
      enableShortcut: true,
      deepSeekEnabled: false,
      deepSeekApiKey: '',
      autoDetectSameLanguage: true,
      showConfidence: true,
      animationsEnabled: true
    });
    
    // Ouvrir la page de bienvenue (optionnel)
    chrome.tabs.create({
      url: 'popup.html'
    });
  } else if (details.reason === 'update') {
    console.log('✨ Quick Translator Pro mis à jour!');
  }
});

// Gestion des commandes clavier
chrome.commands.onCommand.addListener((command) => {
  if (command === 'translate-selection') {
    // Envoyer un message au content script de l'onglet actif
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'triggerTranslation' 
        }).catch(() => {
          console.log('Content script not loaded on this page');
        });
      }
    });
  }
});

// Gestion des messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openOptionsPage') {
    chrome.runtime.openOptionsPage();
    return true;
  }
  
  if (request.action === 'getTabInfo') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ tab: tabs[0] });
    });
    return true;
  }
});

// Garder le service worker actif
chrome.alarms.create('keepAlive', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    console.log('⏰ Keep alive ping');
  }
});

// Nettoyer les données anciennes périodiquement
chrome.alarms.create('cleanup', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanup') {
    cleanupOldData();
  }
});

// Fonction de nettoyage
async function cleanupOldData() {
  try {
    const { translations = [] } = await chrome.storage.local.get('translations');
    
    // Garder seulement les 1000 dernières traductions
    if (translations.length > 1000) {
      const trimmed = translations.slice(0, 1000);
      await chrome.storage.local.set({ translations: trimmed });
      console.log(`🧹 Nettoyage: ${translations.length - 1000} traductions supprimées`);
    }
  } catch (error) {
    console.error('❌ Erreur de nettoyage:', error);
  }
}