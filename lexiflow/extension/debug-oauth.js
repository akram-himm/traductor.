// Script de débogage OAuth
console.log('=== OAuth Debug Script ===');

// Vérifier l'API config
if (typeof API_CONFIG !== 'undefined') {
  console.log('API_CONFIG.BASE_URL:', API_CONFIG.BASE_URL);
} else {
  console.error('API_CONFIG non défini!');
}

// Intercepter les clics sur le bouton Google
document.addEventListener('click', (e) => {
  if (e.target.closest('.js-oauth-google')) {
    console.log('Clic sur bouton Google détecté');
    
    // Vérifier si handleOAuthLogin existe
    if (typeof handleOAuthLogin === 'function') {
      console.log('handleOAuthLogin existe');
    } else {
      console.error('handleOAuthLogin n\'existe pas!');
    }
    
    // Vérifier si proceedWithOAuth existe
    if (typeof proceedWithOAuth === 'function') {
      console.log('proceedWithOAuth existe');
    } else {
      console.error('proceedWithOAuth n\'existe pas!');
    }
  }
});

// Surveiller les changements dans chrome.storage
if (chrome && chrome.storage) {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
      console.log(`Storage key "${key}" in namespace "${namespace}" changed.`);
      console.log('Old value:', oldValue);
      console.log('New value:', newValue);
    }
  });
}

// Vérifier window.open
const originalOpen = window.open;
window.open = function(...args) {
  console.log('window.open appelé avec:', args);
  const result = originalOpen.apply(this, args);
  if (!result) {
    console.error('window.open a retourné null - popup bloqué?');
  }
  return result;
};

console.log('Debug script chargé. Ouvrez la console et essayez de vous connecter.');