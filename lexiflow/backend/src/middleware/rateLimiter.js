const rateLimit = require('express-rate-limit');

const limiters = {
  // Limite globale par défaut
  global: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limite chaque IP à 100 requêtes par fenêtre
  }),
  
  // Limite spécifique pour les flashcards
  flashcards: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requêtes par minute
    message: {
      success: false,
      error: 'Trop de requêtes. Veuillez réessayer dans une minute.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  }),
  
  // Limite pour l'authentification
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 tentatives par 15 minutes
    message: {
      success: false,
      error: 'Trop de tentatives. Veuillez réessayer dans 15 minutes.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    }
  }),
  
  // Limite pour l'API DeepSeek
  deepseek: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requêtes par minute
    message: {
      success: false,
      error: 'Trop de traductions. Veuillez réessayer dans une minute.',
      code: 'DEEPSEEK_RATE_LIMIT_EXCEEDED'
    }
  })
};

module.exports = limiters;
