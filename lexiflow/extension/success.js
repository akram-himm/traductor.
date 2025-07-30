// Gestion de la page de succès après paiement
document.addEventListener('DOMContentLoaded', async () => {
  const openButton = document.getElementById('openExtension');
  const loadingDiv = document.getElementById('loading');
  const errorDiv = document.getElementById('error');
  
  // Récupérer le session_id depuis l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  
  if (!sessionId) {
    showError('Invalid payment session. Please contact support.');
    return;
  }
  
  // Afficher le chargement
  loadingDiv.style.display = 'block';
  
  // Attendre un peu pour que les webhooks se traitent
  setTimeout(async () => {
    try {
      // Vérifier si l'utilisateur est connecté
      const token = await new Promise(resolve => {
        chrome.storage.local.get(['authToken'], result => {
          resolve(result.authToken);
        });
      });
      
      if (!token) {
        showError('Please log in to LexiFlow to complete your upgrade.');
        return;
      }
      
      // Forcer la mise à jour du profil utilisateur
      chrome.runtime.sendMessage({ 
        action: 'updateUserProfile' 
      }, response => {
        if (response && response.success) {
          loadingDiv.style.display = 'none';
          
          // Afficher un message de succès supplémentaire
          const successMessage = document.createElement('p');
          successMessage.style.color = '#10b981';
          successMessage.style.fontWeight = '600';
          successMessage.textContent = 'Your Premium features are now active!';
          loadingDiv.parentNode.insertBefore(successMessage, loadingDiv);
        }
      });
      
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('There was an issue updating your account. Please refresh LexiFlow.');
    }
  }, 3000); // Attendre 3 secondes pour les webhooks
  
  // Bouton pour ouvrir l'extension
  openButton.addEventListener('click', () => {
    // Essayer d'ouvrir la popup de l'extension
    chrome.action.openPopup().catch(() => {
      // Si ça ne marche pas, fermer cette fenêtre
      // L'utilisateur devra cliquer sur l'icône de l'extension
      alert('Please click on the LexiFlow extension icon in your browser toolbar.');
      window.close();
    });
  });
  
  function showError(message) {
    loadingDiv.style.display = 'none';
    errorDiv.style.display = 'block';
    errorDiv.textContent = message;
  }
});