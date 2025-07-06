// Configuration API Backend
const API_CONFIG = {
  // URL du backend sur Render
  BASE_URL: 'https://my-backend-api-cng7.onrender.com',
  
  // Endpoints
  ENDPOINTS: {
    // Auth
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    VERIFY_TOKEN: '/api/auth/verify',
    
    // OAuth
    GOOGLE_AUTH: '/api/auth/google',
    FACEBOOK_AUTH: '/api/auth/facebook',
    
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
  const token = localStorage.getItem('authToken');
  
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
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        // Rediriger vers la page de connexion
        showAuthSection();
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
}

// Fonctions d'authentification
const authAPI = {
  async login(email, password) {
    const data = await apiRequest(API_CONFIG.ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },
  
  async register(name, email, password) {
    const data = await apiRequest(API_CONFIG.ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },
  
  async logout() {
    await apiRequest(API_CONFIG.ENDPOINTS.LOGOUT, {
      method: 'POST'
    });
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
  
  async verifyToken() {
    try {
      const data = await apiRequest(API_CONFIG.ENDPOINTS.VERIFY_TOKEN);
      return data.valid;
    } catch {
      return false;
    }
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