const express = require('express');
const router = express.Router();
const { stripe, PRICES } = require('../config/stripe');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
// Charger les associations entre les modèles
require('../models/associations');

// Créer une session de paiement Stripe
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    const { priceType } = req.body; // 'monthly' ou 'yearly'
    const user = req.user;
    
    // Créer ou récupérer le client Stripe
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id }
      });
      stripeCustomerId = customer.id;
      await user.update({ stripeCustomerId });
    }
    
    // Sélectionner le prix
    const priceId = priceType === 'yearly' ? PRICES.yearly : PRICES.monthly;
    
    // Debug: Log des informations
    console.log('Creating checkout session with:', {
      priceType,
      priceId,
      PRICES,
      stripeCustomerId,
      userEmail: user.email
    });
    
    // Vérifier que le price ID existe
    if (!priceId) {
      console.error('Price ID is missing!', { priceType, PRICES });
      return res.status(400).json({ error: 'Price ID configuration error' });
    }
    
    // Créer la session de checkout
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.BASE_URL || 'https://my-backend-api-cng7.onrender.com'}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL || 'https://my-backend-api-cng7.onrender.com'}/payment-cancel.html`,
      metadata: { userId: user.id }
    });
    
    res.json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode
    });
    
    // Retourner une erreur plus spécifique
    if (error.message && error.message.includes('No such price')) {
      res.status(400).json({ error: 'Invalid price ID' });
    } else {
      res.status(500).json({ error: error.message || 'Error creating checkout session' });
    }
  }
});

// Upgrade to annual plan
router.post('/upgrade-to-annual', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    console.log('🔄 Upgrade request from user:', user.email);
    
    // Vérifier si l'utilisateur a déjà un plan mensuel actif
    const existingSubscription = await Subscription.findOne({
      where: {
        userId: user.id,
        status: 'active'
      }
    });
    
    console.log('📊 Existing subscription:', existingSubscription ? {
      id: existingSubscription.id,
      priceId: existingSubscription.stripePriceId,
      status: existingSubscription.status
    } : 'None');
    
    if (!existingSubscription) {
      console.log('❌ No active subscription found for upgrade');
      return res.status(400).json({ error: 'No active subscription found' });
    }
    
    // Vérifier que c'est bien un plan mensuel
    if (existingSubscription.stripePriceId !== PRICES.monthly) {
      console.log('⚠️ User already has annual plan or different price');
      return res.status(400).json({ error: 'You already have an annual plan' });
    }
    
    // Créer une session de checkout pour l'upgrade
    const session = await stripe.checkout.sessions.create({
      customer: user.stripeCustomerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: PRICES.yearly, quantity: 1 }],
      success_url: `${process.env.BASE_URL || 'https://my-backend-api-cng7.onrender.com'}/payment-success.html?session_id={CHECKOUT_SESSION_ID}&upgrade=true`,
      cancel_url: `${process.env.BASE_URL || 'https://my-backend-api-cng7.onrender.com'}/payment-cancel.html`,
      metadata: { 
        userId: user.id,
        isUpgrade: 'true',
        oldSubscriptionId: existingSubscription.stripeSubscriptionId
      },
      subscription_data: {
        metadata: {
          isUpgrade: 'true',
          oldSubscriptionId: existingSubscription.stripeSubscriptionId
        }
      }
    });
    
    res.json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Error creating upgrade session:', error);
    res.status(500).json({ error: error.message || 'Error creating upgrade session' });
  }
});

// Webhook Stripe (appelé automatiquement par Stripe)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log('🔔 Webhook reçu!');
  const sig = req.headers['stripe-signature'];
  let event;
  
  // Si pas de webhook secret configuré, log l'erreur mais accepter pour le test
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('⚠️ STRIPE_WEBHOOK_SECRET non configuré!');
    // En mode dev/test, on peut parser l'event directement
    try {
      event = JSON.parse(req.body);
      console.log('📦 Event type:', event.type);
    } catch (err) {
      console.error('Erreur parsing webhook:', err);
      return res.status(400).send('Invalid payload');
    }
  } else {
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      console.log('✅ Webhook signature vérifiée, event type:', event.type);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
  
  // Gérer les différents événements avec gestion d'erreur
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('📦 Processing checkout.session.completed');
        await handleCheckoutComplete(event.data.object);
        break;
        
      case 'customer.subscription.updated':
        console.log('🔄 Processing customer.subscription.updated');
        await handleSubscriptionUpdate(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        console.log('❌ Processing customer.subscription.deleted');
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        console.log('💰 Payment succeeded for invoice:', event.data.object.id);
        // Forcer une vérification du plan après paiement réussi
        if (event.data.object.subscription) {
          const subscription = await stripe.subscriptions.retrieve(event.data.object.subscription);
          await handleSubscriptionUpdate(subscription);
        }
        break;
        
      case 'invoice.payment_failed':
        console.log('❌ Payment failed for invoice:', event.data.object.id);
        break;
        
      default:
        console.log(`ℹ️ Unhandled event type ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (webhookError) {
    console.error('❌ Webhook processing error:', webhookError);
    // Répondre avec succès pour éviter que Stripe réessaye
    res.json({ received: true, error: webhookError.message });
  }
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
    
    // Vérifier si c'est un upgrade
    const isUpgrade = session.metadata.isUpgrade === 'true';
    
    console.log('🔍 Checkout metadata:', {
      isUpgrade,
      oldSubscriptionId: session.metadata.oldSubscriptionId,
      userId: session.metadata.userId
    });
    
    if (isUpgrade && session.metadata.oldSubscriptionId) {
      // Annuler l'ancienne souscription
      try {
        await stripe.subscriptions.cancel(session.metadata.oldSubscriptionId);
        console.log('✅ Ancienne souscription annulée:', session.metadata.oldSubscriptionId);
        
        // Mettre à jour l'ancienne souscription dans la DB
        await Subscription.update(
          { status: 'canceled' },
          { where: { stripeSubscriptionId: session.metadata.oldSubscriptionId } }
        );
      } catch (cancelError) {
        console.error('Erreur lors de l\'annulation de l\'ancienne souscription:', cancelError);
      }
    }
    
    // Créer ou mettre à jour l'enregistrement subscription
    if (isUpgrade) {
      // Pour un upgrade, annuler toutes les anciennes souscriptions actives
      await Subscription.update(
        { status: 'canceled' },
        { where: { userId: user.id, status: 'active' } }
      );
      console.log('✅ Anciennes souscriptions marquées comme annulées');
    }
    
    // Créer la nouvelle souscription
    try {
      const newSubscription = await Subscription.create({
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
      console.log('✅ Nouvelle souscription créée:', newSubscription.id);
    } catch (createError) {
      console.error('❌ Erreur création souscription:', createError);
      // En cas d'erreur, essayer de mettre à jour une existante
      const existingSubscription = await Subscription.findOne({
        where: { userId: user.id },
        order: [['createdAt', 'DESC']]
      });
      
      if (existingSubscription) {
        await existingSubscription.update({
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0].price.id,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        });
        console.log('✅ Souscription existante mise à jour');
      }
    }
    
    // Déterminer le type de plan basé sur le price ID
    const priceId = subscription.items.data[0].price.id;
    let subscriptionPlan = 'monthly'; // Par défaut
    
    if (priceId === PRICES.yearly) {
      subscriptionPlan = 'yearly';
    } else if (priceId === PRICES.monthly) {
      subscriptionPlan = 'monthly';
    }
    
    console.log('✅ Mise à jour utilisateur avec plan:', subscriptionPlan);
    
    // Mettre à jour l'utilisateur
    await user.update({
      isPremium: true,
      stripeCustomerId: session.customer,
      subscriptionPlan: subscriptionPlan,
      subscriptionStatus: 'premium',
      premiumUntil: new Date(subscription.current_period_end * 1000)
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
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      stripePriceId: subscription.items.data[0].price.id
    });
    
    // Déterminer le type de plan
    const priceId = subscription.items.data[0].price.id;
    let subscriptionPlan = 'monthly';
    
    if (priceId === PRICES.yearly) {
      subscriptionPlan = 'yearly';
    } else if (priceId === PRICES.monthly) {
      subscriptionPlan = 'monthly';
    }
    
    // Mettre à jour l'utilisateur
    const user = await User.findByPk(sub.userId);
    if (user) {
      await user.update({
        isPremium: subscription.status === 'active',
        premiumUntil: new Date(subscription.current_period_end * 1000),
        subscriptionPlan: subscriptionPlan,
        subscriptionStatus: subscription.status === 'active' ? 'premium' : 'inactive'
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

// Route de test pour vérifier les webhooks
router.get('/webhook-test', (req, res) => {
  res.json({ 
    message: 'Webhook endpoint is accessible',
    url: `${process.env.BASE_URL || 'https://my-backend-api-cng7.onrender.com'}/api/subscription/webhook`
  });
});

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
        flashcardLimit: 100
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
      flashcardLimit: -1 // -1 = illimité
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du statut' });
  }
});

// Annuler l'abonnement
router.post('/cancel', authMiddleware, async (req, res) => {
  try {
    console.log('🚫 Demande d\'annulation pour:', req.user.email);
    
    // Normaliser les données de l'utilisateur (éviter les problèmes de casse)
    const userEmail = req.user.email.toLowerCase().trim();
    const userPlan = req.user.subscriptionPlan ? req.user.subscriptionPlan.toLowerCase().trim() : null;
    
    // Vérifier d'abord le statut dans la table Users
    console.log('📊 Statut utilisateur:', {
      email: userEmail,
      isPremium: req.user.isPremium,
      subscriptionPlan: userPlan,
      stripeCustomerId: req.user.stripeCustomerId
    });
    
    // Si l'utilisateur n'est pas premium selon la table Users, erreur
    if (!req.user.isPremium || !userPlan) {
      return res.status(400).json({ error: 'You do not have an active subscription' });
    }
    
    // D'abord vérifier si l'utilisateur a un Stripe customer ID
    if (!req.user.stripeCustomerId) {
      return res.status(400).json({ error: 'No payment information found' });
    }
    
    // Chercher la souscription active ou en essai dans la DB
    const subscription = await Subscription.findOne({
      where: { 
        userId: req.user.id,
        status: ['active', 'trialing', 'past_due'] // Inclure tous les statuts "actifs"
      },
      order: [['createdAt', 'DESC']]
    });
    
    if (!subscription) {
      console.log('❌ Aucune souscription dans la DB, vérification directe avec Stripe...');
      
      // Si pas dans la DB, chercher directement dans Stripe
      try {
        const stripeSubscriptions = await stripe.subscriptions.list({
          customer: req.user.stripeCustomerId,
          limit: 10 // Récupérer plus de souscriptions pour trouver la bonne
        });
        
        // Filtrer pour trouver une souscription annulable
        const activeSubscriptions = stripeSubscriptions.data.filter(s => 
          ['active', 'trialing', 'past_due'].includes(s.status) && 
          !s.cancel_at_period_end
        );
        
        if (activeSubscriptions.length === 0) {
          // Vérifier s'il y a des souscriptions déjà annulées
          const canceledSubs = stripeSubscriptions.data.filter(s => s.cancel_at_period_end);
          if (canceledSubs.length > 0) {
            return res.status(400).json({ 
              error: 'Subscription already scheduled for cancellation',
              endDate: new Date(canceledSubs[0].current_period_end * 1000)
            });
          }
          return res.status(404).json({ error: 'No active subscription found in Stripe' });
        }
        
        const stripeSub = activeSubscriptions[0]; // Prendre la première souscription active
        console.log('✅ Souscription Stripe trouvée:', stripeSub.id);
        
        // NOUVELLE LOGIQUE : Créer l'enregistrement manquant avant d'annuler
        console.log('🔧 Création automatique de l\'enregistrement Subscription manquant...');
        
        try {
          // Vérifier si cette souscription existe déjà (peut-être inactive)
          let dbSubscription = await Subscription.findOne({
            where: { stripeSubscriptionId: stripeSub.id }
          });
          
          if (dbSubscription) {
            // Mettre à jour l'existante
            await dbSubscription.update({
              status: stripeSub.status,
              userId: req.user.id,
              currentPeriodEnd: new Date(stripeSub.current_period_end * 1000)
            });
            console.log('✅ Enregistrement existant mis à jour');
          } else {
            // Créer un nouvel enregistrement
            dbSubscription = await Subscription.create({
              userId: req.user.id,
              stripeCustomerId: req.user.stripeCustomerId,
              stripeSubscriptionId: stripeSub.id,
              stripePriceId: stripeSub.items.data[0].price.id,
              status: stripeSub.status,
              currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
              currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
              cancelAtPeriodEnd: false,
              isEarlyBird: true
            });
            console.log('✅ Nouvel enregistrement Subscription créé');
          }
          
          // Maintenant annuler dans Stripe
          const updatedSub = await stripe.subscriptions.update(
            stripeSub.id,
            { cancel_at_period_end: true }
          );
          
          // Mettre à jour l'enregistrement DB
          await dbSubscription.update({
            cancelAtPeriodEnd: true
          });
          
          const endDate = new Date(updatedSub.current_period_end * 1000);
          
          return res.json({
            success: true,
            message: `Subscription canceled successfully. You will remain Premium until ${endDate.toLocaleDateString('en-US')}`,
            endDate: endDate,
            recordCreated: !dbSubscription
          });
          
        } catch (createError) {
          console.error('❌ Erreur création/mise à jour:', createError);
          // Continuer quand même avec l'annulation Stripe seule
        }
        
      } catch (stripeError) {
        console.error('❌ Erreur Stripe directe:', stripeError);
        return res.status(500).json({ 
          error: 'Failed to cancel subscription in Stripe',
          details: stripeError.message 
        });
      }
    }
    
    console.log('📊 Souscription trouvée:', {
      id: subscription.id,
      stripeId: subscription.stripeSubscriptionId,
      priceId: subscription.stripePriceId
    });
    
    try {
      // Annuler sur Stripe (à la fin de la période)
      const stripeSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId, 
        {
          cancel_at_period_end: true
        }
      );
      
      console.log('✅ Souscription Stripe mise à jour:', stripeSubscription.cancel_at_period_end);
      
      // Mettre à jour dans la DB
      await subscription.update({ 
        cancelAtPeriodEnd: true,
        status: stripeSubscription.status
      });
      
      // Calculer la date de fin
      const endDate = subscription.currentPeriodEnd || 
                     new Date(stripeSubscription.current_period_end * 1000);
      
      res.json({
        success: true,
        message: `Subscription canceled. You will remain Premium until ${endDate.toLocaleDateString('en-US')}`,
        endDate: endDate
      });
      
    } catch (stripeError) {
      console.error('❌ Erreur Stripe:', stripeError);
      return res.status(500).json({ 
        error: 'Failed to cancel subscription with payment provider',
        details: stripeError.message 
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur générale annulation:', error);
    res.status(500).json({ 
      error: 'Failed to cancel subscription',
      details: error.message 
    });
  }
});

// Réactiver l'abonnement (annuler l'annulation)
router.post('/reactivate', authMiddleware, async (req, res) => {
  try {
    console.log('♻️ Demande de réactivation pour:', req.user.email);
    
    // Chercher la souscription active avec annulation programmée
    const subscription = await Subscription.findOne({
      where: { 
        userId: req.user.id,
        status: 'active',
        cancelAtPeriodEnd: true
      },
      order: [['createdAt', 'DESC']]
    });
    
    if (!subscription) {
      return res.status(404).json({ error: 'No subscription scheduled for cancellation found' });
    }
    
    try {
      // Réactiver sur Stripe
      const stripeSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId, 
        {
          cancel_at_period_end: false
        }
      );
      
      console.log('✅ Souscription Stripe réactivée');
      
      // Mettre à jour dans la DB
      await subscription.update({ 
        cancelAtPeriodEnd: false
      });
      
      res.json({
        success: true,
        message: 'Subscription reactivated successfully!',
        subscription: {
          status: stripeSubscription.status,
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
        }
      });
      
    } catch (stripeError) {
      console.error('❌ Erreur Stripe:', stripeError);
      return res.status(500).json({ 
        error: 'Failed to reactivate subscription',
        details: stripeError.message 
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur réactivation:', error);
    res.status(500).json({ 
      error: 'Failed to reactivate subscription',
      details: error.message 
    });
  }
});

// Route de synchronisation forcée avec Stripe
router.post('/sync-stripe', authMiddleware, async (req, res) => {
  try {
    console.log('🔄 Synchronisation Stripe pour:', req.user.email);
    
    if (!req.user.stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer ID found' });
    }
    
    // Récupérer toutes les souscriptions Stripe
    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: req.user.stripeCustomerId,
      limit: 100
    });
    
    console.log(`📊 ${stripeSubscriptions.data.length} souscriptions Stripe trouvées`);
    
    // Récupérer toutes les souscriptions DB
    const dbSubscriptions = await Subscription.findAll({
      where: { userId: req.user.id }
    });
    
    const dbSubIds = dbSubscriptions.map(s => s.stripeSubscriptionId);
    let created = 0;
    let updated = 0;
    
    // Synchroniser chaque souscription Stripe
    for (const stripeSub of stripeSubscriptions.data) {
      const existingDb = dbSubscriptions.find(db => db.stripeSubscriptionId === stripeSub.id);
      
      if (!existingDb) {
        // Créer la souscription manquante
        try {
          await Subscription.create({
            userId: req.user.id,
            stripeCustomerId: req.user.stripeCustomerId,
            stripeSubscriptionId: stripeSub.id,
            stripePriceId: stripeSub.items.data[0].price.id,
            status: stripeSub.status,
            currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end || false
          });
          created++;
          console.log(`✅ Créé: ${stripeSub.id}`);
        } catch (createError) {
          console.error(`❌ Erreur création ${stripeSub.id}:`, createError.message);
        }
      } else if (existingDb.status !== stripeSub.status || 
                 existingDb.cancelAtPeriodEnd !== stripeSub.cancel_at_period_end) {
        // Mettre à jour si différent
        await existingDb.update({
          status: stripeSub.status,
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end || false,
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000)
        });
        updated++;
        console.log(`🔄 Mis à jour: ${stripeSub.id}`);
      }
    }
    
    res.json({
      success: true,
      message: `Sync completed: ${created} created, ${updated} updated`,
      stripe: stripeSubscriptions.data.length,
      database: dbSubscriptions.length + created,
      created,
      updated
    });
    
  } catch (error) {
    console.error('❌ Erreur sync:', error);
    res.status(500).json({ 
      error: 'Sync failed',
      details: error.message 
    });
  }
});

// [DÉSACTIVÉ] Route temporaire pour créer une souscription manquante
// Cette fonctionnalité est maintenant intégrée dans la route /cancel
/*
router.post('/create-missing', authMiddleware, async (req, res) => {
  try {
    console.log('🔧 Création de souscription manquante pour:', req.user.email);
    
    // Vérifier s'il y a déjà une souscription active
    const existingActive = await Subscription.findOne({
      where: { 
        userId: req.user.id,
        status: 'active'
      }
    });
    
    if (existingActive) {
      return res.json({ 
        success: false, 
        message: 'An active subscription already exists',
        subscription: existingActive
      });
    }
    
    // Vérifier avec Stripe
    if (!req.user.stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer ID found' });
    }
    
    // Lister les souscriptions Stripe
    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: req.user.stripeCustomerId,
      status: 'active',
      limit: 1
    });
    
    if (stripeSubscriptions.data.length === 0) {
      return res.status(404).json({ error: 'No active Stripe subscription found' });
    }
    
    const stripeSub = stripeSubscriptions.data[0];
    console.log('✅ Souscription Stripe trouvée:', stripeSub.id);
    
    // Vérifier d'abord si cette souscription existe déjà (peut-être avec un autre statut)
    const existingSubWithId = await Subscription.findOne({
      where: { stripeSubscriptionId: stripeSub.id }
    });
    
    if (existingSubWithId) {
      // Mettre à jour l'existante au lieu de créer
      console.log('⚠️ Souscription existante trouvée, mise à jour...');
      await existingSubWithId.update({
        userId: req.user.id,
        status: stripeSub.status,
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end
      });
      
      return res.json({
        success: true,
        message: 'Existing subscription record updated',
        subscription: existingSubWithId,
        updated: true
      });
    }
    
    // Créer l'enregistrement dans la DB
    const newSubscription = await Subscription.create({
      userId: req.user.id,
      stripeCustomerId: req.user.stripeCustomerId,
      stripeSubscriptionId: stripeSub.id,
      stripePriceId: stripeSub.items.data[0].price.id,
      status: stripeSub.status,
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      isEarlyBird: false
    });
    
    console.log('✅ Souscription créée dans la DB:', newSubscription.id);
    
    res.json({
      success: true,
      message: 'Subscription record created successfully',
      subscription: newSubscription
    });
    
  } catch (error) {
    console.error('❌ Erreur création souscription manquante:', error);
    res.status(500).json({ 
      error: 'Failed to create subscription record',
      details: error.message 
    });
  }
});
*/

// [DÉSACTIVÉ] Route de diagnostic des souscriptions  
// Garder pour référence future si besoin de debug
/*
router.get('/debug/:userId?', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    // Vérifier que c'est le bon utilisateur ou un admin
    if (userId !== req.user.id && req.user.email !== 'akramhimmich00@gmail.com') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const user = await User.findByPk(userId);
    
    // Chercher toutes les souscriptions
    const subscriptions = await Subscription.findAll({
      where: { userId: userId },
      order: [['createdAt', 'DESC']]
    });
    
    // Vérifier avec Stripe
    let stripeSubscriptions = [];
    if (user.stripeCustomerId) {
      try {
        const stripeSubs = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          limit: 10
        });
        stripeSubscriptions = stripeSubs.data;
      } catch (stripeError) {
        console.error('Stripe error:', stripeError);
      }
    }
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        isPremium: user.isPremium,
        subscriptionPlan: user.subscriptionPlan,
        stripeCustomerId: user.stripeCustomerId
      },
      database: {
        count: subscriptions.length,
        subscriptions: subscriptions.map(s => ({
          id: s.id,
          status: s.status,
          stripeSubscriptionId: s.stripeSubscriptionId,
          stripePriceId: s.stripePriceId,
          cancelAtPeriodEnd: s.cancelAtPeriodEnd,
          createdAt: s.createdAt,
          currentPeriodEnd: s.currentPeriodEnd
        }))
      },
      stripe: {
        count: stripeSubscriptions.length,
        subscriptions: stripeSubscriptions.map(s => ({
          id: s.id,
          status: s.status,
          priceId: s.items.data[0].price.id,
          interval: s.items.data[0].price.recurring.interval,
          currentPeriodEnd: new Date(s.current_period_end * 1000),
          cancelAtPeriodEnd: s.cancel_at_period_end
        }))
      },
      prices: PRICES
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});
*/

module.exports = router;
