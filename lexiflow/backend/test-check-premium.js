// Script pour vérifier le statut premium d'un utilisateur
require('dotenv').config();
const { sequelize } = require('./src/config/database');
const User = require('./src/models/User');

console.log('🔍 VÉRIFICATION DU STATUT PREMIUM');
console.log('==================================\n');

async function checkUserPremiumStatus(email) {
  try {
    // Connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie\n');

    // Rechercher l'utilisateur
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log(`❌ Utilisateur non trouvé : ${email}`);
      return;
    }

    console.log('👤 Utilisateur trouvé !');
    console.log('═══════════════════════════════════════');
    console.log(`📧 Email : ${user.email}`);
    console.log(`🆔 ID : ${user.id}`);
    console.log(`✅ Email vérifié : ${user.emailVerified ? 'Oui' : 'Non'}`);
    console.log('\n💎 STATUT PREMIUM :');
    console.log(`   Premium : ${user.isPremium ? '✅ OUI' : '❌ NON'}`);
    console.log(`   Status : ${user.subscriptionStatus || 'free'}`);
    console.log(`   Plan : ${user.subscriptionPlan || 'aucun'}`);

    if (user.premiumUntil) {
      const expiry = new Date(user.premiumUntil);
      const now = new Date();
      const daysLeft = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
      console.log(`   Expire : ${expiry.toLocaleDateString()} (${daysLeft} jours)`);
    }

    if (user.stripeCustomerId) {
      console.log(`\n💳 STRIPE :`);
      console.log(`   Customer ID : ${user.stripeCustomerId}`);
    }

    // Vérifier le statut premium effectif
    const isPremiumActive = user.checkPremiumStatus();
    console.log(`\n🔍 Premium actif (méthode) : ${isPremiumActive ? '✅ OUI' : '❌ NON'}`);

    console.log('\n📋 SOLUTION SI PAS PREMIUM :');
    console.log('1. Configurez les webhooks Stripe (voir GUIDE_STRIPE_WEBHOOKS.md)');
    console.log('2. Vérifiez que STRIPE_WEBHOOK_SECRET est correct sur Render');
    console.log('3. Testez avec un nouveau paiement');

  } catch (error) {
    console.error('❌ Erreur :', error.message);
    console.error('Vérifiez DATABASE_URL dans .env');
  } finally {
    await sequelize.close();
  }
}

// Configuration
const EMAIL_TO_CHECK = process.argv[2] || 'lexiflow.contact@gmail.com';

console.log(`Vérification de : ${EMAIL_TO_CHECK}\n`);
checkUserPremiumStatus(EMAIL_TO_CHECK);

console.log('\n💡 Usage : node test-check-premium.js [email]');
console.log('Exemple : node test-check-premium.js user@example.com');