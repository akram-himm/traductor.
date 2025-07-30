// Version modifiée des fonctions clés pour utiliser uniquement le serveur

// Charger les flashcards uniquement depuis le serveur
async function loadFlashcardsFromServer() {
  try {
    const token = await authAPI.getToken();
    if (!token) {
      console.log('Utilisateur non connecté, pas de flashcards');
      flashcards = [];
      updateFlashcards();
      updateStats();
      return;
    }

    console.log('🔄 Chargement des flashcards depuis le serveur...');
    const response = await flashcardsAPI.getAll();
    
    if (response && response.flashcards && Array.isArray(response.flashcards)) {
      console.log(`☁️ ${response.flashcards.length} flashcards du serveur`);
      
      // Convertir les flashcards du serveur au format attendu par l'UI
      flashcards = response.flashcards.map(card => ({
        id: card.id,
        front: card.front,
        back: card.back,
        text: card.front, // Pour compatibilité
        translation: card.back, // Pour compatibilité
        sourceLanguage: card.sourceLanguage || 'unknown',
        targetLanguage: card.language || 'fr',
        language: card.language || 'fr',
        category: card.category || 'General',
        difficulty: card.difficulty || 0,
        created: card.createdAt,
        lastModified: card.updatedAt,
        reviewCount: card.reviewCount || 0,
        lastReviewed: card.lastReviewed,
        nextReview: card.nextReview,
        successRate: card.successRate || 0,
        synced: true,
        syncedWithServer: true
      }));
      
      console.log(`✅ ${flashcards.length} flashcards chargées`);
    } else {
      console.log('ℹ️ Aucune flashcard sur le serveur');
      flashcards = [];
    }
    
    updateFlashcards();
    updateStats();
    
  } catch (error) {
    console.error('❌ Erreur lors du chargement des flashcards:', error);
    showNotification('Erreur de chargement des flashcards', 'error');
    flashcards = [];
    updateFlashcards();
    updateStats();
  }
}

// Créer une flashcard directement sur le serveur
async function createFlashcardOnServer(original, translated, targetLanguage, sourceLanguage) {
  try {
    const token = await authAPI.getToken();
    if (!token) {
      showNotification('Connectez-vous pour créer des flashcards', 'warning');
      return false;
    }
    
    // Vérifier que nous avons une langue source valide
    if (!sourceLanguage || sourceLanguage === 'auto') {
      console.log('⚠️ Pas de langue source détectée');
      showNotification('Langue source non détectée', 'warning');
      return false;
    }
    
    console.log('💾 Création flashcard:', { original, translated, sourceLanguage, targetLanguage });
    
    const response = await flashcardsAPI.create({
      originalText: original,
      translatedText: translated,
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      language: targetLanguage,
      folder: 'default',
      difficulty: 'normal'
    });
    
    if (response && response.id) {
      console.log('✅ Flashcard créée sur le serveur');
      
      // Recharger les flashcards depuis le serveur
      await loadFlashcardsFromServer();
      
      showNotification('Flashcard créée!', 'success');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Erreur création flashcard:', error);
    if (error.message.includes('existe déjà')) {
      showNotification('Cette flashcard existe déjà', 'warning');
    } else {
      showNotification('Erreur lors de la création', 'error');
    }
    return false;
  }
}

// Supprimer une flashcard du serveur
async function deleteFlashcardFromServer(id) {
  try {
    const token = await authAPI.getToken();
    if (!token) {
      showNotification('Connectez-vous pour supprimer des flashcards', 'warning');
      return false;
    }
    
    await flashcardsAPI.delete(id);
    console.log('✅ Flashcard supprimée du serveur');
    
    // Recharger les flashcards depuis le serveur
    await loadFlashcardsFromServer();
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur suppression flashcard:', error);
    showNotification('Erreur lors de la suppression', 'error');
    return false;
  }
}

// Effacer toutes les flashcards (sur le serveur)
async function clearAllFlashcardsFromServer() {
  try {
    const token = await authAPI.getToken();
    if (!token) {
      showNotification('Connectez-vous pour effacer les flashcards', 'warning');
      return;
    }
    
    if (!confirm('Effacer toutes les flashcards ?')) return;
    
    showNotification('Suppression en cours...', 'info');
    
    // Supprimer toutes les flashcards une par une
    const deletePromises = flashcards
      .filter(card => card.id)
      .map(card => flashcardsAPI.delete(card.id).catch(err => {
        console.error(`Erreur suppression ${card.id}:`, err);
      }));
    
    await Promise.all(deletePromises);
    console.log('✅ Toutes les flashcards supprimées du serveur');
    
    // Recharger (devrait être vide)
    await loadFlashcardsFromServer();
    
    showNotification('Toutes les flashcards ont été supprimées', 'success');
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    showNotification('Erreur lors de la suppression', 'error');
  }
}

// Modifier loadData pour ne plus charger les flashcards depuis le stockage local
async function loadDataServerOnly() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({
      targetLanguage: 'fr',
      isEnabled: true,
      buttonColor: '#3b82f6',
      enableShortcut: true,
      autoDetectSameLanguage: true,
      showConfidence: true,
      animationsEnabled: true,
      hoverTranslation: false,
      immersionMode: false,
      autoSaveToFlashcards: false
    }, async (settings) => {
      userSettings = settings;
      
      // Charger l'historique des traductions (reste local)
      chrome.storage.local.get({ translations: [] }, (data) => {
        translations = data.translations || [];
        updateHistory();
        updateStats();
      });
      
      // Charger les flashcards depuis le serveur si connecté
      await loadFlashcardsFromServer();
      
      resolve();
    });
  });
}

// Export des fonctions pour remplacer celles existantes
window.serverOnlyFunctions = {
  loadFlashcardsFromServer,
  createFlashcardOnServer,
  deleteFlashcardFromServer,
  clearAllFlashcardsFromServer,
  loadDataServerOnly
};