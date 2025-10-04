require('dotenv').config();
const User = require('../src/models/User');
const Subscription = require('../src/models/Subscription');
const { stripe, PRICES } = require('../src/config/stripe');

async function checkSubscriptions() {
  try {
    console.log('🔍 Vérification des souscriptions...\n');
    
    // Trouver l'utilisateur
    const user = await User.findOne({
      where: { email: 'akramhimmich00@gmail.com' }
    });
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }
    
    console.log('👤 Utilisateur trouvé:');
    console.log('  - ID:', user.id);
    console.log('  - Email:', user.email);
    console.log('  - Premium:', user.isPremium);
    console.log('  - Plan:', user.subscriptionPlan);
    console.log('  - Stripe Customer ID:', user.stripeCustomerId);
    console.log('\n');
    
    // Chercher toutes les souscriptions
    const subscriptions = await Subscription.findAll({
      where: { userId: user.id },
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`📊 ${subscriptions.length} souscription(s) trouvée(s):\n`);
    
    subscriptions.forEach((sub, index) => {
      console.log(`Souscription ${index + 1}:`);
      console.log('  - ID:', sub.id);
      console.log('  - Status:', sub.status);
      console.log('  - Stripe Sub ID:', sub.stripeSubscriptionId);
      console.log('  - Price ID:', sub.stripePriceId);
      console.log('  - Created:', sub.createdAt);
      console.log('  - Cancel at period end:', sub.cancelAtPeriodEnd);
      
      // Déterminer le type de plan
      let planType = 'Unknown';
      if (sub.stripePriceId === PRICES.yearly) {
        planType = 'YEARLY';
      } else if (sub.stripePriceId === PRICES.monthly) {
        planType = 'MONTHLY';
      }
      console.log('  - Plan Type:', planType);
      console.log('---');
    });
    
    // Vérifier avec Stripe si l'utilisateur a un customer ID
    if (user.stripeCustomerId) {
      console.log('\n🔍 Vérification avec Stripe...\n');
      
      try {
        // Lister toutes les souscriptions Stripe pour ce client
        const stripeSubscriptions = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          limit: 10
        });
        
        console.log(`📊 ${stripeSubscriptions.data.length} souscription(s) Stripe trouvée(s):\n`);
        
        stripeSubscriptions.data.forEach((sub, index) => {
          console.log(`Souscription Stripe ${index + 1}:`);
          console.log('  - ID:', sub.id);
          console.log('  - Status:', sub.status);
          console.log('  - Price ID:', sub.items.data[0].price.id);
          console.log('  - Interval:', sub.items.data[0].price.recurring.interval);
          console.log('  - Current period end:', new Date(sub.current_period_end * 1000));
          console.log('  - Cancel at period end:', sub.cancel_at_period_end);
          console.log('---');
        });
        
        // Vérifier s'il y a des souscriptions Stripe actives non présentes dans la DB
        const activeStripeSubs = stripeSubscriptions.data.filter(s => s.status === 'active');
        const dbSubIds = subscriptions.map(s => s.stripeSubscriptionId);
        
        activeStripeSubs.forEach(stripeSub => {
          if (!dbSubIds.includes(stripeSub.id)) {
            console.log(`\n⚠️ ALERTE: Souscription Stripe active non trouvée dans la DB:`);
            console.log(`   - Stripe Sub ID: ${stripeSub.id}`);
            console.log(`   - Devrait être synchronisée!`);
          }
        });
        
      } catch (stripeError) {
        console.log('❌ Erreur Stripe:', stripeError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter le script
checkSubscriptions().then(() => {
  console.log('\n🏁 Vérification terminée');
  process.exit(0);
});