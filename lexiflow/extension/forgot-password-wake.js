// Script pour réveiller le serveur quand on clique sur "Mot de passe oublié"
// À intégrer dans votre extension ou site web

async function handleForgotPassword(email) {
  const BACKEND_URL = 'https://my-backend-api-cng7.onrender.com';

  // Étape 1: Réveiller le serveur
  console.log('🌅 Réveil du serveur Render...');

  try {
    // Afficher un message de chargement
    const showLoading = () => {
      const message = document.createElement('div');
      message.id = 'server-wake-message';
      message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px 30px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        text-align: center;
      `;
      message.innerHTML = `
        <div style="margin-bottom: 15px;">
          <div style="width: 40px; height: 40px; border: 3px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
        </div>
        <h3 style="margin: 0 0 10px 0; font-size: 18px;">Réveil du serveur...</h3>
        <p style="margin: 0; font-size: 14px; opacity: 0.9;">Cela peut prendre quelques secondes</p>
        <style>
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      `;
      document.body.appendChild(message);
      return message;
    };

    const loadingMessage = showLoading();

    // Faire un premier appel pour réveiller le serveur
    const wakeResponse = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!wakeResponse.ok) {
      throw new Error('Serveur non disponible');
    }

    console.log('✅ Serveur réveillé');

    // Mettre à jour le message
    loadingMessage.style.background = 'linear-gradient(135deg, #10b981 0%, #065f46 100%)';
    loadingMessage.innerHTML = `
      <h3 style="margin: 0 0 10px 0; font-size: 20px;">✓ Serveur prêt!</h3>
      <p style="margin: 0; font-size: 14px;">Envoi de l'email de récupération...</p>
    `;

    // Étape 2: Envoyer la requête de récupération
    const resetResponse = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await resetResponse.json();

    // Succès
    loadingMessage.innerHTML = `
      <h3 style="margin: 0 0 10px 0; font-size: 20px;">✓ Email envoyé!</h3>
      <p style="margin: 0; font-size: 14px;">Vérifiez votre boîte de réception</p>
    `;

    setTimeout(() => {
      loadingMessage.remove();
    }, 3000);

    return data;

  } catch (error) {
    console.error('❌ Erreur:', error);

    // Afficher l'erreur
    const message = document.getElementById('server-wake-message');
    if (message) {
      message.style.background = 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)';
      message.innerHTML = `
        <h3 style="margin: 0 0 10px 0; font-size: 20px;">✕ Erreur</h3>
        <p style="margin: 0; font-size: 14px;">Le serveur est temporairement indisponible.<br>Veuillez réessayer dans quelques instants.</p>
      `;

      setTimeout(() => {
        message.remove();
      }, 5000);
    }

    throw error;
  }
}

// Exemple d'utilisation dans un formulaire
/*
document.getElementById('forgot-password-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;

  try {
    await handleForgotPassword(email);
    // Afficher un message de succès
  } catch (error) {
    // Gérer l'erreur
  }
});
*/

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { handleForgotPassword };
}