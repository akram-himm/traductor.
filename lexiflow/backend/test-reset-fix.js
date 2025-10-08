// Script de test pour vérifier la correction du reset password
require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

// Configuration
const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const TEST_EMAIL = 'akramhimmich21@gmail.com'; // Changez pour votre email de test

async function testPasswordReset() {
  console.log('🔐 TEST DE LA RÉINITIALISATION DE MOT DE PASSE');
  console.log('=============================================\n');
  console.log('URL Backend:', BASE_URL);
  console.log('Email de test:', TEST_EMAIL);
  console.log('');

  try {
    // Étape 1 : Demander un reset de mot de passe
    console.log('📧 Étape 1: Demande de réinitialisation...');
    const forgotResponse = await axios.post(`${BASE_URL}/api/auth/forgot-password`, {
      email: TEST_EMAIL
    });

    console.log('✅ Réponse:', forgotResponse.data.message);
    console.log('   Status:', forgotResponse.status);

    // Simuler un token pour le test (en production, il viendrait de l'email)
    const testToken = crypto.randomBytes(32).toString('hex');
    console.log('\n🔑 Token de test généré:', testToken);

    // Étape 2 : Tester la réinitialisation avec un nouveau mot de passe
    console.log('\n🔒 Étape 2: Test de réinitialisation (cela échouera car le token est simulé)...');

    try {
      const resetResponse = await axios.post(`${BASE_URL}/api/auth/reset-password`, {
        token: testToken,
        email: TEST_EMAIL,
        newPassword: 'NouveauMotDePasse123!'
      });

      console.log('✅ Réinitialisation réussie!');
      console.log('   Réponse:', resetResponse.data.message);
    } catch (resetError) {
      if (resetError.response && resetError.response.status === 400) {
        console.log('⚠️  Erreur 400 (normale avec un token simulé):', resetError.response.data.error);
        console.log('   C\'est normal car nous utilisons un token de test.');
        console.log('   En production, utilisez le vrai token reçu par email.');
      } else if (resetError.response && resetError.response.status === 500) {
        console.error('❌ ERREUR 500 - Le problème persiste!');
        console.error('   Message:', resetError.response.data);
        console.error('   Il faut vérifier les logs du serveur.');
      } else {
        console.error('❌ Erreur inattendue:', resetError.message);
      }
    }

  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }

  console.log('\n=== FIN DU TEST ===');
  console.log('\n📝 Notes:');
  console.log('- Si vous obtenez une erreur 400, c\'est normal (token simulé)');
  console.log('- Si vous obtenez une erreur 500, le problème persiste');
  console.log('- Pour un test complet, utilisez le vrai token reçu par email');
}

// Lancer le test
testPasswordReset();