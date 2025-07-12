// Fix pour le menu utilisateur
console.log('🔧 Application du fix pour le menu utilisateur...');

// Attendre que tout soit chargé
setTimeout(() => {
  // Récupérer les données utilisateur
  chrome.storage.local.get(['user', 'authToken'], async (result) => {
    if (result.user && result.authToken) {
      console.log('✅ Utilisateur trouvé:', result.user);
      
      // Forcer la mise à jour de l'UI
      if (typeof updateUIAfterLogin === 'function') {
        console.log('🔄 Mise à jour de l\'UI...');
        updateUIAfterLogin(result.user);
      } else {
        console.error('❌ updateUIAfterLogin non trouvée');
      }
      
      // Vérifier que le bouton a le bon handler
      setTimeout(() => {
        const loginButton = document.getElementById('loginButton');
        if (loginButton) {
          console.log('📝 État du bouton après mise à jour:');
          console.log('- Texte:', loginButton.textContent);
          console.log('- onclick:', loginButton.onclick ? 'défini' : 'non défini');
          
          // Si pas de onclick, l'ajouter manuellement
          if (!loginButton.onclick) {
            console.log('⚠️ Ajout manuel du handler');
            loginButton.onclick = () => {
              if (typeof showUserMenu === 'function' && window.currentUser) {
                showUserMenu(window.currentUser);
              } else {
                console.error('Impossible d\'afficher le menu:', {
                  showUserMenu: typeof showUserMenu,
                  currentUser: window.currentUser
                });
              }
            };
          }
        }
      }, 500);
    } else {
      console.log('ℹ️ Utilisateur non connecté');
    }
  });
}, 2000);