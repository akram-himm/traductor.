require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = 'stripe-test@example.com';
const TEST_PASSWORD = 'Test123!';

console.log('🧪 Test du flux complet Stripe\n');

async function testFlow() {
  try {
    // 1. Créer un compte utilisateur de test
    console.log('1️⃣ Création d\'un compte de test...');
    let authToken;
    
    try {
      const signupResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: 'Test User'
      });
      authToken = signupResponse.data.token;
      console.log('✅ Compte créé avec succès');
    } catch (error) {
      if (error.response?.data?.error?.includes('already exists')) {
        // Si l'utilisateur existe déjà, se connecter
        console.log('   Utilisateur existe déjà, connexion...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: TEST_EMAIL,
          password: TEST_PASSWORD
        });
        authToken = loginResponse.data.token;
        console.log('✅ Connexion réussie');
      } else {
        throw error;
      }
    }
    
    // 2. Vérifier le statut de l'abonnement initial
    console.log('\n2️⃣ Vérification du statut initial...');
    const statusResponse = await axios.get(`${BASE_URL}/api/subscription/status`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Statut actuel:', statusResponse.data);
    
    // 3. Créer une session de checkout
    console.log('\n3️⃣ Création d\'une session de paiement...');
    const checkoutResponse = await axios.post(
      `${BASE_URL}/api/subscription/create-checkout-session`,
      { priceType: 'monthly' },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Session créée !');
    console.log('🔗 URL de paiement:', checkoutResponse.data.checkoutUrl);
    console.log('🆔 Session ID:', checkoutResponse.data.sessionId);
    
    // 4. Simuler un webhook de paiement réussi
    console.log('\n4️⃣ Simulation d\'un webhook Stripe...');
    console.log('   (En production, Stripe enverrait automatiquement ce webhook)');
    
    // 5. Instructions pour tester
    console.log('\n📝 INSTRUCTIONS POUR TESTER:');
    console.log('   1. Ouvrez l\'URL ci-dessus dans votre navigateur');
    console.log('   2. Utilisez la carte de test: 4242 4242 4242 4242');
    console.log('   3. Date d\'expiration: N\'importe quelle date future');
    console.log('   4. CVC: N\'importe quel 3 chiffres');
    console.log('   5. Email: test@example.com');
    console.log('\n💡 Pour tester les webhooks localement:');
    console.log('   1. Installez Stripe CLI: https://stripe.com/docs/stripe-cli');
    console.log('   2. Connectez-vous: stripe login');
    console.log('   3. Écoutez les webhooks: stripe listen --forward-to localhost:3001/api/subscription/webhook');
    console.log('   4. Copiez le webhook secret et mettez à jour STRIPE_WEBHOOK_SECRET dans .env');
    
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

testFlow();