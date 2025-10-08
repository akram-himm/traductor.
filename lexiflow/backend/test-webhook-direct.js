// Test direct d'envoi de webhook pour simuler Stripe
const https = require('https');
const crypto = require('crypto');
require('dotenv').config();

console.log('🧪 TEST DIRECT WEBHOOK');
console.log('======================\n');

// Configuration
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const BACKEND_URL = 'my-backend-api-cng7.onrender.com';

if (!WEBHOOK_SECRET) {
  console.error('❌ STRIPE_WEBHOOK_SECRET non configuré dans .env');
  process.exit(1);
}

// Créer un payload de test
const timestamp = Math.floor(Date.now() / 1000);
const payload = JSON.stringify({
  id: 'evt_test_webhook',
  object: 'event',
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_123',
      object: 'checkout.session',
      customer: 'cus_test',
      customer_email: 'test@example.com',
      mode: 'subscription',
      payment_status: 'paid',
      subscription: 'sub_test_123',
      metadata: {
        userId: 'test-user-id'
      }
    }
  }
});

// Créer la signature Stripe
const signedPayload = `${timestamp}.${payload}`;
const expectedSignature = crypto
  .createHmac('sha256', WEBHOOK_SECRET.replace('whsec_', ''))
  .update(signedPayload)
  .digest('hex');

const signature = `t=${timestamp},v1=${expectedSignature}`;

console.log('📤 Envoi du webhook de test...');
console.log(`   URL: https://${BACKEND_URL}/api/subscription/webhook`);
console.log(`   Signature: ${signature.substring(0, 50)}...`);
console.log(`   Secret utilisé: ${WEBHOOK_SECRET.substring(0, 10)}...`);

// Options de la requête
const options = {
  hostname: BACKEND_URL,
  path: '/api/subscription/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'stripe-signature': signature
  }
};

// Faire la requête
const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n📨 Réponse reçue:');
    console.log(`   Status: ${res.statusCode}`);
    console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);

    if (res.statusCode === 200) {
      console.log('   ✅ WEBHOOK ACCEPTÉ !');
      console.log('\n   Le endpoint fonctionne correctement.');
      console.log('   Le problème vient probablement du signing secret.');
    } else if (res.statusCode === 400) {
      console.log('   ❌ ERREUR 400 - Signature invalide');
      console.log('\n   📝 SOLUTION:');
      console.log('   1. Sur Stripe Dashboard → Votre webhook');
      console.log('   2. "Signing secret" → Reveal');
      console.log('   3. Copiez EXACTEMENT la clé');
      console.log('   4. Mettez à jour STRIPE_WEBHOOK_SECRET sur Render');
    } else if (res.statusCode === 404) {
      console.log('   ❌ ERREUR 404 - Endpoint non trouvé');
      console.log('   L\'URL n\'est pas correcte ou le serveur est down');
    } else {
      console.log(`   ⚠️ Status inattendu: ${res.statusCode}`);
    }

    if (data) {
      console.log(`\n   Body: ${data}`);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erreur de connexion:', error.message);
  console.log('\n📝 Vérifiez que le serveur est en ligne sur Render');
});

// Envoyer la requête
req.write(payload);
req.end();

console.log('\n⏳ Attente de la réponse...');