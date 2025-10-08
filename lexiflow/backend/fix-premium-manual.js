// Script pour mettre à jour manuellement un utilisateur en premium
// Utile pour tester si le problème vient de Stripe ou de la DB

require('dotenv').config();
const { sequelize } = require('./src/config/database');
const User = require('./src/models/User');

console.log('🔧 MISE À JOUR MANUELLE PREMIUM');
console.log('================================\n');

async function upgradeToPremium(email, plan = 'monthly') {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion DB établie\n');

    // Trouver l'utilisateur
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log(`❌ Utilisateur non trouvé: ${email}`);
      return;
    }

    console.log('👤 Utilisateur trouvé:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Premium actuel: ${user.isPremium ? 'OUI' : 'NON'}`);
    console.log(`   Status actuel: ${user.subscriptionStatus || 'free'}\n`);

    // Calculer la date d'expiration
    const premiumUntil = new Date();
    if (plan === 'monthly') {
      premiumUntil.setMonth(premiumUntil.getMonth() + 1);
    } else if (plan === 'yearly') {
      premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);
    }

    // Mettre à jour en premium
    await user.update({
      isPremium: true,
      subscriptionStatus: 'active',
      subscriptionPlan: plan,
      premiumUntil: premiumUntil,
      stripeCustomerId: 'cus_manual_test' // Pour identifier que c'est manuel
    });

    console.log('✅ MISE À JOUR RÉUSSIE !');
    console.log('═══════════════════════════════════');
    console.log(`   Premium: OUI`);
    console.log(`   Plan: ${plan}`);
    console.log(`   Expire: ${premiumUntil.toLocaleDateString()}`);
    console.log(`   Status: active`);

    console.log('\n📝 POUR VÉRIFIER:');
    console.log('1. Reconnectez-vous dans l\'extension');
    console.log('2. Vous devriez voir "Premium" dans le popup');
    console.log('3. Les fonctionnalités premium sont débloquées');

    console.log('\n⚠️  NOTE:');
    console.log('Ceci est une mise à jour manuelle pour tester.');
    console.log('Le problème des webhooks doit quand même être résolu!');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Configuration
const EMAIL = process.argv[2] || 'lexiflow.contact@gmail.com';
const PLAN = process.argv[3] || 'monthly'; // monthly ou yearly

console.log(`Mise à jour de: ${EMAIL}`);
console.log(`Plan: ${PLAN}\n`);

upgradeToPremium(EMAIL, PLAN);

console.log('\n💡 Usage:');
console.log('node fix-premium-manual.js [email] [plan]');
console.log('Exemple: node fix-premium-manual.js user@example.com yearly');