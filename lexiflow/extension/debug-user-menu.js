// Debug du menu utilisateur
console.log('=== Debug Menu Utilisateur ===');

// Vérifier le bouton de connexion après un délai
setTimeout(() => {
  const loginButton = document.getElementById('loginButton');
  if (loginButton) {
    console.log('Bouton trouvé:', loginButton);
    console.log('Texte du bouton:', loginButton.textContent);
    console.log('onclick actuel:', loginButton.onclick);
    
    // Vérifier si showUserMenu existe
    if (typeof showUserMenu === 'function') {
      console.log('✅ showUserMenu existe');
    } else {
      console.error('❌ showUserMenu n\'existe pas!');
    }
    
    // Vérifier si l'utilisateur est stocké
    chrome.storage.local.get(['user', 'authToken'], (result) => {
      console.log('Données stockées:', result);
      
      if (result.user) {
        console.log('Utilisateur actuel:', result.user);
        
        // Forcer l'ajout du menu au clic
        loginButton.addEventListener('click', (e) => {
          e.stopPropagation();
          console.log('Clic sur le bouton - tentative d\'affichage du menu');
          
          if (result.user && typeof showUserMenu === 'function') {
            showUserMenu(result.user);
          } else {
            console.error('Impossible d\'afficher le menu');
          }
        });
      }
    });
  } else {
    console.error('Bouton de connexion non trouvé!');
  }
}, 1000);

// Surveiller les clics
document.addEventListener('click', (e) => {
  if (e.target.id === 'loginButton' || e.target.closest('#loginButton')) {
    console.log('Clic détecté sur loginButton');
  }
});