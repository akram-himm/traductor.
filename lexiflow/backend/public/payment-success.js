// Configuration
const API_BASE_URL = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('session_id');
const isUpgrade = urlParams.get('upgrade') === 'true';

// Mettre à jour l'UI pour upgrade
if (isUpgrade) {
  document.querySelector('h1').textContent = 'Upgrade Successful!';
  document.querySelector('p').textContent = 'Your plan has been upgraded to yearly! You will save €9.98 per year.';
  document.querySelector('.steps h3').textContent = 'What happens next:';
  const steps = document.querySelector('.steps ol');
  steps.innerHTML = `
    <li>Your monthly subscription has been canceled</li>
    <li>Your new yearly plan is now active</li>
    <li>You'll be billed annually from now on</li>
    <li>All your Premium features remain active</li>
  `;
}

// Fonction pour vérifier le statut du paiement
async function verifyPaymentStatus() {
  if (!sessionId) return;
  
  try {
    console.log('🔍 Vérification du paiement...');
    
    // Appeler l'API pour confirmer le paiement
    const response = await fetch(`${API_BASE_URL}/api/subscription/verify-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessionId })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Paiement confirmé:', data);
      
      // Mettre à jour le message
      const note = document.querySelector('.note');
      note.innerHTML = '<strong style="color: #10b981;">✓ Your Premium status is now active!</strong><br>You can close this window and enjoy your Premium features.';
      
      // Notifier l'extension via chrome.runtime si disponible
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ 
          type: 'PAYMENT_SUCCESS', 
          sessionId: sessionId,
          plan: data.plan || 'premium'
        });
      }
    }
  } catch (error) {
    console.error('Erreur vérification:', error);
  }
}

// Vérifier immédiatement
verifyPaymentStatus();

// Revérifier après 2 secondes si pas encore confirmé
setTimeout(verifyPaymentStatus, 2000);

// Suggestion de fermer après 5 secondes
setTimeout(() => {
  const note = document.querySelector('.note');
  if (!note.innerHTML.includes('active!')) {
    note.innerHTML = 'Processing complete. You can close this window.<br>Your Premium features will be active in the extension.';
  }
}, 5000);