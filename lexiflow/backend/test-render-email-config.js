// Test pour vérifier la configuration email sur Render
const fetch = require('node-fetch');

const API_URL = 'https://my-backend-api-cng7.onrender.com';
const testEmail = 'akramhimmich21@gmail.com';

async function testRenderEmailConfig() {
  console.log('🔍 TEST CONFIGURATION EMAIL SUR RENDER');
  console.log('=========================================\n');

  // 1. Vérifier la configuration
  console.log('1️⃣ Vérification des variables d\'environnement sur Render...');
  try {
    const configResponse = await fetch(`${API_URL}/api/auth/test-email-config`);

    if (!configResponse.ok) {
      console.log('❌ Route test-email-config non disponible');
      console.log('   Le nouveau code n\'est peut-être pas encore déployé');
      console.log('   Attendez 2-3 minutes et réessayez');
    } else {
      const config = await configResponse.json();
      console.log('📧 Configuration sur Render:');
      console.log('   - Configuré:', config.configured ? '✅ OUI' : '❌ NON');
      console.log('   - Host:', config.host);
      console.log('   - User:', config.user);
      console.log('   - Password défini:', config.passSet ? '✅ OUI' : '❌ NON');

      if (!config.configured) {
        console.log('\n⚠️  PROBLÈME DÉTECTÉ!');
        console.log('   Les variables EMAIL ne sont pas configurées sur Render!');
        console.log('\n📝 SOLUTION:');
        console.log('   1. Allez sur https://dashboard.render.com');
        console.log('   2. Trouvez votre service "my-backend-api"');
        console.log('   3. Allez dans "Environment" → "Environment Variables"');
        console.log('   4. Ajoutez ces variables:');
        console.log('      EMAIL_HOST = smtp.gmail.com');
        console.log('      EMAIL_PORT = 587');
        console.log('      EMAIL_USER = lexiflow.contact@gmail.com');
        console.log('      EMAIL_PASS = ntmxvkzflvmumknt');
        console.log('   5. Cliquez "Save Changes"');
        console.log('   6. Attendez le redéploiement (5 minutes)');
        return;
      }
    }
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }

  console.log('\n2️⃣ Test d\'envoi direct via l\'API test...');
  try {
    const testResponse = await fetch(`${API_URL}/api/auth/test-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });

    if (!testResponse.ok) {
      console.log('❌ Route test-email non disponible');
    } else {
      const result = await testResponse.json();
      console.log('✅ Réponse:', result.message);
      console.log('   → Vérifiez votre email dans 30 secondes');
    }
  } catch (error) {
    console.log('❌ Erreur test email:', error.message);
  }

  console.log('\n3️⃣ Test forgot-password (le vrai)...');
  const startTime = Date.now();

  try {
    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const data = await response.json();

    console.log(`✅ Réponse en ${elapsed}s`);
    console.log('   Message:', data.message);

    if (elapsed < 5) {
      console.log('   🎉 RAPIDE! L\'envoi non-bloquant fonctionne!');
    } else {
      console.log('   ⚠️  Encore lent, vérifier les logs Render');
    }

    console.log('\n📧 RÉSULTAT:');
    console.log('   Si vous recevez l\'email = Tout fonctionne!');
    console.log('   Si pas d\'email = Variables non configurées sur Render');

  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`❌ Erreur après ${elapsed}s:`, error.message);
  }

  console.log('\n=========================================');
  console.log('📌 CHECKLIST:');
  console.log('[ ] Variables EMAIL configurées sur Render?');
  console.log('[ ] Code redéployé (attendu 5 min)?');
  console.log('[ ] Email reçu dans Gmail?');
  console.log('[ ] Vérifié le dossier SPAM?');
}

testRenderEmailConfig();