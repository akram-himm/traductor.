const express = require('express');
const { body, validationResult } = require('express-validator');
const { Flashcard } = require('../models');
const { auth, isPremium } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Get all flashcards for user
router.get('/', auth, async (req, res) => {
  try {
    const { category, difficulty, dueForReview, limit, offset } = req.query;
    
    // Build where clause
    const where = { userId: req.userId };
    
    if (category) {
      where.category = category;
    }
    
    if (difficulty !== undefined) {
      where.difficulty = parseInt(difficulty);
    }
    
    if (dueForReview === 'true') {
      where.nextReview = {
        [Op.lte]: new Date()
      };
    }

    const flashcards = await Flashcard.findAndCountAll({
      where,
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      flashcards: flashcards.rows,
      total: flashcards.count,
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0
    });
  } catch (error) {
    console.error('Get flashcards error:', error);
    res.status(500).json({ error: 'Error fetching flashcards' });
  }
});

// Get single flashcard
router.get('/:id', auth, async (req, res) => {
  try {
    const flashcard = await Flashcard.findOne({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!flashcard) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    res.json(flashcard);
  } catch (error) {
    console.error('Get flashcard error:', error);
    res.status(500).json({ error: 'Error fetching flashcard' });
  }
});

// Create new flashcard
router.post('/', auth, [
  body('front').notEmpty().trim(),
  body('back').notEmpty().trim(),
  body('category').optional().trim(),
  body('difficulty').optional().isInt({ min: 0, max: 5 })
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check flashcard limit for free users
    if (!req.user.isPremium) {
      const count = await Flashcard.count({ where: { userId: req.userId } });
      if (count >= 50) {
        return res.status(403).json({ 
          error: 'Free users are limited to 50 flashcards. Upgrade to premium for unlimited flashcards.' 
        });
      }
    }

    const { front, back, category, difficulty } = req.body;

    const flashcard = await Flashcard.create({
      userId: req.userId,
      front,
      back,
      category: category || 'General',
      difficulty: difficulty || 0
    });

    res.status(201).json({
      message: 'Flashcard created successfully',
      flashcard
    });
  } catch (error) {
    console.error('Create flashcard error:', error);
    res.status(500).json({ error: 'Error creating flashcard' });
  }
});

// Update flashcard
router.put('/:id', auth, [
  body('front').optional().notEmpty().trim(),
  body('back').optional().notEmpty().trim(),
  body('category').optional().trim(),
  body('difficulty').optional().isInt({ min: 0, max: 5 })
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const flashcard = await Flashcard.findOne({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!flashcard) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    const { front, back, category, difficulty } = req.body;
    const updates = {};
    
    if (front) updates.front = front;
    if (back) updates.back = back;
    if (category) updates.category = category;
    if (difficulty !== undefined) updates.difficulty = difficulty;

    await flashcard.update(updates);

    res.json({
      message: 'Flashcard updated successfully',
      flashcard
    });
  } catch (error) {
    console.error('Update flashcard error:', error);
    res.status(500).json({ error: 'Error updating flashcard' });
  }
});

// Delete flashcard
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await Flashcard.destroy({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (result === 0) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    res.json({ message: 'Flashcard deleted successfully' });
  } catch (error) {
    console.error('Delete flashcard error:', error);
    res.status(500).json({ error: 'Error deleting flashcard' });
  }
});

// Bulk create flashcards (premium feature)
router.post('/bulk', [auth, isPremium], [
  body('flashcards').isArray({ min: 1, max: 100 }),
  body('flashcards.*.front').notEmpty().trim(),
  body('flashcards.*.back').notEmpty().trim(),
  body('flashcards.*.category').optional().trim(),
  body('flashcards.*.difficulty').optional().isInt({ min: 0, max: 5 })
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { flashcards } = req.body;

    // Add userId to each flashcard
    const flashcardsWithUser = flashcards.map(fc => ({
      ...fc,
      userId: req.userId,
      category: fc.category || 'General',
      difficulty: fc.difficulty || 0
    }));

    const createdFlashcards = await Flashcard.bulkCreate(flashcardsWithUser);

    res.status(201).json({
      message: `${createdFlashcards.length} flashcards created successfully`,
      flashcards: createdFlashcards
    });
  } catch (error) {
    console.error('Bulk create error:', error);
    res.status(500).json({ error: 'Error creating flashcards' });
  }
});

// Bulk delete flashcards
router.delete('/bulk', auth, [
  body('ids').isArray({ min: 1 })
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ids } = req.body;

    const result = await Flashcard.destroy({
      where: {
        id: { [Op.in]: ids },
        userId: req.userId
      }
    });

    res.json({ 
      message: `${result} flashcards deleted successfully` 
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Error deleting flashcards' });
  }
});

// Review flashcard (update with performance)
router.post('/:id/review', auth, [
  body('performance').isIn(['easy', 'medium', 'hard'])
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const flashcard = await Flashcard.findOne({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!flashcard) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    const { performance } = req.body;

    // Update review data using instance method
    flashcard.calculateNextReview(performance);
    await flashcard.save();

    res.json({
      message: 'Review recorded successfully',
      flashcard
    });
  } catch (error) {
    console.error('Review flashcard error:', error);
    res.status(500).json({ error: 'Error recording review' });
  }
});

// Get flashcards by category
router.get('/categories/list', auth, async (req, res) => {
  try {
    const categories = await Flashcard.findAll({
      where: { userId: req.userId },
      attributes: ['category'],
      group: ['category'],
      raw: true
    });

    const categoryList = categories.map(c => c.category);

    res.json(categoryList);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Error fetching categories' });
  }
});

module.exports = router;