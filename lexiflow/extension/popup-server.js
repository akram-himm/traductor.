// Modifications principales pour utiliser uniquement le serveur

// 1. Nouvelle fonction loadData qui ne charge plus les flashcards localement
async function loadData() {
  if (isAddingFlashcard) {
    console.log('⏸️ LoadData ignoré: ajout de flashcard en cours');
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    chrome.storage.sync.get({
      targetLanguage: 'fr',
      isEnabled: true,
      buttonColor: '#3b82f6',
      isPro: false,
      enableShortcut: true,
      deepSeekEnabled: false,
      deepSeekApiKey: '',
      autoDetectSameLanguage: true,
      showConfidence: true,
      animationsEnabled: true,
      hoverTranslation: true,
      immersionMode: false,
      autoSaveToFlashcards: false
    }, async (settings) => {
      userSettings = settings;
      console.log('⚙️ Paramètres chargés:', userSettings);
      
      // Charger uniquement l'historique localement
      chrome.storage.local.get({
        translations: [],
        flashcardFolders: flashcardFolders,
        totalTranslations: 0
      }, async (data) => {
        translations = data.translations || [];
        flashcardFolders = data.flashcardFolders || flashcardFolders;
        
        // Charger les flashcards depuis le serveur
        await loadFlashcardsFromServer();
        
        console.log('📊 Données chargées:', {
          translations: translations.length,
          flashcards: flashcards.length,
          totalTranslations: data.totalTranslations || translations.length
        });
        
        updateHistory();
        updateStats();
        resolve();
      });
    });
  });
}

// 2. Remplacer createFlashcardFromHistory pour utiliser le serveur
async function createFlashcardFromHistory(original, translated, language, sourceLanguage = null) {
  // Vérifier si l'utilisateur est connecté
  const token = await authAPI.getToken();
  if (!token) {
    showNotification('Connectez-vous pour créer des flashcards', 'warning');
    showAuthSection();
    return;
  }
  
  // Vérifier le quota
  const user = await authAPI.getCurrentUser();
  if (user) {
    const isPremium = user.subscriptionStatus === 'premium';
    const limit = isPremium ? 200 : 50;
    const flashcardsCount = flashcards.length;
    
    if (flashcardsCount >= limit) {
      showNotification(`Limite de ${limit} flashcards atteinte (${isPremium ? 'Premium' : 'Free'})`, 'warning');
      if (!isPremium) {
        showPricingModal();
      }
      return;
    }
  }
  
  try {
    // Vérifier que nous avons une langue source valide (pas 'auto')
    if (!sourceLanguage || sourceLanguage === 'auto') {
      console.log('⚠️ Pas de langue source détectée, flashcard ignorée');
      showNotification('Impossible de créer la flashcard: langue source non détectée', 'warning');
      return;
    }
    
    console.log('💾 Création flashcard:', {
      original,
      translated,
      sourceLanguage: sourceLanguage,
      targetLanguage: language
    });
    
    const response = await flashcardsAPI.create({
      originalText: original,
      translatedText: translated,
      sourceLanguage: sourceLanguage,
      targetLanguage: language,
      language: language,
      folder: 'default',
      difficulty: 'normal'
    });
    
    if (response && response.id) {
      console.log('✅ Flashcard créée sur le serveur');
      
      // Recharger toutes les flashcards depuis le serveur
      await loadFlashcardsFromServer();
      
      showNotification('Flashcard ajoutée!', 'success');
    }
    
  } catch (error) {
    console.error('❌ Erreur création flashcard:', error);
    if (error.message && error.message.includes('existe déjà')) {
      showNotification('Cette flashcard existe déjà', 'warning');
    } else {
      showNotification('Erreur lors de la création', 'error');
    }
  }
}

// 3. Remplacer deleteFlashcard pour supprimer sur le serveur
async function deleteFlashcard(id) {
  if (!confirm('Supprimer cette flashcard ?')) return;
  
  try {
    await flashcardsAPI.delete(id);
    console.log('✅ Flashcard supprimée du serveur');
    
    // Recharger depuis le serveur
    await loadFlashcardsFromServer();
    
    showNotification('Flashcard supprimée', 'success');
  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    showNotification('Erreur lors de la suppression', 'error');
  }
}

// 4. Remplacer clearFlashcards pour tout supprimer sur le serveur
async function clearFlashcards() {
  if (!confirm('Effacer toutes les flashcards ?')) return;
  
  const token = await authAPI.getToken();
  if (!token) {
    showNotification('Connectez-vous pour effacer les flashcards', 'warning');
    return;
  }
  
  try {
    showNotification('Suppression en cours...', 'info');
    
    // Supprimer toutes les flashcards sur le serveur une par une
    const deletePromises = flashcards
      .filter(card => card.id)
      .map(card => flashcardsAPI.delete(card.id).catch(err => {
        console.error(`Erreur suppression ${card.id}:`, err);
      }));
    
    await Promise.all(deletePromises);
    console.log('✅ Toutes les flashcards supprimées du serveur');
    
    // Recharger (devrait être vide maintenant)
    await loadFlashcardsFromServer();
    
    showNotification('Flashcards effacées', 'success');
  } catch (error) {
    console.error('❌ Erreur:', error);
    showNotification('Erreur lors de la suppression', 'error');
  }
}

// 5. Simplifier syncFlashcardsAfterLogin pour juste charger depuis le serveur
async function syncFlashcardsAfterLogin(mergeMode = false) {
  console.log('🔄 Chargement des flashcards depuis le serveur...');
  
  // Charger simplement depuis le serveur
  await loadFlashcardsFromServer();
  
  console.log('✅ Synchronisation terminée');
}

// IMPORTANT: Remplacer toutes les occurrences de :
// - localStorage.setItem('flashcards', ...)
// - chrome.storage.local.set({ flashcards })
// - chrome.storage.local.get(['flashcards'], ...)
// Par des appels à loadFlashcardsFromServer()

// Note: Les traductions (historique) restent en local car c'est moins critique