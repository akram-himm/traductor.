// Test manuel pour vérifier la configuration des webhooks Stripe
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

console.log('🔍 TEST MANUEL DES WEBHOOKS STRIPE');
console.log('===================================\n');

async function testWebhookConfig() {
  try {
    // 1. Vérifier la clé API
    console.log('1️⃣ Vérification de la connexion Stripe...');
    const account = await stripe.accounts.retrieve();
    console.log('✅ Connecté à Stripe:', account.email);
    console.log('   Mode:', process.env.STRIPE_SECRET_KEY.includes('sk_test') ? 'TEST' : 'LIVE');

    // 2. Lister les webhooks endpoints
    console.log('\n2️⃣ Vérification des webhooks...');
    const endpoints = await stripe.webhookEndpoints.list({ limit: 10 });

    if (endpoints.data.length === 0) {
      console.log('❌ AUCUN WEBHOOK CONFIGURÉ !');
      console.log('\n📝 SOLUTION:');
      console.log('1. Allez sur https://dashboard.stripe.com/test/webhooks');
      console.log('2. Cliquez "Add endpoint"');
      console.log('3. URL: https://my-backend-api-cng7.onrender.com/api/subscription/webhook');
      console.log('4. Sélectionnez: checkout.session.completed');
      return;
    }

    console.log(`✅ ${endpoints.data.length} webhook(s) trouvé(s):\n`);

    endpoints.data.forEach((endpoint, index) => {
      console.log(`Webhook ${index + 1}:`);
      console.log(`  URL: ${endpoint.url}`);
      console.log(`  Status: ${endpoint.status}`);
      console.log(`  Events: ${endpoint.enabled_events.join(', ')}`);
      console.log(`  Created: ${new Date(endpoint.created * 1000).toLocaleString()}`);

      // Vérifier si c'est le bon endpoint
      if (endpoint.url.includes('my-backend-api-cng7.onrender.com')) {
        console.log('  ✅ C\'est votre endpoint Render!');

        // Vérifier les events
        if (!endpoint.enabled_events.includes('checkout.session.completed')) {
          console.log('  ⚠️ ATTENTION: checkout.session.completed n\'est pas activé!');
        }

        if (endpoint.status !== 'enabled') {
          console.log('  ⚠️ ATTENTION: Le webhook est désactivé!');
        }
      }
      console.log('');
    });

    // 3. Vérifier la configuration locale
    console.log('3️⃣ Configuration locale:');
    console.log(`STRIPE_WEBHOOK_SECRET: ${process.env.STRIPE_WEBHOOK_SECRET ? '✅ Défini' : '❌ Manquant'}`);
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      console.log(`  Format: ${process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_') ? '✅ Correct' : '❌ Incorrect'}`);
    }

    // 4. Instructions pour tester
    console.log('\n4️⃣ TEST MANUEL:');
    console.log('═══════════════════════════════════════');
    console.log('1. Allez sur https://dashboard.stripe.com/test/webhooks');
    console.log('2. Cliquez sur votre webhook');
    console.log('3. Onglet "Test" → Event: checkout.session.completed');
    console.log('4. Cliquez "Send test webhook"');
    console.log('5. Vérifiez les logs sur Render');
    console.log('\n   Si vous voyez "✅ Stripe webhook received", c\'est bon!');
    console.log('   Sinon, vérifiez le signing secret.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.message.includes('Invalid API Key')) {
      console.log('\n📝 SOLUTION: Vérifiez STRIPE_SECRET_KEY dans .env');
    }
  }
}

testWebhookConfig();