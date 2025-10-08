// Test de récupération de mot de passe avec SendGrid
require('dotenv').config();

console.log('🚀 TEST SENDGRID - Récupération de mot de passe');
console.log('==============================================\n');

// Vérifier la configuration
if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === 'your_sendgrid_api_key_here') {
  console.error('❌ SENDGRID_API_KEY non configurée dans .env');
  console.log('\n📝 Configuration SendGrid :');
  console.log('1. Créez un compte sur https://sendgrid.com');
  console.log('2. Allez dans Settings > API Keys');
  console.log('3. Créez une nouvelle API Key avec "Full Access"');
  console.log('4. Ajoutez dans .env:');
  console.log('   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx');
  console.log('\n✨ Avantages SendGrid :');
  console.log('   - 100 emails/jour gratuits (vs 100/mois pour Resend)');
  console.log('   - Pas de restriction sur les destinataires');
  console.log('   - API REST (fonctionne sur Render)');
  console.log('   - Statistiques détaillées');
  process.exit(1);
}

console.log('✅ Clé API SendGrid détectée');

// Vérifier si @sendgrid/mail est installé
try {
  require('@sendgrid/mail');
  console.log('✅ Package @sendgrid/mail installé');
} catch {
  console.error('❌ Package @sendgrid/mail non installé');
  console.log('\n📦 Installation :');
  console.log('   cd lexiflow/backend');
  console.log('   npm install @sendgrid/mail');
  process.exit(1);
}

// Simuler un utilisateur
const fakeUser = {
  email: 'akramhimmich21@gmail.com', // SendGrid permet d'envoyer à n'importe quel email !
  name: 'Akram'
};

// Générer un token de test
const crypto = require('crypto');
const resetToken = crypto.randomBytes(32).toString('hex');

// Utiliser le service emailSendGrid
const emailService = require('./src/utils/emailSendGrid');

async function testPasswordReset() {
  try {
    console.log('\n📧 Envoi de l\'email de récupération...');
    console.log('   À:', fakeUser.email);
    console.log('   Token:', resetToken.substring(0, 20) + '...');

    const result = await emailService.sendPasswordResetEmail(fakeUser, resetToken);

    console.log('\n✅ Email envoyé avec succès!');
    console.log('   Status:', result[0]?.statusCode);
    console.log('\n📬 Vérifiez votre boîte mail');
    console.log('   → Cliquez sur le lien reçu');
    console.log('   → Entrez votre nouveau mot de passe');

    console.log('\n📊 Avantages SendGrid :');
    console.log('   ✅ 100 emails/jour (3000/mois!)');
    console.log('   ✅ Envoie à n\'importe quel email');
    console.log('   ✅ Dashboard avec statistiques');
    console.log('   ✅ Meilleure délivrabilité');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);

    if (error.code === 401) {
      console.log('\n⚠️  Clé API invalide');
      console.log('   Vérifiez que SENDGRID_API_KEY est correcte');
    }

    if (error.code === 403) {
      console.log('\n⚠️  Email expéditeur non vérifié');
      console.log('   1. Allez sur SendGrid > Settings > Sender Authentication');
      console.log('   2. Vérifiez l\'email: lexiflow.contact@gmail.com');
    }

    if (error.response) {
      console.log('\n📝 Détails de l\'erreur:');
      console.log(error.response.body);
    }
  }
}

// Lancer le test
testPasswordReset();