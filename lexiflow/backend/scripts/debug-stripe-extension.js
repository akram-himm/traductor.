const fetch = require('node-fetch');

const RENDER_URL = 'https://my-backend-api-cng7.onrender.com';

async function debugStripeExtension() {
  console.log('🔍 Debug de l\'erreur Stripe avec l\'extension...\n');
  
  try {
    // Se connecter avec l'utilisateur qui a l'erreur
    console.log('1️⃣ Connexion avec akramhimmich00@gmail.com...');
    const loginResponse = await fetch(`${RENDER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'akramhimmich00@gmail.com',
        password: 'demandez le mot de passe à l\'utilisateur' // Tu devras entrer ton mot de passe
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Impossible de se connecter. Vérifie le mot de passe.');
      console.log('   Utilisons un utilisateur de test à la place...');
      
      // Utiliser l'utilisateur de test qui fonctionne
      const testLoginResponse = await fetch(`${RENDER_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test1753641103118@example.com',
          password: 'password123'
        })
      });
      
      if (!testLoginResponse.ok) {
        console.log('❌ Impossible de se connecter avec l\'utilisateur de test');
        return;
      }
      
      const { token } = await testLoginResponse.json();
      console.log('✅ Connecté avec l\'utilisateur de test');
      
      // Tester exactement ce que l'extension envoie
      console.log('\n2️⃣ Test avec les mêmes paramètres que l\'extension...');
      
      const checkoutResponse = await fetch(`${RENDER_URL}/api/subscription/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          priceType: 'monthly' // Ce que l'extension envoie
        })
      });
      
      const responseText = await checkoutResponse.text();
      console.log('\n📋 Réponse du serveur:');
      console.log('   Status:', checkoutResponse.status);
      console.log('   Body:', responseText);
      
      if (checkoutResponse.ok) {
        console.log('\n✅ Ça fonctionne avec l\'utilisateur de test!');
        console.log('   Le problème pourrait être lié au compte spécifique.');
      }
    } else {
      const { token } = await loginResponse.json();
      console.log('✅ Connecté avec succès');
      
      // Tester avec ton compte
      const checkoutResponse = await fetch(`${RENDER_URL}/api/subscription/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          priceType: 'monthly'
        })
      });
      
      const responseText = await checkoutResponse.text();
      console.log('\n📋 Réponse avec ton compte:');
      console.log('   Status:', checkoutResponse.status);
      console.log('   Body:', responseText);
    }
    
    // Vérifier si c'est un problème de cache
    console.log('\n3️⃣ Vérification du cache Render...');
    console.log('   Il se peut que Render n\'ait pas encore redémarré complètement.');
    console.log('   Attends quelques minutes et réessaie.');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

debugStripeExtension();