// Corrections pour popup.js

// 1. Remplacer la fonction handleOAuthLogin par cette version corrigée
function handleOAuthLogin(provider) {
  // Récupérer le modal de connexion actuel
  const loginModal = document.querySelector('.login-modal');
  
  // Désactiver le bouton Google et afficher un feedback
  const googleButton = loginModal?.querySelector('.js-oauth-google');
  if (googleButton) {
    googleButton.disabled = true;
    googleButton.innerHTML = `
      <div class="spinner" style="width: 16px; height: 16px; border: 2px solid #e5e7eb; border-top: 2px solid #4285F4; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <span>Connexion...</span>
    `;
  }
  
  const authUrl = `${API_CONFIG.BASE_URL}/api/auth/${provider}`;
  
  // Fonction pour gérer la connexion réussie
  const handleSuccessfulAuth = async (token) => {
    if (!token) {
      showNotification('Erreur: Token manquant', 'error');
      return;
    }
    
    // Fermer le modal immédiatement
    if (loginModal) {
      loginModal.remove();
    }
    
    // Sauvegarder le token
    chrome.storage.local.set({ authToken: token }, async () => {
      try {
        const response = await apiRequest('/api/user/profile');
        if (response && response.user) {
          updateUIAfterLogin(response.user);
          syncFlashcardsAfterLogin();
          showNotification('Connexion réussie!', 'success');
        }
      } catch (error) {
        console.error('Erreur profil:', error);
        showNotification('Erreur lors de la récupération du profil', 'error');
        // Réinitialiser l'UI
        await authAPI.logout();
        resetUIAfterLogout();
      }
    });
  };
  
  // Fonction pour gérer les erreurs
  const handleAuthError = (error) => {
    console.error('Erreur OAuth:', error);
    showNotification(`Erreur de connexion: ${error}`, 'error');
    
    // Réactiver le bouton
    if (googleButton) {
      googleButton.disabled = false;
      googleButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Google
      `;
    }
  };
  
  // Utiliser chrome.identity si disponible
  if (chrome.identity && chrome.identity.launchWebAuthFlow) {
    chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true
    }, (redirectUrl) => {
      if (chrome.runtime.lastError) {
        handleAuthError(chrome.runtime.lastError.message);
        return;
      }
      
      try {
        const url = new URL(redirectUrl);
        const token = url.searchParams.get('token');
        if (token) {
          handleSuccessfulAuth(token);
        } else {
          handleAuthError('Token non trouvé dans la réponse');
        }
      } catch (error) {
        handleAuthError('URL de redirection invalide');
      }
    });
  } else {
    // Fallback: ouvrir dans une nouvelle fenêtre
    const authWindow = window.open(
      authUrl,
      'oauth-popup',
      'width=500,height=600,menubar=no,toolbar=no'
    );
    
    // Event listener temporaire
    const messageListener = async (event) => {
      if (event.origin !== API_CONFIG.BASE_URL) return;
      
      if (event.data.type === 'oauth-success' && event.data.token) {
        // Nettoyer l'event listener
        window.removeEventListener('message', messageListener);
        
        if (authWindow && !authWindow.closed) {
          authWindow.close();
        }
        
        handleSuccessfulAuth(event.data.token);
      } else if (event.data.type === 'oauth-error') {
        window.removeEventListener('message', messageListener);
        handleAuthError(event.data.error || 'Erreur inconnue');
      }
    };
    
    window.addEventListener('message', messageListener);
    
    // Vérifier si la fenêtre a été fermée
    const checkInterval = setInterval(() => {
      if (authWindow && authWindow.closed) {
        clearInterval(checkInterval);
        window.removeEventListener('message', messageListener);
        
        // Si la fenêtre est fermée sans succès, réactiver le bouton
        if (googleButton && googleButton.disabled) {
          handleAuthError('Connexion annulée');
        }
      }
    }, 1000);
  }
}

// 2. Ajouter cette fonction après updateUIAfterLogin
function closeAllModals() {
  // Fermer tous les modals de connexion/inscription
  document.querySelectorAll('.login-modal, .register-modal').forEach(modal => {
    modal.remove();
  });
}

// 3. Modifier showLoginWindow pour s'assurer que le modal se ferme après connexion email
// Remplacer la partie après "showNotification('Connexion réussie!', 'success');" par :
/*
loginModal.remove();
showNotification('Connexion réussie!', 'success');

// Mettre à jour l'interface utilisateur
updateUIAfterLogin(response.user);

// Synchroniser les flashcards après connexion
syncFlashcardsAfterLogin();
*/

// 4. Ajouter du CSS pour l'animation du spinner
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);