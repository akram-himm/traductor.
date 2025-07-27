const fetch = require('node-fetch');

const RENDER_URL = 'https://my-backend-api-cng7.onrender.com';

async function checkRenderEnv() {
  console.log('🔍 Vérification des variables d\'environnement sur Render...\n');
  
  try {
    // Créer un endpoint temporaire pour vérifier les variables
    const response = await fetch(`${RENDER_URL}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Serveur Render actif');
      console.log('   Environnement:', data.environment || 'Non défini');
    } else {
      console.log('❌ Erreur:', response.status);
    }
    
    // Test direct de création de session pour voir l'erreur détaillée
    console.log('\n🧪 Test de création de session Stripe avec debug...');
    
    // D'abord, se connecter avec un utilisateur de test
    const loginResponse = await fetch(`${RENDER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test1753640614413@example.com',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Impossible de se connecter avec l\'utilisateur de test');
      return;
    }
    
    const { token } = await loginResponse.json();
    console.log('✅ Connecté avec succès');
    
    // Tester la création de session avec priceType
    const checkoutResponse = await fetch(`${RENDER_URL}/api/subscription/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        priceType: 'monthly' // Envoyer priceType au lieu de priceId
      })
    });
    
    const responseText = await checkoutResponse.text();
    console.log('\n📋 Réponse du serveur:');
    console.log('   Status:', checkoutResponse.status);
    console.log('   Body:', responseText);
    
    if (checkoutResponse.ok) {
      const data = JSON.parse(responseText);
      console.log('\n✅ Session créée avec succès!');
      console.log('   URL:', data.checkoutUrl?.substring(0, 50) + '...');
    } else {
      console.log('\n❌ Erreur lors de la création de session');
      console.log('   Cela indique que les variables STRIPE_MONTHLY_PRICE_ID et STRIPE_YEARLY_PRICE_ID');
      console.log('   ne sont probablement pas définies sur Render.');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkRenderEnv();