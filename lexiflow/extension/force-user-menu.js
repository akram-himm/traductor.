// Force l'affichage du menu utilisateur
console.log('🚀 Activation forcée du menu utilisateur...');

// Fonction simple pour créer le menu
function createUserMenuDirect(user) {
  // Supprimer tout menu existant
  const existingMenu = document.querySelector('.user-menu');
  if (existingMenu) existingMenu.remove();
  
  const menu = document.createElement('div');
  menu.className = 'user-menu';
  menu.style.cssText = `
    position: fixed;
    top: 60px;
    right: 10px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    z-index: 10000;
    min-width: 200px;
  `;
  
  const isPremium = user.subscriptionStatus === 'premium';
  menu.innerHTML = `
    <div style="padding: 8px; border-bottom: 1px solid #e5e7eb; margin-bottom: 8px;">
      <div style="font-weight: 600; color: #1f2937;">${user.name || user.email}</div>
      <div style="font-size: 12px; color: ${isPremium ? '#f5576c' : '#6b7280'}; margin-top: 4px;">
        ${isPremium ? '⭐ Compte Premium' : '📦 Compte Gratuit'}
      </div>
    </div>
    <div style="padding: 8px; font-size: 13px; color: #4b5563;">
      <div>Flashcards: ${user.flashcardsCount || 0}/${isPremium ? 200 : 50}</div>
    </div>
    <button class="switch-account-btn" style="
      width: 100%;
      padding: 8px;
      margin-top: 8px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    ">
      🔄 Changer de compte
    </button>
    <button class="logout-btn" style="
      width: 100%;
      padding: 8px;
      margin-top: 8px;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    ">
      🚪 Se déconnecter
    </button>
  `;
  
  document.body.appendChild(menu);
  
  // Bouton changer de compte
  menu.querySelector('.switch-account-btn').addEventListener('click', async () => {
    console.log('Changement de compte...');
    
    // Se déconnecter
    if (typeof authAPI !== 'undefined' && authAPI.logout) {
      await authAPI.logout();
    }
    
    // Nettoyer
    chrome.storage.local.clear();
    localStorage.clear();
    
    // Recharger
    setTimeout(() => {
      location.reload();
    }, 500);
  });
  
  // Bouton déconnexion
  menu.querySelector('.logout-btn').addEventListener('click', async () => {
    console.log('Déconnexion...');
    
    if (typeof authAPI !== 'undefined' && authAPI.logout) {
      await authAPI.logout();
    }
    
    menu.remove();
    location.reload();
  });
  
  // Fermer en cliquant ailleurs
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target) && !e.target.closest('#loginButton')) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 100);
}

// Attendre et activer
setTimeout(() => {
  const loginButton = document.getElementById('loginButton');
  if (!loginButton) {
    console.error('Bouton non trouvé');
    return;
  }
  
  // Récupérer les données utilisateur
  chrome.storage.local.get(['user', 'authToken'], (result) => {
    if (!result.user || !result.authToken) {
      console.log('Utilisateur non connecté');
      return;
    }
    
    console.log('✅ Configuration du bouton pour:', result.user.email);
    
    // Remplacer complètement le onclick
    loginButton.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Clic - affichage du menu');
      createUserMenuDirect(result.user);
    };
    
    // Ajouter aussi un event listener au cas où
    loginButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Event listener - affichage du menu');
      createUserMenuDirect(result.user);
    }, true);
  });
}, 2000);