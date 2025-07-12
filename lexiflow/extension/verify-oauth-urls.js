// Script pour vérifier les URLs OAuth

console.log('=== Vérification des URLs OAuth ===');

// Configuration API
const API_CONFIG = {
  BASE_URL: 'https://my-backend-api-cng7.onrender.com'
};

// Construire l'URL OAuth
const provider = 'google';
const timestamp = Date.now();
const authUrl = `${API_CONFIG.BASE_URL}/api/auth/${provider}?prompt=select_account&max_age=0&t=${timestamp}`;

console.log('URL OAuth construite:', authUrl);

// Tester l'URL
fetch(authUrl, { 
  method: 'HEAD',
  mode: 'no-cors' 
})
.then(() => {
  console.log('✅ L\'URL semble accessible');
})
.catch(error => {
  console.error('❌ Erreur d\'accès à l\'URL:', error);
});

// Vérifier les permissions de l'extension
if (chrome && chrome.tabs) {
  console.log('✅ chrome.tabs API disponible');
} else {
  console.error('❌ chrome.tabs API non disponible');
}

// Vérifier le manifest
fetch(chrome.runtime.getURL('manifest.json'))
  .then(response => response.json())
  .then(manifest => {
    console.log('Permissions du manifest:', manifest.permissions);
    console.log('Host permissions:', manifest.host_permissions);
  })
  .catch(error => {
    console.error('Erreur lecture manifest:', error);
  });