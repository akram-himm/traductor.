// Fix temporaire pour restaurer la fonctionnalité du popup

// Vérifier si les fonctions critiques existent et les créer si nécessaire
if (typeof updateUIAfterLogin === 'undefined') {
  window.updateUIAfterLogin = async function(user) {
    console.log('updateUIAfterLogin appelé avec:', user);
    
    // Mettre à jour le bouton de connexion
    const loginButton = document.getElementById('loginButton');
    if (loginButton && user) {
      loginButton.innerHTML = `<span>✅</span><span>${user.name || user.email}</span>`;
      loginButton.style.background = 'rgba(16, 185, 129, 0.3)';
    }
    
    // Rafraîchir l'interface
    if (typeof updateStats === 'function') updateStats();
    if (typeof updateHistory === 'function') updateHistory();
    if (typeof updateFlashcards === 'function') updateFlashcards();
  };
}

if (typeof resetUIAfterLogout === 'undefined') {
  window.resetUIAfterLogout = function() {
    console.log('resetUIAfterLogout appelé');
    
    // Réinitialiser le bouton
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
      loginButton.innerHTML = `<span>👤</span><span>Se connecter</span>`;
      loginButton.style.background = 'rgba(255,255,255,0.15)';
    }
    
    // Effacer les données
    localStorage.clear();
    translations = [];
    flashcards = [];
    
    // Rafraîchir l'interface
    if (typeof updateStats === 'function') updateStats();
    if (typeof updateHistory === 'function') updateHistory();
    if (typeof updateFlashcards === 'function') updateFlashcards();
  };
}

// Vérifier si flashcardSync existe
if (typeof flashcardSync === 'undefined') {
  window.flashcardSync = {
    load: async function() {
      try {
        const response = await flashcardsAPI.getAll();
        return { success: true, data: response.flashcards || [] };
      } catch (error) {
        console.error('Erreur lors du chargement des flashcards:', error);
        return { success: false, data: [] };
      }
    },
    save: async function(flashcard) {
      try {
        const response = await flashcardsAPI.create(flashcard);
        return { success: true, data: response };
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        return { success: false, error: error.message };
      }
    }
  };
}

console.log('✅ Popup fix chargé');