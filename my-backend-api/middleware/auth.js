const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant ou invalide' });
    }
    
    const token = authHeader.substring(7); // Enlever "Bearer "
    
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Récupérer l'utilisateur
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Vérifier le statut premium si nécessaire
    user.isPremiumActive = user.checkPremiumStatus();
    
    // Attacher l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token invalide' });
    }
    
    console.error('Erreur auth middleware:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Middleware optionnel (ne bloque pas si pas de token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      
      if (user) {
        user.isPremiumActive = user.checkPremiumStatus();
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Ignorer les erreurs et continuer sans auth
    next();
  }
};

// Middleware pour vérifier le statut premium
const requirePremium = (req, res, next) => {
  if (!req.user || !req.user.isPremiumActive) {
    return res.status(403).json({ 
      error: 'Accès réservé aux utilisateurs premium',
      upgradeUrl: '/api/subscription/plans'
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  optionalAuth,
  requirePremium
};