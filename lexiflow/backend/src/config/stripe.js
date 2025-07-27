const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Prix Stripe (Early Bird)
// TEMPORAIRE: Forcer les valeurs jusqu'à ce que les env vars soient configurées sur Render
const PRICES = {
  monthly: 'price_1RpQMQ2VEl7gdPozfYJSzL6B', // $4.99/month early bird
  yearly: 'price_1RpQMQ2VEl7gdPoz3JtfaNEk',   // $49.90/year early bird
};

// Debug: Log les prix au démarrage
console.log('🔧 Configuration Stripe PRICES:', {
  monthly: PRICES.monthly,
  yearly: PRICES.yearly,
  env_monthly: process.env.STRIPE_MONTHLY_PRICE_ID,
  env_yearly: process.env.STRIPE_YEARLY_PRICE_ID
});

// Configuration du portail client Stripe
const PORTAL_CONFIG = {
  business_profile: {
    headline: 'LexiFlow Premium',
    privacy_policy_url: `${process.env.FRONTEND_URL}/privacy`,
    terms_of_service_url: `${process.env.FRONTEND_URL}/terms`,
  },
  features: {
    subscription_cancel: { enabled: true },
    payment_method_update: { enabled: true },
    invoice_history: { enabled: true }
  },
  default_return_url: process.env.FRONTEND_URL
};

async function initializeStripe() {
  try {
    // Create or update the customer portal configuration
    await stripe.billingPortal.configurations.create({
      ...PORTAL_CONFIG,
      is_default: true
    });
  } catch (error) {
    console.error('Error initializing Stripe portal config:', error);
  }
}

module.exports = { 
  stripe, 
  PRICES, 
  PORTAL_CONFIG,
  initializeStripe 
};
