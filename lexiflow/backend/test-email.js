require('dotenv').config();
const nodemailer = require('nodemailer');

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

// Créer le transporteur
const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Test 1 : Vérifier la connexion
console.log('🔌 Test de connexion au serveur email...');
transporter.verify((error, success) => {
  if (error) {
    console.log('\n❌ ERREUR DE CONNEXION:');
    console.log(error.message);

    if (error.message.includes('Invalid login')) {
      console.log('\n💡 Solutions possibles:');
      console.log('1. Vérifiez que vous utilisez un mot de passe d\'application (16 caractères)');
      console.log('2. Vérifiez que la validation en 2 étapes est activée sur Gmail');
      console.log('3. Le mot de passe ne doit PAS contenir d\'espaces');
    }
  } else {
    console.log('✅ Connexion réussie!\n');

    // Test 2 : Envoyer un email de test
    console.log('📤 Envoi d\'un email de test...');

    const testEmail = process.env.EMAIL_USER; // S'envoyer à soi-même

    transporter.sendMail({
      from: '"LexiFlow Test" <' + process.env.EMAIL_USER + '>',
      to: testEmail,
      subject: '✅ Test Email - LexiFlow',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #3b82f6;">🎉 Configuration Email Réussie!</h1>
          <p>Si vous recevez cet email, votre configuration Gmail est correcte.</p>
          <p style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
            <strong>Configuration utilisée:</strong><br>
            - Serveur: ${process.env.EMAIL_HOST}<br>
            - Port: ${process.env.EMAIL_PORT}<br>
            - Email: ${process.env.EMAIL_USER}
          </p>
          <p style="color: #10b981; font-weight: bold;">
            ✅ Tout fonctionne! Vous pouvez maintenant utiliser la récupération de mot de passe.
          </p>
        </div>
      `
    }, (error, info) => {
      if (error) {
        console.log('\n❌ ERREUR D\'ENVOI:');
        console.log(error.message);
      } else {
        console.log('✅ Email envoyé avec succès!');
        console.log('📬 Vérifiez votre boîte de réception:', testEmail);
        console.log('📧 ID du message:', info.messageId);
        console.log('\n🎉 CONFIGURATION TERMINÉE AVEC SUCCÈS!');
      }
      process.exit(0);
    });
  }
});