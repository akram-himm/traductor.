const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Configuration Stripe
const PREMIUM_PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_test_premium';
const EARLY_BIRD_PRICE_ID = process.env.STRIPE_EARLY_BIRD_PRICE_ID || 'price_test_earlybird';

// Récupérer les plans disponibles
router.get('/plans', async (req, res) => {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Gratuit',
        price: 0,
        features: [
          'Traductions illimitées',
          '100 caractères par traduction',
          '50 flashcards maximum',
          'Google Translate & MyMemory'
        ]
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 4.99,
        priceId: PREMIUM_PRICE_ID,
        features: [
          'Traductions illimitées',
          '350 caractères par traduction',
          '200 flashcards maximum',
          'DeepSeek AI + tous les services',
          'Mode pratique',
          'Synchronisation cloud',
          'Support prioritaire'
        ]
      },
      {
        id: 'earlybird',
        name: 'Early Bird Premium',
        price: 2.99,
        priceId: EARLY_BIRD_PRICE_ID,
        features: [
          'Toutes les fonctionnalités Premium',
          'Prix à vie : 2.99€/mois',
          'Limité aux 1000 premiers utilisateurs'
        ],
        limited: true
      }
    ];

    res.json(plans);
  } catch (error) {
    console.error('Erreur plans:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des plans' });
  }
});

// Créer une session de paiement Stripe
router.post('/create-checkout', authMiddleware, async (req, res) => {
  try {
    const { priceId, isEarlyBird } = req.body;

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(501).json({ error: 'Paiements non configurés' });
    }

    // Créer ou récupérer le client Stripe
    let stripeCustomerId = req.user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: {
          userId: req.user.id
        }
      });
      
      stripeCustomerId = customer.id;
      await req.user.update({ stripeCustomerId });
    }

    // Créer la session de checkout
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{
        price: isEarlyBird ? EARLY_BIRD_PRICE_ID : PREMIUM_PRICE_ID,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: {
        userId: req.user.id,
        isEarlyBird: isEarlyBird ? 'true' : 'false'
      }
    });

    res.json({ 
      checkoutUrl: session.url,
      sessionId: session.id 
    });
  } catch (error) {
    console.error('Erreur checkout:', error);
    res.status(500).json({ error: 'Erreur lors de la création du paiement' });
  }
});

// Webhook Stripe pour gérer les événements
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Erreur webhook:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gérer les événements
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      await handleCheckoutComplete(session);
      break;
      
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      await handleSubscriptionChange(subscription);
      break;
  }

  res.json({ received: true });
});

// Gérer la complétion du checkout
async function handleCheckoutComplete(session) {
  try {
    const userId = session.metadata.userId;
    const user = await User.findByPk(userId);
    
    if (!user) return;

    // Activer le premium
    await user.update({
      isPremium: true,
      premiumUntil: null // Abonnement actif, pas de date de fin
    });

    console.log(`Premium activé pour l'utilisateur ${userId}`);
  } catch (error) {
    console.error('Erreur activation premium:', error);
  }
}

// Gérer les changements d'abonnement
async function handleSubscriptionChange(subscription) {
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userId = customer.metadata.userId;
    const user = await User.findByPk(userId);
    
    if (!user) return;

    if (subscription.status === 'active') {
      await user.update({
        isPremium: true,
        premiumUntil: new Date(subscription.current_period_end * 1000)
      });
    } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
      await user.update({
        isPremium: false,
        premiumUntil: new Date(subscription.current_period_end * 1000)
      });
    }

    console.log(`Abonnement mis à jour pour l'utilisateur ${userId}: ${subscription.status}`);
  } catch (error) {
    console.error('Erreur mise à jour abonnement:', error);
  }
}

// Récupérer l'état de l'abonnement
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const status = {
      isPremium: req.user.isPremiumActive,
      premiumUntil: req.user.premiumUntil,
      flashcardLimit: req.user.isPremiumActive ? 200 : 50,
      characterLimit: req.user.isPremiumActive ? 350 : 100
    };

    // Si l'utilisateur a un ID Stripe, récupérer les infos d'abonnement
    if (req.user.stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: req.user.stripeCustomerId,
          status: 'active',
          limit: 1
        });

        if (subscriptions.data.length > 0) {
          const sub = subscriptions.data[0];
          status.subscription = {
            status: sub.status,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end
          };
        }
      } catch (stripeError) {
        console.error('Erreur Stripe:', stripeError);
      }
    }

    res.json(status);
  } catch (error) {
    console.error('Erreur status:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du statut' });
  }
});

// Annuler l'abonnement
router.post('/cancel', authMiddleware, async (req, res) => {
  try {
    if (!req.user.stripeCustomerId || !process.env.STRIPE_SECRET_KEY) {
      return res.status(400).json({ error: 'Aucun abonnement actif' });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: req.user.stripeCustomerId,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return res.status(400).json({ error: 'Aucun abonnement actif trouvé' });
    }

    // Annuler à la fin de la période
    const subscription = await stripe.subscriptions.update(
      subscriptions.data[0].id,
      { cancel_at_period_end: true }
    );

    res.json({
      message: 'Abonnement annulé, restera actif jusqu\'à la fin de la période',
      endsAt: new Date(subscription.current_period_end * 1000)
    });
  } catch (error) {
    console.error('Erreur annulation:', error);
    res.status(500).json({ error: 'Erreur lors de l\'annulation' });
  }
});

module.exports = router;