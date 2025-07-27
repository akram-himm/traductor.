require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
const testUser = {
  email: 'test-stripe@lexiflow.com',
  password: 'test123456',
  name: 'Test Stripe'
};

async function testPaymentFlow() {
  console.log('🧪 Test du flux de paiement complet\n');
  
  try {
    // 1. S'inscrire ou se connecter
    console.log('1️⃣ Inscription/Connexion...');
    let token;
    
    try {
      // Essayer de s'inscrire
      const registerRes = await axios.post(`${API_URL}/auth/register`, testUser);
      token = registerRes.data.token;
      console.log('✅ Utilisateur créé avec succès');
      console.log('📧 Vérifiez votre email pour activer l\'essai gratuit');
    } catch (err) {
      // Si l'utilisateur existe déjà, se connecter
      if (err.response?.status === 409) {
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
          email: testUser.email,
          password: testUser.password
        });
        token = loginRes.data.token;
        console.log('✅ Connexion réussie (utilisateur existant)');
      } else {
        throw err;
      }
    }
    
    // 2. Vérifier le statut premium
    console.log('\n2️⃣ Vérification du statut...');
    const statusRes = await axios.get(`${API_URL}/user/premium-status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Statut actuel:', statusRes.data);
    
    // 3. Créer une session de paiement
    console.log('\n3️⃣ Création de la session de paiement...');
    const checkoutRes = await axios.post(
      `${API_URL}/subscription/create-checkout-session`,
      { priceType: 'monthly' }, // ou 'yearly'
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✅ Session créée!');
    console.log('🔗 URL de paiement:', checkoutRes.data.checkoutUrl);
    console.log('\n📋 Instructions:');
    console.log('1. Cliquez sur l\'URL ci-dessus');
    console.log('2. Utilisez la carte test: 4242 4242 4242 4242');
    console.log('3. Date: n\'importe quelle date future');
    console.log('4. CVC: n\'importe quel 3 chiffres');
    console.log('5. Email: test@lexiflow.com');
    console.log('\n⚡ Le webhook local doit être actif pour recevoir la confirmation');
    
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

// Lancer le test
testPaymentFlow();