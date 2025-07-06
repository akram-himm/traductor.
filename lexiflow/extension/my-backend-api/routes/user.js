const express = require('express');
const { body, validationResult } = require('express-validator');
const { User, Flashcard } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      include: [
        {
          model: Flashcard,
          as: 'flashcards',
          attributes: ['id', 'category'],
          required: false
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get statistics
    const stats = {
      totalFlashcards: user.flashcards.length,
      categoriesCount: [...new Set(user.flashcards.map(f => f.category))].length,
      memberSince: user.createdAt
    };

    res.json({
      user: user.toJSON(),
      stats
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Error fetching profile' });
  }
});

// Update user profile
router.put('/profile', auth, [
  body('username').optional().trim().isLength({ min: 2 }),
  body('email').optional().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email } = req.body;
    const updates = {};

    if (username) updates.username = username;
    if (email) {
      // Check if email is already taken
      const existingUser = await User.findOne({ 
        where: { email },
        attributes: ['id']
      });
      
      if (existingUser && existingUser.id !== req.userId) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      updates.email = email;
    }

    // Update user
    await User.update(updates, {
      where: { id: req.userId }
    });

    // Get updated user
    const updatedUser = await User.findByPk(req.userId);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser.toJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
});

// Change password
router.put('/password', auth, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findByPk(req.userId);

    // Validate current password
    const isValid = await user.validatePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Error changing password' });
  }
});

// Delete user account
router.delete('/account', auth, [
  body('password').notEmpty()
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password } = req.body;

    // Get user
    const user = await User.findByPk(req.userId);

    // Validate password
    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Delete user (flashcards will be deleted due to CASCADE)
    await user.destroy();

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Error deleting account' });
  }
});

// Get user statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const flashcards = await Flashcard.findAll({
      where: { userId: req.userId },
      attributes: [
        'category',
        'difficulty',
        'reviewCount',
        'successRate',
        'lastReviewed',
        'nextReview'
      ]
    });

    // Calculate statistics
    const stats = {
      totalFlashcards: flashcards.length,
      byCategory: {},
      byDifficulty: {},
      averageSuccessRate: 0,
      totalReviews: 0,
      cardsToReview: 0
    };

    const now = new Date();
    let totalSuccessRate = 0;

    flashcards.forEach(card => {
      // By category
      stats.byCategory[card.category] = (stats.byCategory[card.category] || 0) + 1;
      
      // By difficulty
      stats.byDifficulty[card.difficulty] = (stats.byDifficulty[card.difficulty] || 0) + 1;
      
      // Reviews
      stats.totalReviews += card.reviewCount;
      totalSuccessRate += card.successRate;
      
      // Cards due for review
      if (card.nextReview && new Date(card.nextReview) <= now) {
        stats.cardsToReview++;
      }
    });

    if (flashcards.length > 0) {
      stats.averageSuccessRate = (totalSuccessRate / flashcards.length * 100).toFixed(1);
    }

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Error fetching statistics' });
  }
});

module.exports = router;