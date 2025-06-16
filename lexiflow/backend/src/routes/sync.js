const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const authMiddleware = require('../middleware/auth');
const premiumMiddleware = require('../middleware/premium');
const Flashcard = require('../models/Flashcard');

// Synchroniser les flashcards
router.post('/flashcards', authMiddleware, premiumMiddleware, async (req, res) => {
  try {
    const { flashcards } = req.body;
    const userId = req.user.id;
    
    if (!Array.isArray(flashcards)) {
      return res.status(400).json({
        success: false,
        error: 'Format invalide des flashcards'
      });
    }
    
    // Vérifier la limite
    const currentCount = await Flashcard.count({ where: { userId } });
    const newCount = currentCount + flashcards.length;
    const limit = req.user.isPremium ? 200 : 50;
    
    if (newCount > limit) {
      return res.status(403).json({
        success: false,
        error: `Limite de ${limit} flashcards atteinte`,
        currentCount,
        limit
      });
    }
    
    // Récupérer les IDs existants pour éviter les doublons
    const existingIds = new Set((await Flashcard.findAll({
      where: { userId },
      attributes: ['id']
    })).map(f => f.id));
    
    // Filtrer et préparer les flashcards à créer/mettre à jour
    const toCreate = [];
    const toUpdate = [];
    
    flashcards.forEach(card => {
      const flashcard = {
        ...card,
        userId,
        updatedAt: new Date(card.updatedAt || Date.now())
      };
      
      if (existingIds.has(card.id)) {
        toUpdate.push(flashcard);
      } else {
        toCreate.push(flashcard);
      }
    });
    
    // Créer et mettre à jour en masse
    const created = await Flashcard.bulkCreate(toCreate);
    
    for (const card of toUpdate) {
      await Flashcard.update(card, {
        where: {
          id: card.id,
          userId,
          updatedAt: { [Op.lt]: card.updatedAt }
        }
      });
    }
    
    // Mettre à jour le compteur
    await req.user.update({ flashcardCount: newCount });
    
    res.json({
      success: true,
      created: created.length,
      updated: toUpdate.length,
      currentCount: newCount
    });
    
  } catch (error) {
    console.error('Erreur synchronisation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la synchronisation'
    });
  }
});

// Récupérer toutes les flashcards pour sync
router.get('/flashcards', authMiddleware, premiumMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;
    
    const { rows: flashcards, count } = await Flashcard.findAndCountAll({
      where: { userId: req.user.id },
      limit,
      offset,
      order: [['updatedAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: {
        flashcards,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
    
  } catch (error) {
    console.error('Erreur récupération flashcards:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des flashcards'
    });
  }
});

module.exports = router;
