// Route de test pour vérifier l'envoi d'email
const express = require('express');
const router = express.Router();
const emailService = require('../utils/email');
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Test d'envoi d'email simple
router.post('/test-email', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email requis' });
  }

  console.log(`📧 Test email demandé pour: ${email}`);

  // Répondre immédiatement
  res.json({
    message: 'Test en cours. Vérifiez vos emails dans quelques secondes.',
    note: 'Si vous ne recevez rien, vérifiez les SPAMS'
  });

  // Envoyer l'email en arrière-plan
  try {
    const testUser = { email, name: 'Test User' };
    const testToken = 'test-token-123';

    await emailService.sendPasswordResetEmail(testUser, testToken);
    console.log('✅ Email de test envoyé à:', email);
  } catch (error) {
    console.error('❌ Erreur test email:', error.message);
    console.error('Détails:', {
      host: process.env.EMAIL_HOST,
      user: process.env.EMAIL_USER,
      passSet: !!process.env.EMAIL_PASS
    });
  }
});

// Vérifier la configuration email
router.get('/test-email-config', (req, res) => {
  res.json({
    configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    host: process.env.EMAIL_HOST || 'Non configuré',
    user: process.env.EMAIL_USER || 'Non configuré',
    passSet: !!process.env.EMAIL_PASS
  });
});

module.exports = router;