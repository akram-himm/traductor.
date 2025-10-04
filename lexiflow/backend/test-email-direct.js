// Test direct d'envoi d'email avec les identifiants Gmail
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testDirectEmail() {
  console.log('🔧 Configuration:');
  console.log('   EMAIL_USER:', process.env.EMAIL_USER);
  console.log('   EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('   EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Défini' : '❌ Manquant');
  console.log('\n========================================\n');

  // Créer le transporteur
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || 'lexiflow.contact@gmail.com',
      pass: process.env.EMAIL_PASS || 'ntmxvkzflvmumknt'
    }
  });

  console.log('📧 Test d\'envoi d\'email à akramhimmich21@gmail.com...');

  try {
    // Vérifier la connexion
    console.log('1️⃣ Vérification de la connexion SMTP...');
    await transporter.verify();
    console.log('✅ Connexion SMTP réussie!');

    // Envoyer l'email
    console.log('2️⃣ Envoi de l\'email de test...');
    const info = await transporter.sendMail({
      from: '"LexiFlow Test" <lexiflow.contact@gmail.com>',
      to: 'akramhimmich21@gmail.com',
      subject: '🔐 Test Récupération Mot de Passe LexiFlow',
      text: 'Ceci est un test d\'envoi d\'email depuis LexiFlow.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #3b82f6;">🔐 Test Email LexiFlow</h1>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 16px;">
              <strong>Ceci est un email de test!</strong>
            </p>
            <p>Si vous recevez cet email, cela signifie que:</p>
            <ul>
              <li>✅ La configuration Gmail fonctionne</li>
              <li>✅ L'envoi d'email est opérationnel</li>
              <li>✅ Le système de récupération devrait fonctionner</li>
            </ul>
          </div>

          <p style="color: #666; font-size: 14px;">
            Email envoyé le: ${new Date().toLocaleString('fr-FR')}
          </p>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e5e5;">

          <p style="color: #999; font-size: 12px;">
            Cet email a été envoyé depuis le script de test LexiFlow.
          </p>
        </div>
      `
    });

    console.log('✅ Email envoyé avec succès!');
    console.log('   Message ID:', info.messageId);
    console.log('\n🎉 SUCCÈS COMPLET!');
    console.log('   → Vérifiez votre boîte mail: saadakram159@gmail.com');
    console.log('   → Vérifiez aussi les SPAMS');
    console.log('   → L\'email devrait arriver dans quelques secondes');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n💡 Solutions possibles:');
    console.log('   1. Vérifiez que le mot de passe d\'application Gmail est correct');
    console.log('   2. Vérifiez que la validation en 2 étapes est activée dans Gmail');
    console.log('   3. Vérifiez les paramètres de sécurité Gmail');
  }
}

testDirectEmail();