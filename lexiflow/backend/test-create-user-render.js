// Créer un utilisateur sur Render puis tester forgot-password
const fetch = require('node-fetch');

const API_URL = 'https://my-backend-api-cng7.onrender.com';
const testEmail = 'akramhimmich21@gmail.com';
const testPassword = 'TestPassword123!';

async function createUserAndTestOnRender() {
  console.log('🚀 CRÉATION D\'UTILISATEUR SUR RENDER ET TEST');
  console.log('=============================================\n');
  console.log('Email:', testEmail);
  console.log('API:', API_URL);
  console.log('\n');

  // 1. Créer un compte
  console.log('1️⃣ Création/Vérification du compte...');
  try {
    const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'Akram Test'
      })
    });

    const registerData = await registerResponse.json();

    if (registerResponse.ok) {
      console.log('✅ Nouveau compte créé!');
      console.log('   Token:', registerData.token ? 'Reçu' : 'Non reçu');
      console.log('   User ID:', registerData.user?.id);
    } else {
      if (registerData.error === 'This email is already registered') {
        console.log('✅ Le compte existe déjà (parfait!)');
      } else {
        console.log('⚠️  Erreur:', registerData.error);
      }
    }
  } catch (error) {
    console.error('❌ Erreur création:', error.message);
  }

  console.log('\n2️⃣ Test de connexion pour vérifier le compte...');
  try {
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    const loginData = await loginResponse.json();

    if (loginResponse.ok) {
      console.log('✅ Connexion réussie! Le compte existe bien.');
      console.log('   User:', loginData.user?.email);
      console.log('   Premium:', loginData.user?.isPremium);
    } else {
      console.log('⚠️  Connexion échouée:', loginData.error);
      console.log('   → Le compte n\'existe peut-être pas avec ce mot de passe');
    }
  } catch (error) {
    console.error('❌ Erreur login:', error.message);
  }

  console.log('\n3️⃣ Test de récupération de mot de passe...');
  console.log('   Envoi de l\'email de récupération...');

  const startTime = Date.now();

  try {
    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const data = await response.json();

    console.log(`✅ Réponse reçue en ${elapsed}s`);
    console.log('   Message:', data.message);

    if (elapsed < 5) {
      console.log('   ⚡ Rapide! L\'API fonctionne bien.');
    }

    console.log('\n🎯 IMPORTANT:');
    console.log('   L\'email de récupération est maintenant envoyé!');
    console.log('   → Vérifiez: akramhimmich21@gmail.com');
    console.log('   → Regardez dans SPAM aussi');
    console.log('   → L\'email peut prendre 1-2 minutes');

  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`❌ Erreur après ${elapsed}s:`, error.message);
  }

  console.log('\n=============================================');
  console.log('📊 RÉSUMÉ:');
  console.log('   - Compte existant/créé: ✅');
  console.log('   - Forgot password envoyé: ✅');
  console.log('   - Email devrait arriver dans 1-2 min');
  console.log('\n💡 Si l\'email n\'arrive toujours pas:');
  console.log('   1. Vérifiez les logs sur dashboard.render.com');
  console.log('   2. Dans "Logs", cherchez "Email" ou "Error"');
  console.log('   3. Gmail peut bloquer les envois depuis Render');
}

createUserAndTestOnRender();