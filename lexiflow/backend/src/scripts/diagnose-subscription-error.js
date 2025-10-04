require('dotenv').config();
const { sequelize } = require('../config/database');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { stripe, PRICES } = require('../config/stripe');

// Charger les associations
require('../models/associations');

async function diagnoseSubscriptionError(userEmail) {
  try {
    console.log('🔍 Diagnostic de l\'erreur de création de subscription pour:', userEmail);
    
    // 1. Vérifier la connexion DB
    await sequelize.authenticate();
    console.log('✅ Connexion DB réussie');
    
    // 2. Trouver l'utilisateur
    const user = await User.findOne({ where: { email: userEmail } });
    if (!user) {
      console.error('❌ Utilisateur non trouvé');
      return;
    }
    
    console.log('✅ Utilisateur trouvé:', {
      id: user.id,
      email: user.email,
      stripeCustomerId: user.stripeCustomerId,
      isPremium: user.isPremium,
      subscriptionPlan: user.subscriptionPlan
    });
    
    // 3. Vérifier les souscriptions dans la DB
    const dbSubs = await Subscription.findAll({
      where: { userId: user.id },
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`\n📊 ${dbSubs.length} souscriptions dans la DB:`);
    dbSubs.forEach(sub => {
      console.log({
        id: sub.id,
        status: sub.status,
        stripeId: sub.stripeSubscriptionId,
        priceId: sub.stripePriceId,
        createdAt: sub.createdAt
      });
    });
    
    // 4. Vérifier avec Stripe
    if (user.stripeCustomerId) {
      console.log('\n🔍 Vérification Stripe...');
      
      try {
        const stripeSubs = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          limit: 100
        });
        
        console.log(`\n💳 ${stripeSubs.data.length} souscriptions Stripe:`);
        stripeSubs.data.forEach(sub => {
          console.log({
            id: sub.id,
            status: sub.status,
            priceId: sub.items.data[0].price.id,
            interval: sub.items.data[0].price.recurring.interval,
            created: new Date(sub.created * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end
          });
        });
        
        // 5. Vérifier les incohérences
        console.log('\n🔍 Analyse des incohérences:');
        
        // Souscriptions Stripe sans correspondance DB
        const stripeIds = stripeSubs.data.map(s => s.id);
        const dbIds = dbSubs.map(s => s.stripeSubscriptionId);
        const missingInDb = stripeIds.filter(id => !dbIds.includes(id));
        
        if (missingInDb.length > 0) {
          console.log(`\n⚠️ ${missingInDb.length} souscriptions Stripe sans correspondance DB:`, missingInDb);
          
          // Essayer de créer la souscription manquante
          const activeSub = stripeSubs.data.find(s => s.status === 'active' && missingInDb.includes(s.id));
          if (activeSub) {
            console.log('\n🔧 Tentative de création de la souscription active manquante...');
            
            try {
              const newSub = await Subscription.create({
                userId: user.id,
                stripeCustomerId: user.stripeCustomerId,
                stripeSubscriptionId: activeSub.id,
                stripePriceId: activeSub.items.data[0].price.id,
                status: activeSub.status,
                currentPeriodStart: new Date(activeSub.current_period_start * 1000),
                currentPeriodEnd: new Date(activeSub.current_period_end * 1000),
                cancelAtPeriodEnd: activeSub.cancel_at_period_end || false
              });
              console.log('✅ Souscription créée avec succès:', newSub.id);
            } catch (createError) {
              console.error('❌ Erreur création:', createError.message);
              console.error('Détails:', createError);
            }
          }
        }
        
      } catch (stripeError) {
        console.error('❌ Erreur Stripe:', stripeError.message);
      }
    } else {
      console.log('⚠️ Pas de Stripe customer ID');
    }
    
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
  } finally {
    await sequelize.close();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node diagnose-subscription-error.js <email>');
    process.exit(1);
  }
  diagnoseSubscriptionError(email);
}

module.exports = diagnoseSubscriptionError;