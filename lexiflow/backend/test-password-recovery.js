// Test de récupération de mot de passe
const fetch = require('node-fetch');

// Configuration
const API_URL = 'https://my-backend-api-cng7.onrender.com'; // Pour tester sur Render
// const API_URL = 'http://localhost:3000'; // Pour tester en local

const testEmail = 'saadakram159@gmail.com'; // Email réel pour tester

async function testPasswordRecovery() {
  console.log('🔄 Test de récupération de mot de passe...');
  console.log(`📧 Email de test: ${testEmail}`);
  console.log(`🌐 API URL: ${API_URL}`);

  try {
    console.log('\n1️⃣ Envoi de la demande de réinitialisation...');
    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Succès!');
      console.log('📩 Message:', data.message);
      console.log('\n✨ Un email de réinitialisation a été envoyé (si le compte existe)');
    } else {
      console.log('❌ Erreur:', response.status);
      console.log('💬 Réponse:', data);
    }
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    console.log('\n💡 Vérifiez que:');
    console.log('   - Le serveur Render est bien déployé et actif');
    console.log('   - L\'URL de l\'API est correcte');
    console.log('   - Votre connexion internet fonctionne');
  }
}

// Lancer le test
testPasswordRecovery();