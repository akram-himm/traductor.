// Test de connexion après réinitialisation de mot de passe
const https = require('https');

console.log('🔐 TEST DE CONNEXION APRÈS RÉINITIALISATION');
console.log('===========================================\n');

// Fonction pour tester la connexion
function testLogin(email, password) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ email, password });

    const options = {
      hostname: 'my-backend-api-cng7.onrender.com',
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const result = {
          status: res.statusCode,
          data: JSON.parse(data)
        };

        console.log('📊 Résultat de connexion:');
        console.log('   Status:', res.statusCode);

        if (res.statusCode === 200) {
          console.log('   ✅ CONNEXION RÉUSSIE !');
          console.log('   Token reçu:', result.data.token ? 'Oui' : 'Non');
          console.log('   Utilisateur:', result.data.user?.email);
        } else if (res.statusCode === 403) {
          console.log('   ⚠️  ERREUR 403 - Vérification email requise');
          console.log('   Message:', result.data.error);
          console.log('\n   📝 PROBLÈME IDENTIFIÉ:');
          console.log('   L\'email n\'est pas marqué comme vérifié');
          console.log('   La correction a été appliquée dans password-reset.js');
        } else if (res.statusCode === 401) {
          console.log('   ❌ ERREUR 401 - Identifiants incorrects');
        }

        console.log('\n   Réponse complète:', JSON.stringify(result.data, null, 2));
        resolve(result);
      });
    });

    req.on('error', (err) => {
      console.error('❌ Erreur requête:', err.message);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

// Instructions pour tester
console.log('📝 POUR TESTER:');
console.log('1. Réinitialisez votre mot de passe via l\'interface');
console.log('2. Modifiez ci-dessous avec vos identifiants');
console.log('3. Exécutez ce script\n');

// Exemple de test (à modifier avec vos vrais identifiants)
const TEST_EMAIL = 'votre.email@example.com';
const TEST_PASSWORD = 'VotreNouveauMotDePasse';

console.log(`Test avec : ${TEST_EMAIL}\n`);

// Décommenter pour tester avec de vrais identifiants
// testLogin(TEST_EMAIL, TEST_PASSWORD);

console.log('\n💡 SOLUTION APPLIQUÉE:');
console.log('════════════════════════════════════════');
console.log('Après une réinitialisation réussie, l\'email est');
console.log('automatiquement marqué comme vérifié car l\'utilisateur');
console.log('a prouvé qu\'il a accès à cet email.');
console.log('\nLa connexion devrait maintenant fonctionner !');