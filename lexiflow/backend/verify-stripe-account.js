require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

console.log('🔍 Vérification du compte Stripe...\n');

async function verify() {
  try {
    // 1. Vérifier le compte
    const account = await stripe.accounts.retrieve();
    console.log('✅ Compte:', account.email);
    console.log('✅ ID du compte:', account.id);
    
    // 2. Vérifier si les price IDs existent
    console.log('\n🔍 Vérification des Price IDs...');
    
    try {
      const monthlyPrice = await stripe.prices.retrieve(process.env.STRIPE_MONTHLY_PRICE_ID);
      console.log('✅ Prix mensuel trouvé:', monthlyPrice.id);
      console.log('   Montant:', monthlyPrice.unit_amount/100 + ' ' + monthlyPrice.currency.toUpperCase());
    } catch (error) {
      console.log('❌ Prix mensuel NON TROUVÉ!');
      console.log('   ID recherché:', process.env.STRIPE_MONTHLY_PRICE_ID);
    }
    
    try {
      const yearlyPrice = await stripe.prices.retrieve(process.env.STRIPE_YEARLY_PRICE_ID);
      console.log('✅ Prix annuel trouvé:', yearlyPrice.id);
      console.log('   Montant:', yearlyPrice.unit_amount/100 + ' ' + yearlyPrice.currency.toUpperCase());
    } catch (error) {
      console.log('❌ Prix annuel NON TROUVÉ!');
      console.log('   ID recherché:', process.env.STRIPE_YEARLY_PRICE_ID);
    }
    
    console.log('\n💡 Si les prix ne sont pas trouvés :');
    console.log('1. Vérifiez que vous utilisez VOTRE clé secrète Stripe');
    console.log('2. Vérifiez que les price IDs sont de VOTRE compte');
    console.log('3. Assurez-vous d\'être en mode TEST dans Stripe');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

verify();