const express = require('express');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Récupérer le profil de l'utilisateur
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    res.json({
      user: req.user.toJSON(),
      stats: {
        flashcardCount: req.user.flashcardCount,
        isPremium: req.user.isPremiumActive,
        memberSince: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Erreur profil:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

// Mettre à jour les paramètres
router.put('/settings', authMiddleware, [
  body('targetLanguage').optional().isString(),
  body('buttonColor').optional().matches(/^#[0-9A-F]{6}$/i),
  body('enableShortcut').optional().isBoolean(),
  body('autoSaveFlashcard').optional().isBoolean(),
  body('enableAnimations').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Fusionner les nouveaux paramètres avec les anciens
    const newSettings = {
      ...req.user.settings,
      ...req.body
    };

    await req.user.update({ settings: newSettings });

    res.json({
      message: 'Paramètres mis à jour',
      settings: newSettings
    });
  } catch (error) {
    console.error('Erreur mise à jour paramètres:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des paramètres' });
  }
});

// Mettre à jour le mot de passe
router.put('/password', authMiddleware, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Vérifier l'ancien mot de passe
    const isValid = await req.user.validatePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    // Mettre à jour le mot de passe
    req.user.password = newPassword;
    await req.user.save();

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
  }
});

// Supprimer le compte
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Mot de passe requis' });
    }

    // Vérifier le mot de passe
    const isValid = await req.user.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    // Supprimer l'utilisateur (les flashcards seront supprimées en cascade)
    await req.user.destroy();

    res.json({ message: 'Compte supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression compte:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du compte' });
  }
});

// Statistiques d'utilisation
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const stats = {
      totalFlashcards: req.user.flashcardCount,
      premiumStatus: req.user.isPremiumActive,
      premiumUntil: req.user.premiumUntil,
      accountAge: Math.floor((Date.now() - new Date(req.user.createdAt)) / (1000 * 60 * 60 * 24)), // jours
      lastLogin: req.user.lastLogin
    };

    res.json(stats);
  } catch (error) {
    console.error('Erreur stats:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

module.exports = router;