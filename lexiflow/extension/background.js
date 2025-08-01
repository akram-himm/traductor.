// Service Worker pour Quick Translator Pro

// Gestion de l'installation
// Debug function - désactiver en production
const DEBUG = true; // Mettre à true pour activer les logs
const debug = (...args) => DEBUG && console.log(...args);


chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    debug('🎉 Quick Translator Pro installé avec succès!');
    
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
    debug('✨ Quick Translator Pro mis à jour!');
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
          debug('Content script not loaded on this page');
        });
      }
    });
  }
});

// Gestion des retours OAuth et paiements
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Vérifier si c'est notre page de succès de paiement
    if (tab.url.includes('payment-success.html')) {
      debug('💰 Page de succès de paiement détectée');
      
      // Attendre que les webhooks se traitent
      setTimeout(() => {
        // Notifier toutes les vues de l'extension pour rafraîchir
        chrome.runtime.sendMessage({
          type: 'payment-success'
        }).catch(() => {});
        
        // Mettre à jour le profil utilisateur
        chrome.storage.local.get(['authToken'], async (result) => {
          if (result.authToken) {
            try {
              const response = await fetch('https://my-backend-api-cng7.onrender.com/api/user/profile', {
                headers: {
                  'Authorization': `Bearer ${result.authToken}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.user) {
                  chrome.storage.local.set({ user: data.user });
                  debug('✅ Profil utilisateur mis à jour après paiement');
                }
              }
            } catch (error) {
              debug('❌ Erreur mise à jour profil:', error);
            }
          }
        });
      }, 5000); // Attendre 5 secondes pour les webhooks
    }
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
          debug('Token sauvegardé dans chrome.storage');
          
          // Fermer l'onglet OAuth
          chrome.tabs.remove(tabId);
          
          // Notifier toutes les vues de l'extension
          chrome.runtime.sendMessage({
            type: 'oauth-success',
            token: token
          }).catch(() => {
            // Ignorer l'erreur si aucune vue n'écoute
          });
          
          // Notifier l'utilisateur (vérifier que l'API est disponible)
          if (chrome.notifications && chrome.notifications.create) {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
              title: 'Connexion réussie!',
              message: 'Vous êtes maintenant connecté à LexiFlow.'
            }, () => {
              if (chrome.runtime.lastError) {
                debug('Notification error:', chrome.runtime.lastError);
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
            iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
            title: 'Erreur de connexion',
            message: error || 'Une erreur est survenue'
          }, () => {
            if (chrome.runtime.lastError) {
              debug('Notification error:', chrome.runtime.lastError);
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
  
  // Gérer la mise à jour du profil après paiement
  if (request.action === 'updateUserProfile') {
    chrome.storage.local.get(['authToken'], async (result) => {
      if (result.authToken) {
        try {
          const response = await fetch('https://my-backend-api-cng7.onrender.com/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${result.authToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              chrome.storage.local.set({ user: data.user }, () => {
                sendResponse({ success: true, user: data.user });
              });
            }
          } else {
            sendResponse({ success: false, error: 'Failed to update profile' });
          }
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      } else {
        sendResponse({ success: false, error: 'Not authenticated' });
      }
    });
    return true; // Asynchrone
  }
  
  // Synchroniser une flashcard avec le serveur
  if (request.action === 'syncFlashcard') {
    chrome.storage.local.get(['authToken'], async (result) => {
      if (result.authToken && request.flashcard) {
        try {
          // Adapter le format pour le backend qui attend front/back/language/sourceLanguage
          const flashcardData = {
            front: request.flashcard.originalText,
            back: request.flashcard.translatedText,
            language: request.flashcard.targetLanguage || 'fr',
            sourceLanguage: request.flashcard.sourceLanguage || null,
            category: request.flashcard.folder || 'default',
            difficulty: request.flashcard.difficulty === 'normal' ? 0 : 
                       request.flashcard.difficulty === 'hard' ? 3 : 
                       request.flashcard.difficulty === 'easy' ? 1 : 0
          };
          
          const response = await fetch('https://my-backend-api-cng7.onrender.com/api/flashcards', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${result.authToken}`
            },
            body: JSON.stringify(flashcardData)
          });
          
          if (response.ok) {
            debug('✅ Flashcard synchronisée avec le serveur');
            const data = await response.json();
            sendResponse({ success: true, flashcard: data });
            
            // Notifier le popup pour rafraîchir les flashcards
            chrome.runtime.sendMessage({
              action: 'flashcardAdded',
              flashcard: data
            }).catch(() => {
              // Ignorer l'erreur si le popup n'est pas ouvert
            });
          } else {
            const errorText = await response.text();
            if (response.status === 409) {
              debug('⚠️ Flashcard existe déjà, pas grave');
              // Considérer comme un succès pour éviter les re-tentatives
              sendResponse({ success: true, duplicate: true });
              
              // Notifier quand même le popup pour rafraîchir
              chrome.runtime.sendMessage({
                action: 'flashcardAdded',
                duplicate: true
              }).catch(() => {});
            } else {
              console.error('❌ Erreur lors de la synchronisation:', errorText);
              sendResponse({ success: false, error: errorText });
            }
          }
        } catch (error) {
          console.error('❌ Erreur réseau:', error);
          sendResponse({ success: false, error: error.message });
        }
      } else {
        sendResponse({ success: false, error: 'Not authenticated' });
      }
    });
    return true;
  }
});

// Garder le service worker actif
chrome.alarms.create('keepAlive', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    debug('⏰ Keep alive ping');
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
      debug(`🧹 Nettoyage: ${translations.length - 1000} traductions supprimées`);
    }
  } catch (error) {
    console.error('❌ Erreur de nettoyage:', error);
  }
}