#!/usr/bin/env node
require('dotenv').config();
const { spawn } = require('child_process');
const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
const testUser = {
  email: 'test-stripe@lexiflow.com',
  password: 'test123456',
  name: 'Test Stripe'
};

// Attendre que le serveur soit prêt
function waitForServer(url, maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      axios.get(url + '/ping')
        .then(() => resolve())
        .catch(() => {
          attempts++;
          if (attempts >= maxAttempts) {
            reject(new Error('Server did not start in time'));
          } else {
            setTimeout(check, 1000);
          }
        });
    };
    check();
  });
}

async function runTest() {
  console.log('🚀 Démarrage du test complet Stripe\n');
  
  // 1. Lancer le serveur backend
  console.log('1️⃣ Démarrage du serveur backend...');
  const server = spawn('node', ['src/app.js'], {
    cwd: __dirname,
    env: { ...process.env, NODE_ENV: 'development' }
  });
  
  server.stdout.on('data', (data) => {
    console.log(`[SERVER] ${data}`);
  });
  
  server.stderr.on('data', (data) => {
    console.error(`[SERVER ERROR] ${data}`);
  });
  
  try {
    // Attendre que le serveur soit prêt
    await waitForServer('http://localhost:3001');
    console.log('✅ Serveur démarré!\n');
    
    // 2. Créer ou connecter l'utilisateur
    console.log('2️⃣ Test d\'inscription/connexion...');
    let token;
    
    try {
      const registerRes = await axios.post(`${API_URL}/auth/register`, testUser);
      token = registerRes.data.token;
      console.log('✅ Utilisateur créé');
      console.log('📧 Email de vérification envoyé à:', testUser.email);
      console.log('⚠️  Vérifiez votre email et cliquez sur le lien pour activer l\'essai gratuit\n');
    } catch (err) {
      if (err.response?.status === 409) {
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
          email: testUser.email,
          password: testUser.password
        });
        token = loginRes.data.token;
        console.log('✅ Connexion réussie (utilisateur existant)\n');
      } else {
        throw err;
      }
    }
    
    // 3. Vérifier le statut
    console.log('3️⃣ Vérification du statut premium...');
    const statusRes = await axios.get(`${API_URL}/user/premium-status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Statut actuel:', statusRes.data);
    console.log('');
    
    // 4. Créer une session Stripe
    console.log('4️⃣ Création de la session de paiement Stripe...');
    const checkoutRes = await axios.post(
      `${API_URL}/subscription/create-checkout-session`,
      { priceType: 'monthly' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✅ Session de paiement créée!\n');
    console.log('🔗 URL de paiement:', checkoutRes.data.checkoutUrl);
    console.log('\n📋 Instructions pour tester le paiement:');
    console.log('1. Cliquez sur l\'URL ci-dessus');
    console.log('2. Utilisez la carte test: 4242 4242 4242 4242');
    console.log('3. Date expiration: n\'importe quelle date future (ex: 12/25)');
    console.log('4. CVC: n\'importe quel 3 chiffres (ex: 123)');
    console.log('5. Code postal: n\'importe quel code (ex: 12345)');
    console.log('\n⚡ Pour recevoir la confirmation du paiement:');
    console.log('   Lancez dans un autre terminal: npm run test:webhook');
    console.log('\nAppuyez sur Ctrl+C pour arrêter le serveur');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.response?.data || error.message);
    server.kill();
    process.exit(1);
  }
}

// Gérer l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n\n👋 Arrêt du test...');
  process.exit(0);
});

// Lancer le test
runTest();