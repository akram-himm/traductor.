const { sequelize } = require('./database');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Flashcard = require('../models/Flashcard');

async function initDatabase() {
  try {
    console.log('🔄 Initializing database...');
    
    // Synchroniser les modèles avec la base de données
    // alter: true permet d'ajouter les colonnes manquantes sans supprimer les données
    await sequelize.sync({ alter: true });
    
    console.log('✅ Database models synchronized successfully');
    
    // Vérifier si nous avons des utilisateurs avec isPremium mais sans subscriptionPlan
    const usersToUpdate = await User.findAll({
      where: {
        isPremium: true,
        subscriptionPlan: null
      }
    });
    
    if (usersToUpdate.length > 0) {
      console.log(`📊 Found ${usersToUpdate.length} premium users without subscription plan`);
      
      // Mettre à jour ces utilisateurs
      for (const user of usersToUpdate) {
        // Chercher leur subscription active
        const subscription = await Subscription.findOne({
          where: {
            userId: user.id,
            status: 'active'
          }
        });
        
        if (subscription) {
          const { PRICES } = require('./stripe');
          let plan = 'monthly';
          
          if (subscription.stripePriceId === PRICES.yearly) {
            plan = 'yearly';
          }
          
          await user.update({
            subscriptionPlan: plan,
            subscriptionStatus: 'premium'
          });
          
          console.log(`✅ Updated user ${user.email} - Plan: ${plan}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    // Ne pas faire crash l'application, juste logger l'erreur
  }
}

module.exports = initDatabase;