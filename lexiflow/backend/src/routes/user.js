const express = require('express');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Mock database for flashcards
const flashcards = [];

// GET /api/user/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = req.user; // Assuming user is attached to req by authMiddleware
    
    // Convertir l'objet Sequelize en objet simple
    const userData = user.toJSON ? user.toJSON() : user;
    
    // Si l'utilisateur est Premium mais n'a pas de plan défini, essayer de le récupérer depuis Subscription
    if (!userData.subscriptionPlan && userData.isPremium) {
      const Subscription = require('../models/Subscription');
      const { PRICES } = require('../config/stripe');
      
      const subscription = await Subscription.findOne({
        where: {
          userId: user.id,
          status: 'active'
        }
      });
      
      if (subscription) {
        // Déterminer le type de plan basé sur le price ID
        if (subscription.stripePriceId === PRICES.yearly) {
          userData.subscriptionPlan = 'yearly';
        } else if (subscription.stripePriceId === PRICES.monthly) {
          userData.subscriptionPlan = 'monthly';
        }
        userData.subscriptionStatus = 'premium';
        
        // Optionnel : mettre à jour l'utilisateur dans la DB
        await user.update({
          subscriptionPlan: userData.subscriptionPlan,
          subscriptionStatus: userData.subscriptionStatus
        });
      } else {
        // Fallback : pour le test, on simule que tous les Premium sont mensuels
        userData.subscriptionPlan = 'monthly';
        userData.subscriptionStatus = 'premium';
      }
    }
    
    res.json({ success: true, user: userData });
  } catch (error) {
    console.error('Error in /api/user/profile:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user profile.' });
  }
});

// TEMPORAIRE : Route pour forcer le changement de plan (à supprimer après tests)
router.post('/force-plan', authMiddleware, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }
    
    await req.user.update({
      subscriptionPlan: plan,
      subscriptionStatus: 'premium'
    });
    
    res.json({ 
      success: true, 
      message: `Plan updated to ${plan}`,
      user: req.user
    });
  } catch (error) {
    console.error('Error forcing plan:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// PUT /api/user/profile
router.put('/profile', authMiddleware, (req, res) => {
  try {
    const user = req.user;
    const { name, email } = req.body;

    // Update user logic here (mocked)
    user.name = name || user.name;
    user.email = email || user.email;

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update user profile.' });
  }
});

// GET /api/user/flashcards
router.get('/flashcards', authMiddleware, (req, res) => {
  try {
    const userFlashcards = flashcards.filter(f => f.userId === req.user.id);
    res.json({ success: true, flashcards: userFlashcards });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch flashcards.' });
  }
});

// POST /api/user/flashcards
router.post('/flashcards', authMiddleware, (req, res) => {
  try {
    const { content } = req.body;

    if (content.length < 100 || content.length > 350) {
      return res.status(400).json({ success: false, error: 'Flashcard content must be between 100 and 350 characters.' });
    }

    const userFlashcards = flashcards.filter(f => f.userId === req.user.id);
    if (userFlashcards.length >= 50) {
      return res.status(400).json({ success: false, error: 'You have reached the limit of 50 flashcards.' });
    }

    const newFlashcard = { id: flashcards.length + 1, userId: req.user.id, content };
    flashcards.push(newFlashcard);

    res.json({ success: true, flashcard: newFlashcard });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create flashcard.' });
  }
});

// DELETE /api/user/flashcards/:id
router.delete('/flashcards/:id', authMiddleware, (req, res) => {
  try {
    const flashcardId = parseInt(req.params.id, 10);
    const index = flashcards.findIndex(f => f.id === flashcardId && f.userId === req.user.id);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Flashcard not found.' });
    }

    flashcards.splice(index, 1);
    res.json({ success: true, message: 'Flashcard deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete flashcard.' });
  }
});

module.exports = router;