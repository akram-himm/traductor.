const premiumMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!req.user.isPremium) {
      return res.status(403).json({
        success: false,
        error: 'Cette fonctionnalité nécessite un abonnement Premium',
        code: 'PREMIUM_REQUIRED'
      });
    }

    // Vérifier si l'abonnement n'est pas expiré
    if (req.user.premiumUntil && new Date() > new Date(req.user.premiumUntil)) {
      // Mettre à jour le statut premium
      await req.user.update({
        isPremium: false,
        premiumUntil: null
      });

      return res.status(403).json({
        success: false,
        error: 'Votre abonnement Premium est expiré',
        code: 'PREMIUM_EXPIRED'
      });
    }

    next();
  } catch (error) {
    console.error('Erreur middleware premium:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification du statut Premium'
    });
  }
};

module.exports = premiumMiddleware;
