const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Flashcard = require('../models/Flashcard');

// Fake counter to simulate flashcard creation
let fakeFlashcardCount = 0;

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
    const { front, back, language, sourceLanguage, category, difficulty } = req.body;

    // Vérification des champs requis
    if (!front || !back || !language) {
      return res.status(400).json({ 
        error: 'Les champs front, back et language sont requis' 
      });
    }

    // Vérifier si la flashcard existe déjà
    const existingFlashcard = await Flashcard.findOne({
      where: {
        userId: req.user.id,
        front: front.trim(),
        back: back.trim()
      }
    });

    if (existingFlashcard) {
      return res.status(409).json({
        error: 'Cette flashcard existe déjà',
        flashcard: existingFlashcard
      });
    }

    // Vérifier la limite
    const currentCount = await Flashcard.count({
      where: { userId: req.user.id }
    });
    const limit = req.user.isPremium ? 200 : 50;

    if (currentCount >= limit) {
      return res.status(403).json({
        error: `Limite atteinte ! Vous avez ${currentCount}/${limit} flashcards.`,
        needPremium: true,
        currentCount,
        limit
      });
    }

    // Créer la flashcard dans la base de données
    const flashcard = await Flashcard.create({
      userId: req.user.id,
      front,
      back,
      language,
      sourceLanguage: sourceLanguage || 'auto',
      folder: category || 'default',
      difficulty: difficulty || 'normal'
    });

    // Mettre à jour le compteur de l'utilisateur
    if (req.user && typeof req.user.update === 'function') {
      await req.user.update({ flashcardCount: currentCount + 1 });
    }

    res.status(201).json({
      flashcard: {
        id: flashcard.id,
        front: flashcard.front,
        back: flashcard.back,
        language: flashcard.language,
        sourceLanguage: flashcard.sourceLanguage,
        folder: flashcard.folder,
        difficulty: flashcard.difficulty,
        createdAt: flashcard.createdAt
      },
      count: currentCount + 1,
      limit
    });
  } catch (error) {
    console.error('Erreur création flashcard:', error);
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
    if (req.user && typeof req.user.update === 'function') {
      await req.user.update({ flashcardCount: newCount });
    }
    
    res.json({ message: 'Flashcard supprimée', count: newCount });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

module.exports = router;
