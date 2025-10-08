// Version améliorée du système de réveil avec timeout et retry
async function wakeUpServerWithRetry(showLoading = true, maxRetries = 3) {
  const baseUrl = window.location.origin;
  const TIMEOUT_MS = 15000; // 15 secondes par tentative
  const RETRY_DELAY = 2000; // 2 secondes entre les tentatives

  // Afficher un message de chargement détaillé
  let loader = null;
  if (showLoading) {
    loader = document.createElement('div');
    loader.id = 'wake-loader';
    loader.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      color: #374151;
      padding: 30px;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      text-align: center;
      min-width: 350px;
    `;
    updateLoaderMessage(loader, 'connecting', 1, maxRetries);
    document.body.appendChild(loader);
  }

  // Fonction pour mettre à jour le message
  function updateLoaderMessage(loader, status, attempt = 1, maxAttempts = maxRetries) {
    if (!loader) return;

    const messages = {
      connecting: {
        color: '#3b82f6',
        icon: '🔄',
        title: 'Réveil du serveur...',
        subtitle: `Le serveur gratuit se réveille (tentative ${attempt}/${maxAttempts})`,
        info: 'Cela peut prendre 30-60 secondes la première fois'
      },
      retrying: {
        color: '#f59e0b',
        icon: '🔁',
        title: 'Nouvelle tentative...',
        subtitle: `Tentative ${attempt}/${maxAttempts}`,
        info: 'Le serveur met plus de temps que prévu'
      },
      success: {
        color: '#10b981',
        icon: '✅',
        title: 'Serveur prêt !',
        subtitle: 'Connexion établie',
        info: null
      },
      error: {
        color: '#ef4444',
        icon: '❌',
        title: 'Serveur indisponible',
        subtitle: 'Impossible de se connecter',
        info: 'Veuillez réessayer dans quelques minutes'
      }
    };

    const msg = messages[status];
    loader.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 20px;">${msg.icon}</div>
      <h3 style="margin: 0 0 10px 0; color: ${msg.color}; font-size: 24px;">${msg.title}</h3>
      <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 16px;">${msg.subtitle}</p>
      ${msg.info ? `<p style="margin: 0; color: #9ca3af; font-size: 14px;">${msg.info}</p>` : ''}
      ${status === 'connecting' || status === 'retrying' ? `
        <div style="margin-top: 20px;">
          <div style="width: 40px; height: 40px; border: 3px solid ${msg.color}; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
        </div>
        <style>
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      ` : ''}
    `;
  }

  // Fonction pour faire une tentative avec timeout
  async function attemptWakeUp(attempt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      console.log(`🌅 Tentative ${attempt}/${maxRetries} de réveil du serveur...`);

      const response = await fetch(`${baseUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('✅ Serveur réveillé avec succès');
        if (loader) {
          updateLoaderMessage(loader, 'success');
          setTimeout(() => loader.remove(), 2000);
        }
        return true;
      }

      throw new Error(`Réponse non-OK: ${response.status}`);

    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        console.log(`⏱️ Timeout après ${TIMEOUT_MS}ms (tentative ${attempt}/${maxRetries})`);
      } else {
        console.error(`❌ Erreur tentative ${attempt}:`, error.message);
      }

      return false;
    }
  }

  // Boucle de tentatives
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    if (attempt > 1) {
      if (loader) {
        updateLoaderMessage(loader, 'retrying', attempt, maxRetries);
      }
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }

    const success = await attemptWakeUp(attempt);
    if (success) {
      return true;
    }
  }

  // Toutes les tentatives ont échoué
  console.error('❌ Impossible de réveiller le serveur après', maxRetries, 'tentatives');
  if (loader) {
    updateLoaderMessage(loader, 'error');
    setTimeout(() => loader.remove(), 5000);
  }

  return false;
}

// Fonction simplifiée qui remplace l'ancienne
window.wakeUpServer = wakeUpServerWithRetry;

// Réveil automatique au chargement (silencieux)
window.addEventListener('DOMContentLoaded', () => {
  if (!window.location.hostname.includes('localhost')) {
    console.log('🔍 Environnement Render détecté');
    // Réveil silencieux en arrière-plan
    wakeUpServerWithRetry(false, 1).then(success => {
      if (success) {
        console.log('✅ Serveur pré-réveillé en arrière-plan');
      }
    });
  }
});

// Fonction spéciale pour les formulaires d'email
window.handleEmailFormWithWakeUp = async function(email, formUrl = '/api/auth/forgot-password') {
  const baseUrl = window.location.origin;

  // Étape 1: Réveiller le serveur avec interface visuelle
  const serverAwake = await wakeUpServerWithRetry(true);

  if (!serverAwake) {
    return {
      success: false,
      error: 'Le serveur est temporairement indisponible. Veuillez réessayer dans quelques minutes.'
    };
  }

  // Étape 2: Envoyer la requête
  try {
    const response = await fetch(`${baseUrl}${formUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    return {
      success: response.ok,
      data,
      error: response.ok ? null : data.error || 'Une erreur est survenue'
    };

  } catch (error) {
    console.error('❌ Erreur envoi formulaire:', error);
    return {
      success: false,
      error: 'Erreur de connexion au serveur'
    };
  }
};