// Script pour synchroniser les champs subscription avec la base de données existante
const { sequelize } = require('../config/database');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { PRICES } = require('../config/stripe');

async function syncSubscriptionFields() {
  try {
    console.log('🔄 Starting subscription fields synchronization...');
    
    // Synchroniser le modèle User avec la base de données
    await User.sync({ alter: true });
    console.log('✅ User model synchronized');
    
    // Trouver tous les utilisateurs Premium sans plan défini
    const premiumUsers = await User.findAll({
      where: {
        isPremium: true,
        subscriptionPlan: null
      }
    });
    
    console.log(`📊 Found ${premiumUsers.length} premium users without subscription plan`);
    
    // Pour chaque utilisateur, essayer de trouver son abonnement
    for (const user of premiumUsers) {
      const subscription = await Subscription.findOne({
        where: {
          userId: user.id,
          status: 'active'
        }
      });
      
      if (subscription) {
        // Déterminer le type de plan basé sur le price ID
        let subscriptionPlan = 'monthly';
        
        if (subscription.stripePriceId === PRICES.yearly) {
          subscriptionPlan = 'yearly';
        } else if (subscription.stripePriceId === PRICES.monthly) {
          subscriptionPlan = 'monthly';
        }
        
        await user.update({
          subscriptionPlan: subscriptionPlan,
          subscriptionStatus: 'premium'
        });
        
        console.log(`✅ Updated user ${user.email} - Plan: ${subscriptionPlan}`);
      } else {
        // Si pas de subscription active, mettre monthly par défaut
        await user.update({
          subscriptionPlan: 'monthly',
          subscriptionStatus: 'premium'
        });
        
        console.log(`⚠️  User ${user.email} has no active subscription - Set to monthly by default`);
      }
    }
    
    console.log('✅ Subscription fields synchronization completed!');
    
  } catch (error) {
    console.error('❌ Error during synchronization:', error);
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script
syncSubscriptionFields();