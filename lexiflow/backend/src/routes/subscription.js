const express = require('express');
const router = express.Router();
const { stripe, PRICES } = require('../config/stripe');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

// Créer une session de paiement Stripe
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    const { priceType } = req.body; // 'monthly' ou 'yearly'
    const user = req.user;
    
    // Vérifier si l'utilisateur a déjà un abonnement
    const existingSubscription = await Subscription.findOne({
      where: { userId: user.id, status: 'active' }
    });
    
    if (existingSubscription) {
      return res.status(400).json({ 
        error: 'Vous avez déjà un abonnement actif' 
      });
    }
    
    // Créer ou récupérer le customer Stripe
    let stripeCustomerId = user.stripeCustomerId;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id
        }
      });
      stripeCustomerId = customer.id;
      await user.update({ stripeCustomerId });
    }
    
    // Déterminer le prix (early bird pour l'instant)
    const priceId = priceType === 'yearly' ? PRICES.yearly : PRICES.monthly;
    
    // Créer la session de checkout
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: {
        userId: user.id
      }
    });
    
    res.json({ 
      checkoutUrl: session.url,
      sessionId: session.id 
    });
    
  } catch (error) {
    console.error('Erreur création checkout:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la session' });
  }
});

// Webhook Stripe (appelé automatiquement par Stripe)
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
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Gérer les différents événements
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data.object);
      break;
      
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
      
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  
  res.json({ received: true });
});

// Helper function: Handle subscription status change
async function handleSubscriptionStatusChange(subscription) {
  try {
    const dbSubscription = await Subscription.findOne({
      where: { stripeSubscriptionId: subscription.id }
    });

    if (!dbSubscription) {
      console.error('Subscription not found:', subscription.id);
      return;
    }

    const user = await User.findByPk(dbSubscription.userId);
    if (!user) {
      console.error('User not found for subscription:', subscription.id);
      return;
    }

    await dbSubscription.update({
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    });

    // Update user premium status
    await user.update({
      isPremium: ['active', 'trialing'].includes(subscription.status)
    });

    // Send email notifications
    const { sendPaymentSuccessEmail, sendPaymentFailedEmail, sendSubscriptionCanceledEmail } = require('../utils/email');

    switch (subscription.status) {
      case 'active':
        if (subscription.cancel_at_period_end) {
          await sendSubscriptionCanceledEmail(user.email, {
            endDate: new Date(subscription.current_period_end * 1000)
          });
        } else {
          await sendPaymentSuccessEmail(user.email);
        }
        break;
      case 'past_due':
      case 'unpaid':
        await sendPaymentFailedEmail(user.email);
        break;
    }

  } catch (error) {
    console.error('Error handling subscription status change:', error);
  }
}

// Fonction helper : Checkout complété
async function handleCheckoutComplete(session) {
  try {
    const userId = session.metadata.userId;
    const user = await User.findByPk(userId);
    
    if (!user) {
      console.error('User not found:', userId);
      return;
    }
    
    // Récupérer la subscription depuis Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    
    // Créer l'enregistrement subscription
    await Subscription.create({
      userId: user.id,
      stripeCustomerId: session.customer,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      isEarlyBird: true,
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    });
    
    // Mettre à jour l'utilisateur
    await user.update({
      isPremium: true,
      stripeCustomerId: session.customer
    });
    
  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}

// Fonction helper : Subscription mise à jour
async function handleSubscriptionUpdate(subscription) {
  try {
    const sub = await Subscription.findOne({
      where: { stripeSubscriptionId: subscription.id }
    });
    
    if (!sub) return;
    
    // Mettre à jour le statut
    await sub.update({
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    });
    
    // Mettre à jour l'utilisateur
    const user = await User.findByPk(sub.userId);
    if (user) {
      await user.update({
        isPremium: subscription.status === 'active',
        premiumUntil: new Date(subscription.current_period_end * 1000)
      });
    }
    
  } catch (error) {
    console.error('Erreur handleSubscriptionUpdate:', error);
  }
}

// Fonction helper : Subscription annulée
async function handleSubscriptionDeleted(subscription) {
  try {
    const sub = await Subscription.findOne({
      where: { stripeSubscriptionId: subscription.id }
    });
    
    if (!sub) return;
    
    await sub.update({ status: 'canceled' });
    
    // Retirer le statut Premium
    const user = await User.findByPk(sub.userId);
    if (user) {
      await user.update({
        isPremium: false,
        premiumUntil: null
      });
      
      // Envoyer email de fin d'abonnement
      // await emailService.sendSubscriptionEnded(user.email, user.name);
    }
    
  } catch (error) {
    console.error('Erreur handleSubscriptionDeleted:', error);
  }
}

// Obtenir le statut de l'abonnement
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { 
        userId: req.user.id,
        status: 'active'
      }
    });
    
    if (!subscription) {
      return res.json({
        hasSubscription: false,
        isPremium: false,
        flashcardLimit: 50
      });
    }
    
    res.json({
      hasSubscription: true,
      isPremium: true,
      subscription: {
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        isEarlyBird: subscription.isEarlyBird
      },
      flashcardLimit: 200
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du statut' });
  }
});

// Annuler l'abonnement
router.post('/cancel', authMiddleware, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { 
        userId: req.user.id,
        status: 'active'
      }
    });
    
    if (!subscription) {
      return res.status(404).json({ error: 'Aucun abonnement actif trouvé' });
    }
    
    // Annuler sur Stripe (à la fin de la période)
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });
    
    await subscription.update({ cancelAtPeriodEnd: true });
    
    res.json({
      message: 'Abonnement annulé. Vous restez Premium jusqu\'au ' + 
               subscription.currentPeriodEnd.toLocaleDateString('fr-FR')
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'annulation' });
  }
});

module.exports = router;
