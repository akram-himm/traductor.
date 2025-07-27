const express = require('express');
const { stripe } = require('./src/config/stripe');

const app = express();

// Webhook handler
app.post('/api/subscription/webhook', 
  express.raw({type: 'application/json'}),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      console.log(`✅ Webhook reçu: ${event.type}`);
      
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;
          console.log('💳 Paiement réussi!');
          console.log('- Customer:', session.customer);
          console.log('- Subscription:', session.subscription);
          console.log('- Amount:', session.amount_total/100, session.currency.toUpperCase());
          break;
          
        case 'customer.subscription.updated':
          console.log('🔄 Abonnement mis à jour');
          break;
          
        case 'customer.subscription.deleted':
          console.log('❌ Abonnement annulé');
          break;
          
        default:
          console.log(`➡️ Événement non géré: ${event.type}`);
      }
      
      res.json({received: true});
    } catch (err) {
      console.error('❌ Erreur webhook:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Test webhook lancé sur http://localhost:${PORT}`);
  console.log('\n📋 Pour tester:');
  console.log('1. Installez Stripe CLI: https://stripe.com/docs/stripe-cli');
  console.log('2. Lancez: stripe listen --forward-to localhost:3001/api/subscription/webhook');
  console.log('3. Dans un autre terminal: stripe trigger checkout.session.completed');
  console.log('\n🔗 Ou utilisez l\'URL de checkout créée par test-stripe.js');
});