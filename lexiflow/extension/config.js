// Configuration API Backend
const API_CONFIG = {
  // URL du backend - Utiliser Render ou localhost
  BASE_URL: 'https://my-backend-api-cng7.onrender.com', // Backend sur Render
  // BASE_URL: 'http://localhost:3001', // Backend local pour les tests
  
  // Configuration DeepSeek (clé gérée côté serveur pour les Premium)
  DEEPSEEK_CONFIG: {
    // La clé sera utilisée côté backend uniquement pour les utilisateurs Premium
    // Pas besoin de la stocker côté client pour des raisons de sécurité
    endpoint: '/api/translate/deepseek'
  },
  
  // Fonction pour réveiller le serveur
  wakeUpServer: async function() {
    try {
      // Utiliser un endpoint simple qui ne nécessite pas d'auth
      const response = await fetch(this.BASE_URL + '/api/user/profile', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('🚀 Serveur réveillé:', response.ok);
      return response.ok;
    } catch (error) {
      console.log('⏳ Réveil du serveur en cours...');
      return false;
    }
  },
  
  // Endpoints
  ENDPOINTS: {
    // Auth
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    VERIFY_TOKEN: '/api/auth/verify',
    
    // OAuth
    GOOGLE_AUTH: '/api/auth/google',
    
    // User
    PROFILE: '/api/user/profile',
    UPDATE_PROFILE: '/api/user/profile',
    
    // Flashcards
    FLASHCARDS: '/api/flashcards',
    FLASHCARD_BY_ID: (id) => `/api/flashcards/${id}`,
    
    // Subscription
    SUBSCRIPTION: '/api/subscription',
    CREATE_CHECKOUT: '/api/subscription/create-checkout-session',
    CANCEL_SUBSCRIPTION: '/api/subscription/cancel'
  }
};

// Fonction helper pour les requêtes API
async function apiRequest(endpoint, options = {}) {
  // Utiliser chrome.storage au lieu de localStorage
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['authToken'], async (result) => {
      const token = result.authToken;
      
      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        credentials: 'include'
      };
      
      const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers
        }
      };
      
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, finalOptions);
        
        if (!response.ok) {
          if (response.status === 401) {
            // Token expiré ou invalide - mais ne pas supprimer automatiquement
            console.log('Erreur 401 - vérification nécessaire depuis:', window.location.href);
            // Ne pas lancer d'erreur immédiatement, laisser l'appelant gérer
            const error = new Error('Authentication required');
            error.status = 401;
            throw error;
          }
          
          const errorText = await response.text();
          console.error('❌ Réponse erreur du serveur:', response.status, errorText);
          let errorData = {};
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            // Pas un JSON valide
          }
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        resolve(data);
      } catch (error) {
        console.error('API Request failed:', error);
        reject(error);
      }
    });
  });
}

// Fonctions d'authentification
const authAPI = {
  async login(email, password) {
    // Appel direct sans token pour le login
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Login failed');
    }
    
    const data = await response.json();
    
    if (data.token) {
      // Sauvegarder dans chrome.storage
      await new Promise((resolve) => {
        chrome.storage.local.set({
          authToken: data.token,
          user: data.user
        }, resolve);
      });
    }
    
    return data;
  },
  
  async register(name, email, password) {
    // Appel direct sans token pour l'inscription
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REGISTER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Registration failed');
    }
    
    const data = await response.json();
    
    if (data.token) {
      // Sauvegarder dans chrome.storage
      await new Promise((resolve) => {
        chrome.storage.local.set({
          authToken: data.token,
          user: data.user
        }, resolve);
      });
    }
    
    return data;
  },
  
  async logout() {
    await apiRequest(API_CONFIG.ENDPOINTS.LOGOUT, {
      method: 'POST'
    }).catch(() => {}); // Ignorer les erreurs de logout
    
    // Effacer de chrome.storage
    chrome.storage.local.remove(['authToken', 'user']);
  },
  
  async verifyToken() {
    try {
      const data = await apiRequest(API_CONFIG.ENDPOINTS.VERIFY_TOKEN);
      return data.valid;
    } catch {
      return false;
    }
  },
  
  // Fonction helper pour obtenir le token actuel
  async getToken() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['authToken'], (result) => {
        resolve(result.authToken || null);
      });
    });
  },
  
  // Fonction helper pour obtenir l'utilisateur actuel
  async getCurrentUser() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['user'], (result) => {
        resolve(result.user || null);
      });
    });
  }
};

// Fonctions pour les flashcards
const flashcardsAPI = {
  async getAll() {
    return await apiRequest(API_CONFIG.ENDPOINTS.FLASHCARDS);
  },
  
  async create(flashcardData) {
    // Adapter le format pour le backend qui attend front/back/language/sourceLanguage
    const adaptedData = {
      front: flashcardData.originalText || flashcardData.front,
      back: flashcardData.translatedText || flashcardData.back,
      language: flashcardData.language || flashcardData.targetLanguage || 'fr',
      sourceLanguage: flashcardData.sourceLanguage || null,
      category: flashcardData.folder || flashcardData.category || 'General',
      difficulty: flashcardData.difficulty === 'normal' ? 0 : 
                 flashcardData.difficulty === 'hard' ? 3 : 
                 flashcardData.difficulty === 'easy' ? 1 : 0 // TEMPORAIRE: L'ancien backend attend des nombres
    };
    
    console.log('📤 Envoi flashcard au backend:', adaptedData);
    
    return await apiRequest(API_CONFIG.ENDPOINTS.FLASHCARDS, {
      method: 'POST',
      body: JSON.stringify(adaptedData)
    });
  },
  
  async update(id, flashcardData) {
    return await apiRequest(API_CONFIG.ENDPOINTS.FLASHCARD_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(flashcardData)
    });
  },
  
  async delete(id) {
    return await apiRequest(API_CONFIG.ENDPOINTS.FLASHCARD_BY_ID(id), {
      method: 'DELETE'
    });
  }
};

// Export pour utilisation dans popup.js
window.API_CONFIG = API_CONFIG;
window.apiRequest = apiRequest;
window.authAPI = authAPI;
window.flashcardsAPI = flashcardsAPI;