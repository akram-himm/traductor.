const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { stripe, PRICES } = require('../config/stripe');

// Route de diagnostic pour vérifier et corriger les problèmes de souscription
router.get('/subscription/:userId?', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    // Vérifier que l'utilisateur a le droit d'accéder à ces infos
    if (userId !== req.user.id && req.user.email !== 'akramhimmich00@gmail.com') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Récupérer toutes les souscriptions de l'utilisateur
    const subscriptions = await Subscription.findAll({
      where: { userId: user.id },
      order: [['createdAt', 'DESC']]
    });
    
    // Récupérer la souscription active
    const activeSubscription = subscriptions.find(s => s.status === 'active');
    
    let stripeData = null;
    let stripeError = null;
    
    // Si une souscription active existe, vérifier avec Stripe
    if (activeSubscription && activeSubscription.stripeSubscriptionId) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(activeSubscription.stripeSubscriptionId);
        stripeData = {
          id: stripeSubscription.id,
          status: stripeSubscription.status,
          priceId: stripeSubscription.items.data[0].price.id,
          interval: stripeSubscription.items.data[0].price.recurring.interval,
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
        };
      } catch (error) {
        stripeError = error.message;
      }
    }
    
    // Déterminer le plan correct
    let correctPlan = null;
    let issues = [];
    
    if (activeSubscription) {
      if (activeSubscription.stripePriceId === PRICES.yearly) {
        correctPlan = 'yearly';
      } else if (activeSubscription.stripePriceId === PRICES.monthly) {
        correctPlan = 'monthly';
      }
      
      // Vérifier les incohérences
      if (user.subscriptionPlan !== correctPlan) {
        issues.push(`Plan mismatch: DB has '${user.subscriptionPlan}' but Stripe has '${correctPlan}'`);
      }
      
      if (!user.isPremium && activeSubscription.status === 'active') {
        issues.push('User is not marked as premium but has active subscription');
      }
      
      if (stripeData && stripeData.status !== activeSubscription.status) {
        issues.push(`Status mismatch: DB has '${activeSubscription.status}' but Stripe has '${stripeData.status}'`);
      }
    } else if (user.isPremium) {
      issues.push('User is marked as premium but has no active subscription');
    }
    
    const diagnostic = {
      user: {
        id: user.id,
        email: user.email,
        isPremium: user.isPremium,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
        stripeCustomerId: user.stripeCustomerId
      },
      database: {
        totalSubscriptions: subscriptions.length,
        activeSubscription: activeSubscription ? {
          id: activeSubscription.id,
          stripePriceId: activeSubscription.stripePriceId,
          stripeSubscriptionId: activeSubscription.stripeSubscriptionId,
          status: activeSubscription.status,
          createdAt: activeSubscription.createdAt,
          currentPeriodEnd: activeSubscription.currentPeriodEnd
        } : null,
        allSubscriptions: subscriptions.map(s => ({
          id: s.id,
          status: s.status,
          stripePriceId: s.stripePriceId,
          createdAt: s.createdAt
        }))
      },
      stripe: stripeData,
      stripeError: stripeError,
      correctPlan: correctPlan,
      issues: issues,
      prices: PRICES
    };
    
    res.json(diagnostic);
  } catch (error) {
    console.error('Diagnostic error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour forcer la synchronisation avec Stripe
router.post('/sync/:userId?', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    // Vérifier que l'utilisateur a le droit
    if (userId !== req.user.id && req.user.email !== 'akramhimmich00@gmail.com') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Récupérer la souscription active
    const activeSubscription = await Subscription.findOne({
      where: { userId: user.id, status: 'active' },
      order: [['createdAt', 'DESC']]
    });
    
    if (!activeSubscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }
    
    let updates = {};
    
    // Déterminer le plan correct basé sur le price ID
    if (activeSubscription.stripePriceId === PRICES.yearly) {
      updates.subscriptionPlan = 'yearly';
    } else if (activeSubscription.stripePriceId === PRICES.monthly) {
      updates.subscriptionPlan = 'monthly';
    }
    
    // Vérifier avec Stripe si possible
    if (activeSubscription.stripeSubscriptionId) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(activeSubscription.stripeSubscriptionId);
        
        // Mettre à jour le statut si différent
        if (stripeSubscription.status !== activeSubscription.status) {
          await activeSubscription.update({ status: stripeSubscription.status });
        }
        
        // Mettre à jour l'utilisateur selon le statut
        updates.isPremium = ['active', 'trialing'].includes(stripeSubscription.status);
        updates.subscriptionStatus = stripeSubscription.status === 'active' ? 'premium' : 'inactive';
        
      } catch (error) {
        console.error('Stripe sync error:', error);
      }
    }
    
    // Appliquer les mises à jour
    await user.update(updates);
    
    res.json({
      success: true,
      message: 'Synchronization completed',
      updates: updates,
      user: user
    });
    
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;