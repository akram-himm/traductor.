// Fonctions pour synchroniser les flashcards avec le backend

// Fonction principale pour sauvegarder une flashcard
async function saveFlashcardToBackend(flashcardData) {
  try {
    // Vérifier si l'utilisateur est connecté
    const token = await authAPI.getToken();
    if (!token) {
      console.log('Utilisateur non connecté, sauvegarde locale uniquement');
      return { success: false, reason: 'not_authenticated' };
    }

    // Préparer les données de la flashcard
    const flashcardPayload = {
      originalText: flashcardData.originalText || flashcardData.text,
      translatedText: flashcardData.translatedText || flashcardData.translation,
      sourceLanguage: flashcardData.sourceLanguage || null,
      targetLanguage: flashcardData.targetLanguage || 'fr',
      context: flashcardData.context || '',
      difficulty: flashcardData.difficulty || 'medium',
      tags: flashcardData.tags || [],
      folder: flashcardData.folder || 'default'
    };

    // Envoyer au backend
    const response = await flashcardsAPI.create(flashcardPayload);
    
    console.log('✅ Flashcard sauvegardée sur le serveur:', response);
    return { success: true, data: response };
    
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error);
    
    // Gérer les différents types d'erreurs
    if (error.message.includes('401') || error.message.includes('Authentication')) {
      // Token invalide, effacer et demander reconnexion
      return { success: false, reason: 'auth_expired', error: error.message };
    } else if (error.message.includes('Network')) {
      // Problème réseau
      return { success: false, reason: 'network_error', error: error.message };
    } else {
      // Autre erreur
      return { success: false, reason: 'unknown_error', error: error.message };
    }
  }
}

// Fonction pour synchroniser toutes les flashcards locales
async function syncLocalFlashcardsToBackend() {
  try {
    // Vérifier l'authentification
    const token = await authAPI.getToken();
    if (!token) {
      console.log('Sync impossible: utilisateur non connecté');
      return { success: false, reason: 'not_authenticated' };
    }

    // Récupérer les flashcards locales
    const localFlashcards = JSON.parse(localStorage.getItem('flashcards') || '[]');
    
    if (localFlashcards.length === 0) {
      console.log('Aucune flashcard locale à synchroniser');
      return { success: true, synced: 0 };
    }

    console.log(`🔄 Synchronisation de ${localFlashcards.length} flashcards...`);
    
    let syncedCount = 0;
    let errors = [];

    // Synchroniser chaque flashcard
    for (const flashcard of localFlashcards) {
      try {
        await flashcardsAPI.create({
          originalText: flashcard.text || flashcard.originalText,
          translatedText: flashcard.translation || flashcard.translatedText,
          sourceLanguage: flashcard.sourceLanguage || null,
          targetLanguage: flashcard.targetLanguage || 'fr',
          context: flashcard.context || '',
          difficulty: flashcard.difficulty || 'medium',
          tags: flashcard.tags || [],
          folder: flashcard.folder || 'default'
        });
        syncedCount++;
      } catch (error) {
        // Ignorer les erreurs de duplication (409)
        if (!error.message.includes('409') && !error.message.includes('existe déjà')) {
          errors.push({ flashcard, error: error.message });
        }
      }
    }

    console.log(`✅ Synchronisation terminée: ${syncedCount}/${localFlashcards.length} réussies`);
    
    if (errors.length > 0) {
      console.error('❌ Erreurs de synchronisation:', errors);
    }

    // Ne PAS supprimer les flashcards locales après sync
    // Les garder comme backup local au cas où
    console.log('📚 Flashcards locales conservées comme backup');

    return { 
      success: true, 
      synced: syncedCount, 
      total: localFlashcards.length,
      errors: errors 
    };
    
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error);
    return { success: false, reason: 'sync_error', error: error.message };
  }
}

// Fonction pour récupérer toutes les flashcards du backend
async function loadFlashcardsFromBackend() {
  try {
    const token = await authAPI.getToken();
    if (!token) {
      console.log('Chargement impossible: utilisateur non connecté');
      return { success: false, reason: 'not_authenticated' };
    }

    const flashcards = await flashcardsAPI.getAll();
    console.log(`✅ ${flashcards.length} flashcards chargées depuis le serveur`);
    
    return { success: true, data: flashcards };
    
  } catch (error) {
    console.error('❌ Erreur lors du chargement:', error);
    return { success: false, reason: 'load_error', error: error.message };
  }
}

// Fonction pour mettre à jour une flashcard
async function updateFlashcardOnBackend(id, updates) {
  try {
    const token = await authAPI.getToken();
    if (!token) {
      return { success: false, reason: 'not_authenticated' };
    }

    const response = await flashcardsAPI.update(id, updates);
    console.log('✅ Flashcard mise à jour:', response);
    
    return { success: true, data: response };
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
    return { success: false, error: error.message };
  }
}

// Fonction pour supprimer une flashcard
async function deleteFlashcardFromBackend(id) {
  try {
    const token = await authAPI.getToken();
    if (!token) {
      return { success: false, reason: 'not_authenticated' };
    }

    await flashcardsAPI.delete(id);
    console.log('✅ Flashcard supprimée');
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    return { success: false, error: error.message };
  }
}

// Écouter les événements d'authentification
window.addEventListener('auth-required', () => {
  console.log('🔐 Authentification requise');
  // Afficher l'interface de connexion
  if (typeof showAuthSection === 'function') {
    showAuthSection();
  }
});

// Auto-sync au démarrage si connecté
document.addEventListener('DOMContentLoaded', async () => {
  const token = await authAPI.getToken();
  if (token) {
    console.log('🔄 Vérification de la connexion...');
    const isValid = await authAPI.verifyToken();
    
    if (isValid) {
      console.log('✅ Utilisateur connecté, chargement des flashcards...');
      await loadFlashcardsFromBackend();
      
      // Synchroniser automatiquement en arrière-plan sans embêter l'utilisateur
      const localFlashcards = JSON.parse(localStorage.getItem('flashcards') || '[]');
      if (localFlashcards.length > 0) {
        console.log(`📤 ${localFlashcards.length} flashcards locales trouvées, sync en arrière-plan...`);
        // Sync silencieuse en arrière-plan
        syncLocalFlashcardsToBackend().catch(err => {
          console.log('Sync auto échouée, ce n\'est pas grave:', err);
        });
      }
    } else {
      console.log('❌ Token invalide, reconnexion nécessaire');
      chrome.storage.local.remove(['authToken', 'user']);
    }
  }
});

// Export des fonctions
window.flashcardSync = {
  save: saveFlashcardToBackend,
  syncAll: syncLocalFlashcardsToBackend,
  load: loadFlashcardsFromBackend,
  update: updateFlashcardOnBackend,
  delete: deleteFlashcardFromBackend
};