// Configuration API Backend
const API_CONFIG = {
  // URL du backend - Utiliser Render ou localhost
  BASE_URL: 'https://my-backend-api-cng7.onrender.com', // Backend sur Render
  
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
            // Token expiré ou invalide
            chrome.storage.local.remove(['authToken', 'user'], () => {
              console.log('Token invalide, authentification requise');
              // Déclencher un événement pour afficher la page de connexion
              window.dispatchEvent(new Event('auth-required'));
            });
            throw new Error('Authentication required');
          }
          
          const errorData = await response.json().catch(() => ({}));
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
    return await apiRequest(API_CONFIG.ENDPOINTS.FLASHCARDS, {
      method: 'POST',
      body: JSON.stringify(flashcardData)
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