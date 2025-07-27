// Test simple de Stripe - Aucune dépendance requise sauf dotenv et stripe

console.log('🧪 Test Stripe Simple\n');

try {
  // Charger les variables d'environnement
  require('dotenv').config();
  
  // Vérifier que les clés existent
  if (!process.env.STRIPE_SECRET_KEY) {
    console.log('❌ ERREUR: STRIPE_SECRET_KEY n\'est pas définie dans le fichier .env');
    console.log('Assurez-vous d\'avoir un fichier .env dans le dossier backend/');
    process.exit(1);
  }
  
  console.log('✅ Variables d\'environnement trouvées!');
  console.log('- Clé secrète:', process.env.STRIPE_SECRET_KEY.substring(0, 20) + '...');
  console.log('- Mode: TEST (car la clé commence par sk_test_)');
  
  // Tester la connexion Stripe
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  
  stripe.accounts.retrieve()
    .then(account => {
      console.log('\n✅ SUCCÈS! Connexion à Stripe réussie!');
      console.log('- Email du compte:', account.email);
      console.log('- ID du compte:', account.id);
      console.log('\n🎉 Votre configuration Stripe fonctionne parfaitement!');
    })
    .catch(error => {
      console.log('\n❌ ERREUR de connexion à Stripe:', error.message);
    });
    
} catch (error) {
  console.log('❌ ERREUR:', error.message);
  console.log('\nAssurez-vous d\'avoir fait:');
  console.log('1. cd backend');
  console.log('2. npm install');
  console.log('3. Créer un fichier .env avec les bonnes clés');
}