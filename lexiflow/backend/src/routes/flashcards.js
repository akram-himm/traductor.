const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Flashcard = require('../models/Flashcard');

// Obtenir toutes les flashcards de l'utilisateur
router.get('/', authMiddleware, async (req, res) => {
  try {
    const flashcards = await Flashcard.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      flashcards,
      count: flashcards.length,
      limit: req.user.getFlashcardLimit()
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des flashcards' });
  }
});

// Créer une flashcard
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { front, back, language } = req.body;
    
    // Vérifier la limite
    const currentCount = await Flashcard.count({
      where: { userId: req.user.id }
    });
    
    const limit = req.user.getFlashcardLimit();
    
    if (currentCount >= limit) {
      return res.status(403).json({
        error: `Limite atteinte ! Vous avez ${currentCount}/${limit} flashcards.`,
        needPremium: !req.user.checkPremiumStatus()
      });
    }
    
    // Créer la flashcard
    const flashcard = await Flashcard.create({
      userId: req.user.id,
      front,
      back,
      language
    });
    
    // Mettre à jour le compteur
    await req.user.update({ flashcardCount: currentCount + 1 });
    
    res.status(201).json({
      flashcard,
      count: currentCount + 1,
      limit
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création de la flashcard' });
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
    
    // Mettre à jour le compteur
    const newCount = await Flashcard.count({
      where: { userId: req.user.id }
    });
    await req.user.update({ flashcardCount: newCount });
    
    res.json({ message: 'Flashcard supprimée', count: newCount });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

module.exports = router;
