// Test pour configurer et tester Brevo (SendinBlue)
require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🚀 TEST BREVO (SendinBlue) - Service Email GRATUIT');
console.log('====================================================\n');

console.log('📝 INSTRUCTIONS:');
console.log('1. Créez un compte sur: https://app.brevo.com/fr/signup');
console.log('2. Allez dans: Transactional → Settings → SMTP & API');
console.log('3. Générez une SMTP Key');
console.log('4. Mettez à jour les variables ci-dessous:\n');

// REMPLACEZ CES VALEURS avec vos identifiants Brevo
const BREVO_CONFIG = {
  host: 'smtp-relay.brevo.com',
  port: 587,
  user: 'VOTRE_EMAIL_BREVO@gmail.com', // ← Remplacez
  pass: 'VOTRE_SMTP_KEY_BREVO'          // ← Remplacez (ressemble à: xsmtpsib-xxx...)
};

async function testBrevo() {
  console.log('Configuration actuelle:');
  console.log('  Host:', BREVO_CONFIG.host);
  console.log('  Port:', BREVO_CONFIG.port);
  console.log('  User:', BREVO_CONFIG.user);
  console.log('  Pass:', BREVO_CONFIG.pass.substring(0, 10) + '...');
  console.log('\n');

  if (BREVO_CONFIG.user === 'VOTRE_EMAIL_BREVO@gmail.com') {
    console.log('⚠️  ATTENTION: Vous devez d\'abord remplacer les identifiants!');
    console.log('   Éditez ce fichier et mettez vos vrais identifiants Brevo');
    return;
  }

  // Créer le transporteur
  const transporter = nodemailer.createTransport({
    host: BREVO_CONFIG.host,
    port: BREVO_CONFIG.port,
    secure: false,
    auth: {
      user: BREVO_CONFIG.user,
      pass: BREVO_CONFIG.pass
    }
  });

  try {
    // 1. Vérifier la connexion
    console.log('1️⃣ Test de connexion à Brevo...');
    await transporter.verify();
    console.log('✅ Connexion réussie!\n');

    // 2. Envoyer un email de test
    console.log('2️⃣ Envoi d\'un email de test à akramhimmich21@gmail.com...');

    const info = await transporter.sendMail({
      from: '"LexiFlow Test" <no-reply@lexiflow.com>',
      to: 'akramhimmich21@gmail.com',
      subject: '✅ Test Brevo - LexiFlow fonctionne!',
      html: `
        <div style="font-family: Arial; padding: 20px; background: #f0f0f0;">
          <h1 style="color: #22c55e;">✅ Brevo fonctionne!</h1>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>🎉 Félicitations!</h2>
            <p>L'envoi d'email via <strong>Brevo</strong> fonctionne parfaitement.</p>

            <p><strong>Prochaines étapes:</strong></p>
            <ol>
              <li>Ajoutez ces variables sur Render.com:</li>
            </ol>

            <div style="background: #f0f0f0; padding: 10px; border-radius: 5px; font-family: monospace;">
              EMAIL_HOST = smtp-relay.brevo.com<br>
              EMAIL_PORT = 587<br>
              EMAIL_USER = ${BREVO_CONFIG.user}<br>
              EMAIL_PASS = ${BREVO_CONFIG.pass.substring(0, 10)}...<br>
              EMAIL_FROM = no-reply@lexiflow.com
            </div>

            <p style="margin-top: 20px;">
              <strong>Avantages de Brevo:</strong>
            </p>
            <ul>
              <li>✅ 300 emails/jour GRATUIT</li>
              <li>✅ Pas de numéro de téléphone requis</li>
              <li>✅ Fonctionne sur tous les serveurs cloud</li>
              <li>✅ Statistiques détaillées</li>
            </ul>
          </div>

          <p style="color: #666; font-size: 14px;">
            Email envoyé le ${new Date().toLocaleString('fr-FR')}
          </p>
        </div>
      `
    });

    console.log('✅ Email envoyé avec succès!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);

    console.log('\n====================================================');
    console.log('🎯 SUCCÈS TOTAL!');
    console.log('\nMaintenant, ajoutez ces variables sur Render.com:');
    console.log('  EMAIL_HOST = smtp-relay.brevo.com');
    console.log('  EMAIL_PORT = 587');
    console.log('  EMAIL_USER =', BREVO_CONFIG.user);
    console.log('  EMAIL_PASS =', BREVO_CONFIG.pass);
    console.log('  EMAIL_FROM = no-reply@lexiflow.com');
    console.log('\n✅ Vérifiez votre boîte mail!');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n💡 Solutions:');
    console.log('1. Vérifiez que vous avez créé un compte Brevo');
    console.log('2. Vérifiez que vous avez généré une SMTP Key');
    console.log('3. Vérifiez que vous avez mis les bons identifiants');
  }
}

testBrevo();