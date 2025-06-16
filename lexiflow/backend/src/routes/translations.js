const express = require('express');
const authMiddleware = require('../middleware/auth');
const premiumMiddleware = require('../middleware/premium');
const router = express.Router();

// POST /api/translate
router.post('/translate', authMiddleware, (req, res) => {
  const { text } = req.body;

  if (!text || text.length < 1) {
    return res.status(400).json({ error: 'Text is required for translation.' });
  }

  const charLimit = req.user.isPremium ? 350 : 100;

  if (text.length > charLimit) {
    return res.status(400).json({ error: `Text exceeds the character limit of ${charLimit}.` });
  }

  // Mock translation logic
  const translatedText = text.split('').reverse().join('');

  res.json({ success: true, translatedText });
});

// GET /api/translate/history
router.get('/translate/history', authMiddleware, (req, res) => {
  // Mock history retrieval
  const history = [
    { id: 1, text: 'Hello', translatedText: 'olleH' },
    { id: 2, text: 'World', translatedText: 'dlroW' }
  ];

  res.json({ success: true, history });
});

// POST /api/translate/deepseek
router.post('/translate/deepseek', authMiddleware, premiumMiddleware, (req, res) => {
  const { text } = req.body;

  if (!text || text.length < 1) {
    return res.status(400).json({ error: 'Text is required for DeepSeek translation.' });
  }

  // Mock DeepSeek translation logic
  const deepSeekTranslation = `DeepSeek: ${text}`;

  res.json({ success: true, deepSeekTranslation });
});

module.exports = router;
