// Test avec le nouveau secret que vous allez copier depuis Stripe
const https = require('https');
const crypto = require('crypto');

console.log('🔑 TEST AVEC NOUVEAU SECRET');
console.log('============================\n');

// REMPLACEZ CETTE LIGNE avec le secret de Stripe (après l'avoir révélé)
const WEBHOOK_SECRET = 'COLLEZ_ICI_LE_SECRET_DE_STRIPE'; // Remplacez-moi !

if (WEBHOOK_SECRET === 'COLLEZ_ICI_LE_SECRET_DE_STRIPE') {
  console.log('❌ ERREUR : Vous devez remplacer WEBHOOK_SECRET avec le vrai secret !');
  console.log('\n📝 Instructions :');
  console.log('1. Sur Stripe, révélez la "Clé secrète de signature"');
  console.log('2. Copiez TOUTE la clé (whsec_...)');
  console.log('3. Remplacez COLLEZ_ICI_LE_SECRET_DE_STRIPE dans ce fichier');
  console.log('4. Relancez le test');
  process.exit(1);
}

console.log(`Secret utilisé : ${WEBHOOK_SECRET.substring(0, 20)}...`);

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
      customer_email: 'test@example.com',
      payment_status: 'paid'
    }
  }
});

// Créer la signature
const signedPayload = `${timestamp}.${payload}`;
const expectedSignature = crypto
  .createHmac('sha256', WEBHOOK_SECRET.replace('whsec_', ''))
  .update(signedPayload)
  .digest('hex');

const signature = `t=${timestamp},v1=${expectedSignature}`;

// Faire la requête
const options = {
  hostname: 'my-backend-api-cng7.onrender.com',
  path: '/api/subscription/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'stripe-signature': signature
  }
};

console.log('📤 Envoi du test...\n');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`📨 Résultat : Status ${res.statusCode}`);

    if (res.statusCode === 200) {
      console.log('✅ SUCCÈS ! Le secret est correct !');
      console.log('\n🎯 Actions suivantes :');
      console.log('1. Mettez ce secret sur Render');
      console.log('2. Save Changes et attendez 3 min');
      console.log('3. Faites un paiement test');
    } else {
      console.log('❌ ERREUR : Le secret ne correspond pas');
      console.log('\nVérifiez que vous avez copié :');
      console.log('- TOUTE la clé (pas juste le début)');
      console.log('- Sans espaces avant/après');
      console.log('- Depuis le BON webhook (LexiFlow Premium Subscriptions)');
    }

    if (data) console.log(`\nRéponse : ${data}`);
  });
});

req.on('error', (err) => {
  console.error('❌ Erreur connexion :', err.message);
});

req.write(payload);
req.end();