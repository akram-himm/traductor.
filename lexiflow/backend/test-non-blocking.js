// Test pour vérifier que l'envoi est maintenant non-bloquant
const fetch = require('node-fetch');

const API_URL = 'https://my-backend-api-cng7.onrender.com';
const testEmail = 'akramhimmich21@gmail.com';

async function testNonBlockingEmail() {
  console.log('🚀 Test du nouvel envoi NON-BLOQUANT');
  console.log('=====================================');
  console.log('Email:', testEmail);
  console.log('API:', API_URL);
  console.log('\nAttendre 2-3 minutes pour le redéploiement Render...\n');

  // Test 1: Vérifier la configuration
  console.log('1️⃣ Vérification de la configuration email...');
  try {
    const configResponse = await fetch(`${API_URL}/api/auth/test-email-config`);
    const config = await configResponse.json();
    console.log('Configuration email sur Render:');
    console.log('  - Configuré:', config.configured ? '✅' : '❌');
    console.log('  - Host:', config.host);
    console.log('  - User:', config.user);
    console.log('  - Pass défini:', config.passSet ? '✅' : '❌');
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }

  console.log('\n2️⃣ Test forgot-password (devrait être RAPIDE maintenant)...');
  const startTime = Date.now();

  try {
    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const data = await response.json();

    if (elapsed < 10) {
      console.log(`✅ SUCCÈS! Réponse en ${elapsed}s (RAPIDE!)`);
    } else {
      console.log(`⚠️  Réponse en ${elapsed}s (encore lent)`);
    }

    console.log('   Status:', response.status);
    console.log('   Message:', data.message);

    if (response.ok) {
      console.log('\n📧 L\'email sera envoyé en arrière-plan');
      console.log('   → Vérifiez akramhimmich21@gmail.com');
      console.log('   → L\'email peut prendre 1-2 minutes');
      console.log('   → Vérifiez aussi les SPAMS');
    }

  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`❌ Erreur après ${elapsed}s:`, error.message);
  }

  console.log('\n3️⃣ Test direct d\'envoi email...');
  try {
    const testResponse = await fetch(`${API_URL}/api/auth/test-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });

    const testData = await testResponse.json();
    console.log('✅ Test email:', testData.message);
  } catch (error) {
    console.log('❌ Erreur test:', error.message);
  }
}

// Attendre un peu pour que Render redéploie
console.log('⏳ Attendez que Render redéploie (environ 2-3 minutes)...');
console.log('   Puis lancez ce script à nouveau.');

testNonBlockingEmail();