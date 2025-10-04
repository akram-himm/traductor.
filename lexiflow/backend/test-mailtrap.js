// MAILTRAP - Pour tester immédiatement!
// Parfait pour le développement (emails fictifs)

const nodemailer = require('nodemailer');

console.log('🧪 MAILTRAP - Test Email (Development)');
console.log('========================================\n');

console.log('📝 Configuration:');
console.log('1. Va sur: https://mailtrap.io/register/signup');
console.log('2. Confirme ton email');
console.log('3. Dans "Sandbox" → "SMTP Settings"');
console.log('4. Copie les identifiants\n');

// Configuration Mailtrap (GRATUIT, fonctionne immédiatement)
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "6d5e9a3b7c8f2e",  // ← Remplace avec ton user Mailtrap
    pass: "a1b2c3d4e5f6g7"  // ← Remplace avec ton pass Mailtrap
  }
});

async function testMailtrap() {
  try {
    console.log('📧 Envoi email de test...\n');

    const info = await transporter.sendMail({
      from: '"LexiFlow" <test@lexiflow.com>',
      to: "akramhimmich21@gmail.com",
      subject: "✅ Test Mailtrap - LexiFlow",
      html: `
        <h1>Mailtrap fonctionne!</h1>
        <p>Ceci est un email de test.</p>
        <p>Les emails sont visibles dans ton dashboard Mailtrap.</p>
        <p>Parfait pour tester sans envoyer de vrais emails!</p>
      `
    });

    console.log('✅ Email envoyé!');
    console.log('   ID:', info.messageId);
    console.log('\n📌 IMPORTANT:');
    console.log('   Les emails sont dans ton dashboard Mailtrap');
    console.log('   (pas dans ta vraie boîte mail)');
    console.log('   Parfait pour tester!');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testMailtrap();