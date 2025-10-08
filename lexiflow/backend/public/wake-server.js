// Fonction pour réveiller le serveur Render avant d'envoyer une requête
async function wakeUpServer(showLoading = true) {
  const baseUrl = window.location.origin;

  // Afficher un message de chargement si demandé
  if (showLoading) {
    const loader = document.createElement('div');
    loader.id = 'wake-loader';
    loader.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #3b82f6;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      font-family: Arial, sans-serif;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    loader.innerHTML = `
      <div style="width: 20px; height: 20px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <span>Réveil du serveur...</span>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(loader);
  }

  try {
    console.log('🌅 Réveil du serveur...');

    // Faire un appel health check pour réveiller le serveur
    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log('✅ Serveur réveillé avec succès');

      // Mettre à jour le message
      const loader = document.getElementById('wake-loader');
      if (loader) {
        loader.style.background = '#10b981';
        loader.innerHTML = `
          <span style="font-size: 20px;">✓</span>
          <span>Serveur prêt!</span>
        `;

        // Supprimer le message après 2 secondes
        setTimeout(() => {
          loader.remove();
        }, 2000);
      }

      return true;
    } else {
      throw new Error('Erreur de réveil du serveur');
    }
  } catch (error) {
    console.error('❌ Erreur lors du réveil:', error);

    // Afficher une erreur
    const loader = document.getElementById('wake-loader');
    if (loader) {
      loader.style.background = '#ef4444';
      loader.innerHTML = `
        <span style="font-size: 20px;">✕</span>
        <span>Serveur indisponible</span>
      `;

      setTimeout(() => {
        loader.remove();
      }, 3000);
    }

    return false;
  }
}

// Réveiller le serveur automatiquement au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
  // Si on est sur Render (pas localhost)
  if (!window.location.hostname.includes('localhost')) {
    console.log('🔍 Détection environnement Render, réveil automatique...');
    wakeUpServer(false); // Sans affichage pour le réveil initial
  }
});

// Export pour utilisation dans d'autres scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { wakeUpServer };
}