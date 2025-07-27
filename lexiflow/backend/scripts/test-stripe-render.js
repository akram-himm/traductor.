const fetch = require('node-fetch');

const RENDER_URL = 'https://my-backend-api-cng7.onrender.com';

async function testStripeOnRender() {
  console.log('🧪 Test de l\'intégration Stripe sur Render...\n');
  
  // 1. D'abord, créer un utilisateur de test
  console.log('1️⃣ Création d\'un utilisateur de test...');
  const testUser = {
    name: 'Test User ' + Date.now(),
    email: `test${Date.now()}@example.com`,
    password: 'password123'
  };
  
  try {
    const registerResponse = await fetch(`${RENDER_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    if (!registerResponse.ok) {
      const error = await registerResponse.text();
      console.error('❌ Erreur lors de l\'inscription:', error);
      return;
    }
    
    const { token, user } = await registerResponse.json();
    console.log('✅ Utilisateur créé:', user.email);
    console.log('   Token:', token.substring(0, 20) + '...');
    
    // 2. Tester la création d'une session Stripe
    console.log('\n2️⃣ Test de création de session Stripe...');
    console.log('   Plan: Mensuel');
    
    const checkoutResponse = await fetch(`${RENDER_URL}/api/subscription/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        priceId: 'price_1RpQMQ2VEl7gdPozfYJSzL6B', // Mensuel
        successUrl: 'https://lexiflow.app/success',
        cancelUrl: 'https://lexiflow.app/cancel'
      })
    });
    
    console.log('   Status:', checkoutResponse.status);
    console.log('   Headers:', Object.fromEntries(checkoutResponse.headers.entries()));
    
    const responseText = await checkoutResponse.text();
    console.log('   Response:', responseText);
    
    if (checkoutResponse.ok) {
      const data = JSON.parse(responseText);
      console.log('\n✅ Session Stripe créée avec succès!');
      console.log('   URL de checkout:', data.url);
      console.log('   Session ID:', data.sessionId);
    } else {
      console.error('\n❌ Erreur lors de la création de la session Stripe');
      console.error('   Status:', checkoutResponse.status);
      console.error('   Response:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  }
}

// Exécuter le test
testStripeOnRender();