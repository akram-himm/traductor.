require('dotenv').config();

console.log('📧 Test de configuration email...\n');
console.log('Configuration actuelle:');
console.log('- HOST:', process.env.EMAIL_HOST || 'NON DÉFINI ❌');
console.log('- PORT:', process.env.EMAIL_PORT || 'NON DÉFINI ❌');
console.log('- USER:', process.env.EMAIL_USER || 'NON DÉFINI ❌');
console.log('- PASS:', process.env.EMAIL_PASS ? '******* (défini ✅)' : 'NON DÉFINI ❌');
console.log('\n');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.log('❌ Configuration manquante! Créez un fichier .env avec:');
  console.log('EMAIL_HOST=smtp.gmail.com');
  console.log('EMAIL_PORT=587');
  console.log('EMAIL_USER=votre@gmail.com');
  console.log('EMAIL_PASS=votremotdepasseapp');
  process.exit(1);
}

// Import nodemailer différemment pour Node.js v22
let nodemailer;
try {
  nodemailer = require('nodemailer');
  console.log('✅ Nodemailer chargé correctement\n');
} catch (error) {
  console.log('❌ Erreur de chargement nodemailer:', error.message);
  console.log('Installez-le avec: npm install nodemailer');
  process.exit(1);
}

// Créer le transporteur
console.log('🔌 Création du transporteur email...');
let transporter;
try {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true pour 465, false pour 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false // Accepter les certificats auto-signés (dev seulement)
    }
  });
  console.log('✅ Transporteur créé\n');
} catch (error) {
  console.log('❌ Erreur création transporteur:', error.message);
  process.exit(1);
}

// Test 1 : Vérifier la connexion
console.log('🔌 Test de connexion au serveur email...');
transporter.verify(function(error, success) {
  if (error) {
    console.log('\n❌ ERREUR DE CONNEXION:');
    console.log(error.message);

    if (error.message.includes('Invalid login') || error.message.includes('Username and Password not accepted')) {
      console.log('\n💡 Solutions possibles:');
      console.log('1. Vérifiez que vous utilisez un mot de passe d\'application (16 caractères)');
      console.log('2. Vérifiez que la validation en 2 étapes est activée sur Gmail');
      console.log('3. Le mot de passe ne doit PAS contenir d\'espaces');
      console.log('4. Vérifiez que le compte Gmail n\'est pas bloqué');
      console.log('\n📝 Pour créer un mot de passe d\'application:');
      console.log('1. Allez sur https://myaccount.google.com/security');
      console.log('2. Activez "Validation en deux étapes"');
      console.log('3. Cherchez "Mots de passe des applications"');
      console.log('4. Créez un nouveau mot de passe pour "Messagerie"');
    }
    process.exit(1);
  } else {
    console.log('✅ Connexion réussie!\n');

    // Test 2 : Envoyer un email de test
    console.log('📤 Envoi d\'un email de test...');

    const testEmail = process.env.EMAIL_USER; // S'envoyer à soi-même

    const mailOptions = {
      from: '"LexiFlow Test" <' + process.env.EMAIL_USER + '>',
      to: testEmail,
      subject: '✅ Test Email - LexiFlow Configuration',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6;">🎉 Configuration Email Réussie!</h1>
          <p>Si vous recevez cet email, votre configuration Gmail pour LexiFlow est correcte.</p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937;">Configuration utilisée:</h3>
            <ul style="color: #4b5563;">
              <li><strong>Serveur:</strong> ${process.env.EMAIL_HOST}</li>
              <li><strong>Port:</strong> ${process.env.EMAIL_PORT}</li>
              <li><strong>Email:</strong> ${process.env.EMAIL_USER}</li>
              <li><strong>Date test:</strong> ${new Date().toLocaleString('fr-FR')}</li>
            </ul>
          </div>

          <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #065f46; font-weight: bold; margin: 0;">
              ✅ Tout fonctionne! Les fonctionnalités suivantes sont maintenant actives:
            </p>
            <ul style="color: #065f46; margin-top: 10px;">
              <li>Récupération de mot de passe</li>
              <li>Vérification d'email à l'inscription</li>
              <li>Notifications de paiement</li>
            </ul>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            Cet email a été envoyé automatiquement par le script de test.
          </p>
        </div>
      `
    };

    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log('\n❌ ERREUR D\'ENVOI:');
        console.log(error.message);
        process.exit(1);
      } else {
        console.log('✅ Email envoyé avec succès!');
        console.log('📬 Vérifiez votre boîte de réception:', testEmail);
        console.log('📧 ID du message:', info.messageId);
        console.log('\n🎉 CONFIGURATION TERMINÉE AVEC SUCCÈS!');
        console.log('\n📝 Prochaines étapes:');
        console.log('1. Ajoutez ces variables sur Render.com');
        console.log('2. Testez "Mot de passe oublié" dans l\'extension');
        console.log('3. La récupération de mot de passe est maintenant active!');
        process.exit(0);
      }
    });
  }
});