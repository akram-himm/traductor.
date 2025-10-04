require('dotenv').config();
const { sequelize } = require('../config/database');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Flashcard = require('../models/Flashcard');

async function checkNewUser(email) {
  try {
    console.log('🔍 Vérification du nouvel utilisateur:', email);
    
    // 1. Vérifier l'utilisateur
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }
    
    console.log('\n✅ Utilisateur trouvé:');
    console.log({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      isPremium: user.isPremium,
      subscriptionPlan: user.subscriptionPlan,
      createdAt: user.createdAt,
      flashcardCount: user.flashcardCount
    });
    
    // 2. Vérifier les subscriptions
    const subscriptions = await Subscription.findAll({
      where: { userId: user.id }
    });
    
    console.log(`\n📊 Subscriptions: ${subscriptions.length}`);
    subscriptions.forEach(sub => {
      console.log({
        id: sub.id,
        status: sub.status,
        plan: sub.stripePriceId
      });
    });
    
    // 3. Vérifier les flashcards
    const flashcards = await Flashcard.findAll({
      where: { userId: user.id },
      limit: 5
    });
    
    console.log(`\n🎴 Flashcards: ${flashcards.length}`);
    flashcards.forEach(card => {
      console.log(`- "${card.front}" → "${card.back}"`);
    });
    
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await sequelize.close();
  }
}

// Exécuter
const email = process.argv[2];
if (!email) {
  console.log('Usage: node check-new-user.js <email>');
  process.exit(1);
}

checkNewUser(email);