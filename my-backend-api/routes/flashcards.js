const express = require('express');
const { body, validationResult } = require('express-validator');
const { Flashcard } = require('../models');
const { authMiddleware, requirePremium } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Validation des flashcards
const validateFlashcard = [
  body('front').notEmpty().trim(),
  body('back').notEmpty().trim(),
  body('fromLang').isLength({ min: 2, max: 5 }),
  body('toLang').isLength({ min: 2, max: 5 }),
  body('folder').optional().isString()
];

// Récupérer toutes les flashcards de l'utilisateur
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { folder, limit = 200, offset = 0 } = req.query;
    
    // Limites pour les utilisateurs gratuits
    const maxCards = req.user.isPremiumActive ? 200 : 50;
    
    const where = { userId: req.user.id };
    if (folder) where.folder = folder;
    
    const flashcards = await Flashcard.findAll({
      where,
      limit: Math.min(limit, maxCards),
      offset,
      order: [['createdAt', 'DESC']]
    });
    
    const count = await Flashcard.count({ where });
    
    res.json({
      flashcards,
      count,
      limit: maxCards,
      isPremium: req.user.isPremiumActive
    });
  } catch (error) {
    console.error('Erreur récupération flashcards:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des flashcards' });
  }
});

// Créer une nouvelle flashcard
router.post('/', authMiddleware, validateFlashcard, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Vérifier la limite pour les utilisateurs gratuits
    const currentCount = await Flashcard.count({
      where: { userId: req.user.id }
    });
    
    const maxCards = req.user.isPremiumActive ? 200 : 50;
    if (currentCount >= maxCards) {
      return res.status(403).json({
        error: `Limite de ${maxCards} flashcards atteinte`,
        upgradeUrl: '/api/subscription/plans'
      });
    }
    
    const flashcard = await Flashcard.create({
      ...req.body,
      userId: req.user.id,
      syncId: `${req.user.id}_${Date.now()}`
    });
    
    // Mettre à jour le compteur
    await req.user.increment('flashcardCount');
    
    res.status(201).json({
      message: 'Flashcard créée avec succès',
      flashcard
    });
  } catch (error) {
    console.error('Erreur création flashcard:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la flashcard' });
  }
});

// Synchroniser les flashcards (Premium uniquement)
router.post('/sync', authMiddleware, requirePremium, async (req, res) => {
  try {
    const { flashcards, lastSync } = req.body;
    
    if (!Array.isArray(flashcards)) {
      return res.status(400).json({ error: 'Format de données invalide' });
    }
    
    const results = {
      created: 0,
      updated: 0,
      conflicts: []
    };
    
    for (const card of flashcards) {
      if (!card.syncId) continue;
      
      const existing = await Flashcard.findOne({
        where: {
          syncId: card.syncId,
          userId: req.user.id
        }
      });
      
      if (!existing) {
        // Nouvelle carte
        await Flashcard.create({
          ...card,
          userId: req.user.id
        });
        results.created++;
      } else if (existing.syncVersion < card.syncVersion) {
        // Mise à jour
        await existing.update({
          ...card,
          syncVersion: card.syncVersion,
          lastSynced: new Date()
        });
        results.updated++;
      } else if (existing.syncVersion > card.syncVersion) {
        // Conflit - la version serveur est plus récente
        results.conflicts.push({
          syncId: card.syncId,
          serverVersion: existing
        });
      }
    }
    
    // Récupérer les nouvelles cartes depuis lastSync
    const newCards = lastSync ? await Flashcard.findAll({
      where: {
        userId: req.user.id,
        lastSynced: {
          [Op.gt]: new Date(lastSync)
        }
      }
    }) : [];
    
    res.json({
      results,
      newCards,
      serverTime: new Date()
    });
  } catch (error) {
    console.error('Erreur sync:', error);
    res.status(500).json({ error: 'Erreur lors de la synchronisation' });
  }
});

// Mettre à jour une flashcard
router.put('/:id', authMiddleware, validateFlashcard, async (req, res) => {
  try {
    const flashcard = await Flashcard.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!flashcard) {
      return res.status(404).json({ error: 'Flashcard non trouvée' });
    }
    
    await flashcard.update({
      ...req.body,
      syncVersion: flashcard.syncVersion + 1,
      lastSynced: new Date()
    });
    
    res.json({
      message: 'Flashcard mise à jour',
      flashcard
    });
  } catch (error) {
    console.error('Erreur mise à jour:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

// Supprimer une flashcard
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const flashcard = await Flashcard.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!flashcard) {
      return res.status(404).json({ error: 'Flashcard non trouvée' });
    }
    
    await flashcard.destroy();
    await req.user.decrement('flashcardCount');
    
    res.json({ message: 'Flashcard supprimée' });
  } catch (error) {
    console.error('Erreur suppression:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// Supprimer toutes les flashcards
router.delete('/', authMiddleware, async (req, res) => {
  try {
    const count = await Flashcard.destroy({
      where: { userId: req.user.id }
    });
    
    await req.user.update({ flashcardCount: 0 });
    
    res.json({ 
      message: `${count} flashcards supprimées` 
    });
  } catch (error) {
    console.error('Erreur suppression totale:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

module.exports = router;