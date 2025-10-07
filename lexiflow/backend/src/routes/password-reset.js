const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../models/User');

// Importer Op depuis sequelize directement
let Op;
try {
  Op = require('sequelize').Op;
  console.log('✅ Op importé depuis sequelize');
} catch (error) {
  console.error('❌ Erreur import Op:', error);
  // Fallback
  Op = require('../config/database').Op;
}

// Utiliser SendGrid en priorité, puis Resend, sinon SMTP
let emailService;
try {
  emailService = process.env.SENDGRID_API_KEY
    ? require('../utils/emailSendGrid')  // SendGrid si la clé existe
    : process.env.RESEND_API_KEY
    ? require('../utils/emailResend')    // Sinon Resend
    : require('../utils/email');          // Sinon SMTP
} catch (error) {
  console.error('❌ Erreur import emailService:', error);
}

// Demander un reset de mot de passe
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Validation du format email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Veuillez fournir une adresse email valide'
      });
    }

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
      .then((info) => {
        console.log('✅ Email de récupération envoyé à:', user.email);
        console.log('   Message ID:', info?.messageId);
        console.log('   Accepted:', info?.accepted);
        console.log('   Response:', info?.response);
      })
      .catch((emailError) => {
        console.error('❌ Erreur envoi email:', emailError.message);
        console.error('   Host:', process.env.EMAIL_HOST);
        console.error('   User:', process.env.EMAIL_USER);
        console.error('   From:', process.env.EMAIL_FROM);
        console.error('   Pass défini:', !!process.env.EMAIL_PASS);
        console.error('   Code erreur:', emailError.code);
        console.error('   Command:', emailError.command);
        console.error('   Response:', emailError.response);
        console.error('   Stack:', emailError.stack);
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

    console.log('=== RESET PASSWORD REQUEST ===');
    console.log('Email:', email);
    console.log('Token reçu:', token);
    console.log('Nouveau mot de passe longueur:', newPassword ? newPassword.length : 0);

    // Valider le mot de passe
    if (!newPassword || newPassword.length < 6) {
      console.log('❌ Mot de passe trop court');
      return res.status(400).json({
        error: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Hasher le token reçu
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    console.log('Token hashé:', hashedToken);
    
    // Trouver l'utilisateur avec ce token valide
    console.log('Recherche utilisateur avec:', {
      email,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: 'doit être > ' + new Date()
    });

    let user;
    try {
      // Vérifier si Op est défini
      if (!Op || !Op.gt) {
        console.error('❌ Op ou Op.gt non défini!');
        throw new Error('Op.gt is not defined');
      }

      user = await User.findOne({
        where: {
          email,
          resetPasswordToken: hashedToken,
          resetPasswordExpires: { [Op.gt]: new Date() } // Token non expiré
        }
      });
    } catch (dbError) {
      console.error('❌ Erreur DB lors de la recherche utilisateur:', dbError);
      console.error('Stack:', dbError.stack);
      throw dbError;
    }

    console.log('Utilisateur trouvé:', user ? 'OUI' : 'NON');
    if (user) {
      console.log('Token expire à:', user.resetPasswordExpires);
    }

    if (!user) {
      console.log('❌ Token invalide ou expiré');
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
    
    console.log('✅ Mot de passe réinitialisé avec succès pour:', email);
    res.json({ message: 'Mot de passe réinitialisé avec succès' });

  } catch (error) {
    console.error('❌ ERREUR RESET PASSWORD:', error);
    console.error('Stack:', error.stack);
    console.error('Message:', error.message);

    // Envoyer plus de détails en développement
    if (process.env.NODE_ENV === 'development') {
      res.status(500).json({
        error: 'Erreur lors de la réinitialisation',
        details: error.message
      });
    } else {
      res.status(500).json({ error: 'Erreur lors de la réinitialisation' });
    }
  }
});

module.exports = router;