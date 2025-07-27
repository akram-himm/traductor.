require('dotenv').config();
const { stripe, PRICES } = require('./src/config/stripe');

console.log('🧪 Test de configuration Stripe\n');

// Vérifier les variables d'environnement
console.log('✅ Variables d\'environnement :');
console.log('- STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✓ Définie' : '✗ Manquante');
console.log('- STRIPE_PUBLISHABLE_KEY:', process.env.STRIPE_PUBLISHABLE_KEY ? '✓ Définie' : '✗ Manquante');
console.log('- STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? '✓ Définie' : '✗ Manquante');
console.log('- Price IDs:', PRICES.monthly && PRICES.yearly ? '✓ Configurés' : '✗ Manquants');

// Tester la connexion Stripe
async function testStripe() {
  try {
    console.log('\n📋 Test de connexion Stripe...');
    
    // Récupérer les informations du compte
    const account = await stripe.accounts.retrieve();
    console.log('✅ Connecté au compte:', account.email);
    console.log('✅ Mode:', account.charges_enabled ? 'LIVE' : 'TEST');
    
    // Vérifier les produits
    console.log('\n🛍️ Vérification des prix...');
    const monthlyPrice = await stripe.prices.retrieve(PRICES.monthly);
    const yearlyPrice = await stripe.prices.retrieve(PRICES.yearly);
    
    console.log('✅ Prix mensuel:', `$${monthlyPrice.unit_amount / 100}/${monthlyPrice.recurring.interval}`);
    console.log('✅ Prix annuel:', `$${yearlyPrice.unit_amount / 100}/${yearlyPrice.recurring.interval}`);
    
    // Créer une session de test
    console.log('\n🔗 Création d\'une session de paiement test...');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: PRICES.monthly,
        quantity: 1
      }],
      success_url: 'http://localhost:3000/success',
      cancel_url: 'http://localhost:3000/cancel',
    });
    
    console.log('✅ Session créée!');
    console.log('🌐 URL de test:', session.url);
    console.log('\n💳 Pour tester, utilisez la carte: 4242 4242 4242 4242');
    console.log('📅 Date expiration: N\'importe quelle date future');
    console.log('🔢 CVC: N\'importe quel 3 chiffres\n');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.message.includes('No such price')) {
      console.error('→ Les Price IDs ne correspondent pas. Vérifiez dans Stripe Dashboard.');
    }
  }
}

testStripe();