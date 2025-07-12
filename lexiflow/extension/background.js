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

// Gestion des retours OAuth
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Vérifier si c'est notre URL de callback OAuth
    if (tab.url.includes('my-backend-api-cng7.onrender.com/oauth-success.html') ||
        tab.url.includes('my-backend-api-cng7.onrender.com/oauth-error.html') ||
        tab.url.includes('my-backend-api-cng7.onrender.com/oauth-intermediate.html')) {
      
      // Extraire le token de l'URL
      const url = new URL(tab.url);
      const token = url.searchParams.get('token');
      const error = url.searchParams.get('error');
      
      if (token) {
        // Sauvegarder le token
        chrome.storage.local.set({ authToken: token }, () => {
          // Fermer l'onglet OAuth
          chrome.tabs.remove(tabId);
          
          // Notifier l'utilisateur (vérifier que l'API est disponible)
          if (chrome.notifications && chrome.notifications.create) {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: chrome.runtime.getURL('popup.html'),
              title: 'Connexion réussie!',
              message: 'Vous êtes maintenant connecté à LexiFlow.'
            }, () => {
              if (chrome.runtime.lastError) {
                console.log('Notification error:', chrome.runtime.lastError);
              }
            });
          }
        });
      } else if (error) {
        // Fermer l'onglet et afficher l'erreur
        chrome.tabs.remove(tabId);
        
        if (chrome.notifications && chrome.notifications.create) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('popup.html'),
            title: 'Erreur de connexion',
            message: error || 'Une erreur est survenue'
          }, () => {
            if (chrome.runtime.lastError) {
              console.log('Notification error:', chrome.runtime.lastError);
            }
          });
        }
      }
    }
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
  
  // Synchroniser une flashcard avec le serveur
  if (request.action === 'syncFlashcard') {
    chrome.storage.local.get(['authToken'], async (result) => {
      if (result.authToken && request.flashcard) {
        try {
          const response = await fetch('https://my-backend-api-cng7.onrender.com/api/flashcards', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${result.authToken}`
            },
            body: JSON.stringify(request.flashcard)
          });
          
          if (response.ok) {
            console.log('✅ Flashcard synchronisée avec le serveur');
          } else {
            console.error('❌ Erreur lors de la synchronisation');
          }
        } catch (error) {
          console.error('❌ Erreur réseau:', error);
        }
      }
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