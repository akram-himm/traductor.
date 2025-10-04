const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const User = require('../models/User');
// Utiliser le service email principal (Brevo configuré)
const emailService = require('../utils/email');

// Demander un reset de mot de passe
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Ne pas révéler si l'email existe ou non (sécurité)
      return res.json({ 
        message: 'Si cet email existe, vous recevrez un lien de réinitialisation.' 
      });
    }
    
    // Générer un token unique
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 heure
    
    // Sauvegarder le token hashé dans la base
    await user.update({
      resetPasswordToken: crypto.createHash('sha256').update(resetToken).digest('hex'),
      resetPasswordExpires: resetTokenExpiry
    });
    
    // Envoyer l'email en arrière-plan (non-bloquant)
    emailService.sendPasswordResetEmail(user, resetToken)
      .then(() => {
        console.log('✅ Email de récupération envoyé à:', user.email);
      })
      .catch((emailError) => {
        console.error('❌ Erreur envoi email:', emailError.message);
        // Log plus détaillé pour déboguer
        console.error('   Host:', process.env.EMAIL_HOST);
        console.error('   User:', process.env.EMAIL_USER);
        console.error('   Pass défini:', !!process.env.EMAIL_PASS);
      });

    // Ne pas attendre l'email, répondre immédiatement
    
    res.json({ 
      message: 'Si cet email existe, vous recevrez un lien de réinitialisation.' 
    });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email' });
  }
});

// Réinitialiser le mot de passe avec le token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    
    // Valider le mot de passe
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Le mot de passe doit contenir au moins 6 caractères' 
      });
    }
    
    // Hasher le token reçu
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // Trouver l'utilisateur avec ce token valide
    const user = await User.findOne({
      where: {
        email,
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { [Op.gt]: new Date() } // Token non expiré
      }
    });
    
    if (!user) {
      return res.status(400).json({ 
        error: 'Token invalide ou expiré' 
      });
    }
    
    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Mettre à jour le mot de passe et supprimer le token
    await user.update({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });
    
    res.json({ message: 'Mot de passe réinitialisé avec succès' });
    
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation' });
  }
});

module.exports = router;