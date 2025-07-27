// API pour gérer les abonnements Stripe
const subscriptionAPI = {
  // Créer une session de paiement
  async createCheckoutSession(priceId, priceType) {
    try {
      const token = await authAPI.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await apiRequest('/api/subscription/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          priceType // 'monthly' ou 'yearly'
        })
      });

      if (response.sessionId) {
        // Rediriger vers Stripe Checkout
        window.open(response.checkoutUrl, '_blank');
        return response;
      }

      throw new Error(response.error || 'Failed to create checkout session');
    } catch (error) {
      console.error('Create checkout session error:', error);
      throw error;
    }
  },

  // Récupérer le statut de l'abonnement
  async getSubscriptionStatus() {
    try {
      const token = await authAPI.getToken();
      if (!token) {
        return { status: 'none' };
      }

      const response = await apiRequest('/api/subscription/status');
      return response;
    } catch (error) {
      console.error('Get subscription status error:', error);
      return { status: 'none' };
    }
  },

  // Gérer l'abonnement (portail client Stripe)
  async manageSubscription() {
    try {
      const token = await authAPI.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await apiRequest('/api/subscription/manage', {
        method: 'POST'
      });

      if (response.portalUrl) {
        window.open(response.portalUrl, '_blank');
        return response;
      }

      throw new Error(response.error || 'Failed to create portal session');
    } catch (error) {
      console.error('Manage subscription error:', error);
      throw error;
    }
  },

  // Prix des abonnements (configurés avec Stripe)
  prices: {
    monthly: {
      id: 'price_1RpQMQ2VEl7gdPozfYJSzL6B',
      amount: 499, // 4,99€ en centimes
      currency: 'eur',
      interval: 'month'
    },
    yearly: {
      id: 'price_1RpQMQ2VEl7gdPoz3JtfaNEk',
      amount: 4990, // 49,90€ en centimes
      currency: 'eur',
      interval: 'year'
    }
  }
};