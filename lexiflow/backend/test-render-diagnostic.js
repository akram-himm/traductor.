// Diagnostic complet du problème sur Render
const fetch = require('node-fetch');

const API_URL = 'https://my-backend-api-cng7.onrender.com';
const testEmail = 'akramhimmich21@gmail.com';

async function diagnosticComplet() {
  console.log('🔍 DIAGNOSTIC COMPLET DU PROBLÈME RENDER');
  console.log('==========================================');
  console.log('Email de test:', testEmail);
  console.log('API:', API_URL);
  console.log('\n');

  // Test 1: Ping simple
  console.log('TEST 1: Ping simple (health check)');
  console.log('------------------------------------');
  let startTime = Date.now();
  try {
    const healthResponse = await fetch(`${API_URL}/api/health`);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const data = await healthResponse.json();
    console.log(`✅ Réponse en ${elapsed}s`);
    console.log('   Status:', healthResponse.status);
    console.log('   Data:', JSON.stringify(data));
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`❌ Erreur après ${elapsed}s:`, error.message);
  }
  console.log('\n');

  // Test 2: Créer un utilisateur de test
  console.log('TEST 2: Créer/vérifier utilisateur');
  console.log('------------------------------------');
  startTime = Date.now();
  try {
    const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'TestPassword123!',
        name: 'Akram Test'
      })
    });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const data = await registerResponse.json();

    if (registerResponse.ok) {
      console.log(`✅ Compte créé en ${elapsed}s`);
    } else {
      console.log(`⚠️  Compte existant ou erreur en ${elapsed}s`);
    }
    console.log('   Message:', data.message || data.error);
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`❌ Erreur après ${elapsed}s:`, error.message);
  }
  console.log('\n');

  // Test 3: Forgot password avec timing détaillé
  console.log('TEST 3: Forgot Password (timing détaillé)');
  console.log('------------------------------------');
  console.log('⏳ Envoi de la requête forgot-password...');

  startTime = Date.now();
  const checkpoints = [];

  try {
    // Créer une requête avec timeout personnalisé
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 secondes

    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);
    checkpoints.push(`Réponse reçue: ${responseTime}s`);

    const data = await response.json();
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ Terminé en ${totalTime}s`);
    console.log('   Status:', response.status);
    console.log('   Message:', data.message || data.error);
    console.log('\n   Timing:');
    checkpoints.forEach(cp => console.log('   - ' + cp));

    if (response.ok) {
      console.log('\n📧 EMAIL DEVRAIT ÊTRE ENVOYÉ!');
      console.log('   → Vérifiez: akramhimmich21@gmail.com');
      console.log('   → Vérifiez aussi les SPAMS');
    }

  } catch (error) {
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`❌ Erreur après ${totalTime}s`);
    console.log('   Type:', error.name);
    console.log('   Message:', error.message);

    if (error.name === 'AbortError') {
      console.log('   → Timeout atteint (90s)');
    }
  }

  console.log('\n');
  console.log('==========================================');
  console.log('ANALYSE DU PROBLÈME:');
  console.log('------------------------------------');
  console.log('Si le forgot-password prend 60+ secondes:');
  console.log('1. Le serveur essaie d\'envoyer l\'email');
  console.log('2. L\'envoi échoue ou timeout');
  console.log('3. Vérifier les logs Render pour voir l\'erreur exacte');
  console.log('\nSOLUTIONS POSSIBLES:');
  console.log('- Vérifier EMAIL_USER et EMAIL_PASS sur Render');
  console.log('- Vérifier que Gmail n\'a pas bloqué la connexion');
  console.log('- Essayer avec un autre service email (SendGrid)');
}

diagnosticComplet();