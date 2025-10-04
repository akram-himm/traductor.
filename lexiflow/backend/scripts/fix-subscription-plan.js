require('dotenv').config();
const User = require('../src/models/User');
const Subscription = require('../src/models/Subscription');
const { stripe, PRICES } = require('../src/config/stripe');

async function fixSubscriptionPlan() {
  try {
    console.log('🔍 Recherche des utilisateurs avec souscriptions...');
    
    // Trouver l'utilisateur spécifique
    const user = await User.findOne({
      where: { email: 'akramhimmich00@gmail.com' }
    });
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }
    
    console.log('👤 Utilisateur trouvé:', {
      id: user.id,
      email: user.email,
      subscriptionPlan: user.subscriptionPlan,
      isPremium: user.isPremium
    });
    
    // Chercher sa souscription active
    const subscription = await Subscription.findOne({
      where: {
        userId: user.id,
        status: 'active'
      },
      order: [['createdAt', 'DESC']]
    });
    
    if (!subscription) {
      console.log('❌ Aucune souscription active trouvée');
      return;
    }
    
    console.log('📊 Souscription trouvée:', {
      id: subscription.id,
      stripePriceId: subscription.stripePriceId,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      status: subscription.status
    });
    
    // Vérifier le plan basé sur le price ID
    let correctPlan = 'monthly';
    if (subscription.stripePriceId === PRICES.yearly) {
      correctPlan = 'yearly';
    }
    
    console.log('🎯 Plan correct basé sur le price ID:', correctPlan);
    
    // Si le plan ne correspond pas, mettre à jour
    if (user.subscriptionPlan !== correctPlan) {
      console.log('⚠️ Plan incorrect! Mise à jour de', user.subscriptionPlan, 'vers', correctPlan);
      
      await user.update({
        subscriptionPlan: correctPlan
      });
      
      console.log('✅ Plan mis à jour avec succès!');
    } else {
      console.log('✅ Le plan est déjà correct');
    }
    
    // Optionnel : Vérifier avec Stripe
    if (subscription.stripeSubscriptionId) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
        console.log('🔍 Vérification Stripe:', {
          status: stripeSubscription.status,
          priceId: stripeSubscription.items.data[0].price.id,
          interval: stripeSubscription.items.data[0].price.recurring.interval
        });
      } catch (error) {
        console.log('⚠️ Impossible de vérifier avec Stripe:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter le script
fixSubscriptionPlan().then(() => {
  console.log('🏁 Script terminé');
  process.exit(0);
});