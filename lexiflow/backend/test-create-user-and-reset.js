// Test pour créer un utilisateur et tester la récupération de mot de passe
require('dotenv').config();
const fetch = require('node-fetch');

const API_URL = 'https://my-backend-api-cng7.onrender.com';
const testEmail = 'saadakram159@gmail.com';
const testPassword = 'testpass123';

async function createUserAndTestReset() {
  console.log('📧 Email de test:', testEmail);
  console.log('🌐 API URL:', API_URL);
  console.log('\n========================================\n');

  // Étape 1 : Créer un compte
  console.log('1️⃣ Tentative de création de compte...');
  try {
    const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'Test User'
      })
    });

    const registerData = await registerResponse.json();

    if (registerResponse.ok) {
      console.log('✅ Compte créé avec succès!');
      console.log('   Message:', registerData.message);
    } else {
      console.log('⚠️  Compte existant ou erreur:', registerData.error);
      // Continue quand même pour tester la récupération
    }
  } catch (error) {
    console.error('❌ Erreur création:', error.message);
  }

  console.log('\n========================================\n');

  // Étape 2 : Tester la récupération de mot de passe
  console.log('2️⃣ Test de récupération de mot de passe...');
  console.log('   Envoi de la demande...');

  const startTime = Date.now();

  try {
    const resetResponse = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
    const resetData = await resetResponse.json();

    if (resetResponse.ok) {
      console.log(`✅ Réponse reçue en ${elapsedTime}s`);
      console.log('   Message:', resetData.message);
      console.log('\n🎉 SUCCÈS!');
      console.log('   → Vérifiez votre boîte mail', testEmail);
      console.log('   → Vérifiez aussi les SPAMS');
      console.log('   → L\'email peut prendre 1-2 minutes');
    } else {
      console.log('❌ Erreur:', resetData.error);
    }
  } catch (error) {
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`❌ Erreur après ${elapsedTime}s:`, error.message);
  }

  console.log('\n========================================\n');
  console.log('📌 Notes importantes:');
  console.log('   1. Le serveur Render peut être lent (réveil)');
  console.log('   2. L\'email n\'est envoyé QUE si le compte existe');
  console.log('   3. Vérifiez les SPAMS dans Gmail');
  console.log('   4. L\'email peut prendre quelques minutes');
}

createUserAndTestReset();