const fetch = require('node-fetch');

const RENDER_URL = 'https://my-backend-api-cng7.onrender.com';

async function checkUserStatus() {
  console.log('🔍 Vérification du statut utilisateur...\n');
  
  try {
    // Se connecter
    console.log('1️⃣ Connexion...');
    const loginResponse = await fetch(`${RENDER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'akramhimmich00@gmail.com',
        password: 'ton_mot_de_passe' // Remplace par ton vrai mot de passe
      })
    });
    
    if (!loginResponse.ok) {
      console.error('❌ Erreur de connexion:', await loginResponse.text());
      return;
    }
    
    const { token, user } = await loginResponse.json();
    console.log('✅ Connecté');
    console.log('   Email:', user.email);
    console.log('   Premium:', user.isPremium);
    console.log('   Trial:', user.subscriptionStatus);
    
    // Vérifier le statut de l'abonnement
    console.log('\n2️⃣ Vérification de l\'abonnement...');
    const statusResponse = await fetch(`${RENDER_URL}/api/subscription/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('📊 Statut abonnement:', status);
    } else {
      console.log('❌ Impossible de récupérer le statut');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkUserStatus();