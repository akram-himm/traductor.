const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Flashcard = require('../models/Flashcard');
const Subscription = require('../models/Subscription');

// Statistiques flashcards
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Total flashcards
    const totalFlashcards = await Flashcard.count({
      where: { userId }
    });
    
    // Statistiques par langue
    const languageStats = await Flashcard.findAll({
      where: { userId },
      attributes: [
        'targetLang',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['targetLang']
    });
    
    // Révisions récentes (7 derniers jours)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const recentReviews = await Flashcard.findAll({
      where: {
        userId,
        lastReviewed: {
          [Op.gte]: lastWeek
        }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('lastReviewed')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('lastReviewed'))]
    });
    
    res.json({
      success: true,
      data: {
        totalFlashcards,
        languageStats,
        recentReviews
      }
    });
  } catch (error) {
    console.error('Erreur stats dashboard:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// Usage actuel vs limites
router.get('/usage', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = req.user;
    
    // Flashcards
    const flashcardCount = await Flashcard.count({ where: { userId } });
    const flashcardLimit = user.isPremium ? 200 : 50;
    const flashcardUsage = (flashcardCount / flashcardLimit) * 100;
    
    // Caractères
    const characterLimit = user.isPremium ? 350 : 100;
    
    res.json({
      success: true,
      data: {
        flashcards: {
          used: flashcardCount,
          limit: flashcardLimit,
          usage: flashcardUsage
        },
        characters: {
          limit: characterLimit
        },
        isPremium: user.isPremium
      }
    });
  } catch (error) {
    console.error('Erreur usage dashboard:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des limites'
    });
  }
});

// Historique de facturation
router.get('/billing', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const subscription = await Subscription.findOne({
      where: { 
        userId,
        status: 'active'
      }
    });
    
    if (!subscription) {
      return res.json({
        success: true,
        data: {
          hasSubscription: false
        }
      });
    }
    
    // Récupérer l'historique depuis Stripe
    const { stripe } = require('../config/stripe');
    const invoices = await stripe.invoices.list({
      customer: subscription.stripeCustomerId,
      limit: 12 // 12 derniers mois
    });
    
    res.json({
      success: true,
      data: {
        hasSubscription: true,
        subscription: {
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          isEarlyBird: subscription.isEarlyBird,
          amount: subscription.amount
        },
        invoices: invoices.data.map(invoice => ({
          id: invoice.id,
          amount: invoice.amount_paid / 100,
          date: new Date(invoice.created * 1000),
          receipt: invoice.hosted_invoice_url
        }))
      }
    });
  } catch (error) {
    console.error('Erreur billing dashboard:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération de l\'historique de facturation'
    });
  }
});

module.exports = router;
