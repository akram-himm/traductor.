const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Prix Stripe (à créer dans le dashboard Stripe)
const PRICES = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY, // 2.99€/mois early bird
  yearly: process.env.STRIPE_PRICE_ID_YEARLY,   // 29.99€/an early bird
};

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
