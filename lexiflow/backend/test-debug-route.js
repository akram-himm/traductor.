// Test de la route de debug webhook
const https = require('https');

console.log('🔍 TEST ROUTE DEBUG WEBHOOK');
console.log('===========================\n');

const payload = JSON.stringify({
  test: true,
  message: 'Test de debug webhook'
});

const options = {
  hostname: 'my-backend-api-cng7.onrender.com',
  path: '/api/subscription/webhook-debug',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'stripe-signature': 'test-signature-12345'
  }
};

console.log('📤 Envoi vers la route de debug...\n');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`📨 Status: ${res.statusCode}`);

    if (res.statusCode === 200 && data) {
      try {
        const response = JSON.parse(data);
        console.log('\n✅ Réponse du serveur:');
        console.log('   Secret configuré:', response.debug?.secretConfigured ? 'OUI' : 'NON');
        console.log('   Secret commence par:', response.debug?.secretStart || 'NON CONFIGURÉ');
        console.log('   Signature reçue:', response.debug?.signatureReceived ? 'OUI' : 'NON');

        if (response.debug?.secretStart) {
          console.log('\n📝 Le secret sur Render commence par:');
          console.log(`   ${response.debug.secretStart}`);
          console.log('\n   Comparez avec votre secret Stripe:');
          console.log('   whsec_Ksgbw8ZIGtVmfGp6...');

          if (response.debug.secretStart !== 'whsec_Ksgbw8ZIGtVmfGp6') {
            console.log('\n   ❌ LES SECRETS NE CORRESPONDENT PAS !');
            console.log('   Mettez à jour STRIPE_WEBHOOK_SECRET sur Render.');
          } else {
            console.log('\n   ✅ Les secrets semblent correspondre !');
          }
        }
      } catch (e) {
        console.log('Réponse:', data);
      }
    } else {
      console.log('❌ Erreur:', res.statusCode);
      console.log('La route de debug n\'est pas encore déployée.');
      console.log('Attendez 2-3 minutes et réessayez.');
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Erreur connexion:', err.message);
});

req.write(payload);
req.end();