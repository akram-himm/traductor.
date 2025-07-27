const cron = require('node-cron');
const { Op } = require('sequelize');
const User = require('../models/User');
const emailService = require('../services/emailService');

// Vérifier les trials qui expirent et envoyer des rappels
const checkTrials = async () => {
  try {
    console.log('🔍 Checking trials...');
    
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);
    
    // 1. Trouver les trials qui expirent dans 3 jours
    const usersExpiringSoon = await User.findAll({
      where: {
        trialEndsAt: {
          [Op.between]: [tomorrow, in3Days]
        },
        emailVerified: true,
        isPremium: false // Pas déjà passé en Premium
      }
    });
    
    // Envoyer les rappels
    for (const user of usersExpiringSoon) {
      const daysLeft = Math.ceil((user.trialEndsAt - now) / (1000 * 60 * 60 * 24));
      console.log(`📧 Sending trial reminder to ${user.email} - ${daysLeft} days left`);
      await emailService.sendTrialEndingReminder(user, daysLeft);
    }
    
    // 2. Désactiver les trials expirés
    const expiredTrials = await User.findAll({
      where: {
        trialEndsAt: {
          [Op.lt]: now
        },
        emailVerified: true,
        isPremium: false
      }
    });
    
    for (const user of expiredTrials) {
      console.log(`⏰ Trial expired for ${user.email}`);
      // Le statut sera automatiquement 'free' grâce à la méthode checkPremiumStatus()
      // Optionnel : envoyer un email "Trial expired, upgrade now"
    }
    
    console.log(`✅ Trial check complete. ${usersExpiringSoon.length} reminders sent, ${expiredTrials.length} trials expired.`);
    
  } catch (error) {
    console.error('❌ Error checking trials:', error);
  }
};

// Planifier la vérification quotidienne à 9h00
const startTrialChecker = () => {
  // Exécuter tous les jours à 9h00
  cron.schedule('0 9 * * *', checkTrials, {
    scheduled: true,
    timezone: "Europe/Paris" // Ajuster selon votre timezone
  });
  
  console.log('📅 Trial checker scheduled - runs daily at 9:00 AM');
  
  // Optionnel : exécuter immédiatement au démarrage pour test
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 Running trial check immediately (dev mode)...');
    checkTrials();
  }
};

module.exports = {
  checkTrials,
  startTrialChecker
};