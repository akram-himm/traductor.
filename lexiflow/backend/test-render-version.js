// Script pour vérifier quelle version est déployée sur Render
const https = require('https');

console.log('🔍 Vérification de la version sur Render...\n');

// Test 1: Vérifier que le serveur répond
const testHealth = () => {
  return new Promise((resolve) => {
    https.get('https://my-backend-api-cng7.onrender.com/api/health', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('✅ Serveur accessible');
        console.log('   Réponse:', data);
        resolve();
      });
    }).on('error', (err) => {
      console.error('❌ Serveur inaccessible:', err.message);
      resolve();
    });
  });
};

// Test 2: Tenter une requête de reset pour voir l'erreur
const testReset = () => {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      token: 'test-token',
      email: 'test@example.com',
      newPassword: 'TestPassword123'
    });

    const options = {
      hostname: 'my-backend-api-cng7.onrender.com',
      path: '/api/auth/reset-password',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('\n📊 Test de reset password:');
        console.log('   Status:', res.statusCode);

        if (res.statusCode === 500) {
          console.log('   ❌ ERREUR 500 DÉTECTÉE!');
          console.log('   → Le code avec Op.gt est toujours actif');
          console.log('   → Render n\'a pas déployé la correction');
        } else if (res.statusCode === 400) {
          console.log('   ✅ Erreur 400 (normale avec un faux token)');
          console.log('   → Le code corrigé est déployé');
        }

        console.log('   Réponse:', data);
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error('❌ Erreur requête:', err.message);
      resolve();
    });

    req.write(postData);
    req.end();
  });
};

// Exécuter les tests
async function checkRenderVersion() {
  await testHealth();
  await testReset();

  console.log('\n📝 DIAGNOSTIC:');
  console.log('════════════════════════════════════════');

  console.log('\nSi vous voyez une erreur 500:');
  console.log('1. Le déploiement n\'est pas terminé');
  console.log('2. Ou Render utilise une ancienne version');
  console.log('\n🔧 SOLUTION:');
  console.log('1. Allez sur dashboard.render.com');
  console.log('2. Cliquez sur "my-backend-api-cng7"');
  console.log('3. Onglet "Deploys" → Vérifiez le statut');
  console.log('4. Si nécessaire: "Manual Deploy" → "Clear build cache & deploy"');
  console.log('\n⏱️ Le déploiement prend 3-5 minutes');
}

checkRenderVersion();