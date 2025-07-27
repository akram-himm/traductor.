const Stripe = require('stripe');
require('dotenv').config({ path: '../.env' });

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51RpOQL2VEl7gdPoz3lOWEeSUKheSiuUy1RurdWypcJxaRWrM7PniDAxdGhFiOMsyCDViIMoFGxNIl2JVDLADCNrM00nZgcyIfH');

async function verifyStripeConfig() {
  console.log('🔍 Vérification de la configuration Stripe...\n');
  
  try {
    // Vérifier le compte Stripe
    const account = await stripe.accounts.retrieve();
    console.log('✅ Compte Stripe:', account.email || account.id);
    console.log('   Mode:', process.env.STRIPE_SECRET_KEY?.includes('sk_live') ? 'PRODUCTION' : 'TEST');
    
    // Price IDs dans le code
    const priceIds = {
      monthly: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_1RpQMQ2VEl7gdPozfYJSzL6B',
      yearly: process.env.STRIPE_YEARLY_PRICE_ID || 'price_1RpQMQ2VEl7gdPoz3JtfaNEk'
    };
    
    console.log('\n📋 Price IDs configurés:');
    console.log('   Mensuel:', priceIds.monthly);
    console.log('   Annuel:', priceIds.yearly);
    
    // Vérifier chaque Price ID
    console.log('\n🔍 Vérification des Price IDs...');
    
    for (const [type, priceId] of Object.entries(priceIds)) {
      try {
        const price = await stripe.prices.retrieve(priceId);
        const product = await stripe.products.retrieve(price.product);
        
        console.log(`\n✅ ${type.toUpperCase()} (${priceId}):`);
        console.log(`   Produit: ${product.name}`);
        console.log(`   Montant: ${price.unit_amount / 100} ${price.currency.toUpperCase()}`);
        console.log(`   Intervalle: ${price.recurring?.interval || 'une fois'}`);
        console.log(`   Actif: ${price.active ? 'Oui' : 'Non'}`);
      } catch (error) {
        console.log(`\n❌ ${type.toUpperCase()} (${priceId}):`);
        console.log(`   Erreur: ${error.message}`);
      }
    }
    
    // Lister tous les prix disponibles
    console.log('\n📋 Tous les prix disponibles sur ce compte:');
    const prices = await stripe.prices.list({ limit: 10, active: true });
    
    for (const price of prices.data) {
      const product = await stripe.products.retrieve(price.product);
      console.log(`\n   - ${price.id}`);
      console.log(`     Produit: ${product.name}`);
      console.log(`     Montant: ${price.unit_amount / 100} ${price.currency.toUpperCase()}`);
      console.log(`     Intervalle: ${price.recurring?.interval || 'une fois'}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

verifyStripeConfig();