require('dotenv').config();
const { stripe, PRICES } = require('./src/config/stripe');

console.log('🧪 Test direct de l\'intégration Stripe\n');

async function testStripeDirect() {
  try {
    // 1. Vérifier la connexion Stripe
    console.log('1️⃣ Vérification de la connexion Stripe...');
    const account = await stripe.accounts.retrieve();
    console.log('✅ Connecté au compte:', account.email);
    console.log('✅ Mode:', account.charges_enabled ? 'LIVE' : 'TEST');
    
    // 2. Créer un client de test
    console.log('\n2️⃣ Création d\'un client de test...');
    const customer = await stripe.customers.create({
      email: 'test-stripe@lexiflow.com',
      name: 'Test User',
      metadata: {
        userId: 'test-user-123'
      }
    });
    console.log('✅ Client créé:', customer.id);
    
    // 3. Créer une session de checkout
    console.log('\n3️⃣ Création d\'une session de paiement...');
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: PRICES.monthly,
        quantity: 1
      }],
      success_url: 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/cancel',
      metadata: {
        userId: 'test-user-123'
      },
      subscription_data: {
        trial_period_days: 7
      }
    });
    
    console.log('✅ Session créée avec succès!');
    console.log('🆔 Session ID:', session.id);
    console.log('🔗 URL de paiement:', session.url);
    
    // 4. Simuler la récupération d'une subscription
    console.log('\n4️⃣ Test de récupération d\'abonnement...');
    console.log('   (En production, ceci se ferait après le paiement via webhook)');
    
    // 5. Créer une session de portail client
    console.log('\n5️⃣ Création d\'une session de portail client...');
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: 'http://localhost:3000/account',
    });
    console.log('✅ Portail client créé:', portalSession.url);
    
    console.log('\n✨ RÉSUMÉ DES TESTS:');
    console.log('- ✅ Connexion Stripe OK');
    console.log('- ✅ Création de client OK');
    console.log('- ✅ Session de checkout OK');
    console.log('- ✅ Portail client OK');
    console.log('\n💡 PROCHAINES ÉTAPES:');
    console.log('1. Ouvrez l\'URL de paiement ci-dessus');
    console.log('2. Utilisez la carte de test: 4242 4242 4242 4242');
    console.log('3. Les webhooks recevront automatiquement les événements');
    console.log('4. L\'utilisateur sera marqué comme Premium dans la base de données');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.type === 'StripeInvalidRequestError') {
      console.error('   Détails:', error.raw.message);
    }
  }
}

testStripeDirect();