// Test RESEND - Le service email le plus simple!
// GRATUIT: 100 emails/jour, pas de téléphone

console.log('🚀 RESEND - Service Email Ultra Simple');
console.log('=========================================\n');

console.log('📝 INSTALLATION RAPIDE (2 minutes):');
console.log('1. Créez un compte: https://resend.com/signup');
console.log('2. Obtenez votre API Key');
console.log('3. Installez: npm install resend');
console.log('4. C\'est tout!\n');

// Clé API Resend configurée
const RESEND_API_KEY = 're_jdZHqwcu_BEp5VrnNH6ZVu6zXvBgPFK8z';

async function testResend() {
  // Installer d'abord: npm install resend
  let Resend;
  try {
    const { Resend: ResendClass } = require('resend');
    Resend = ResendClass;
  } catch (error) {
    console.log('❌ Installez d\'abord Resend:');
    console.log('   npm install resend\n');
    return;
  }

  if (RESEND_API_KEY === 're_XXXXXXXXX') {
    console.log('⚠️  Remplacez d\'abord RESEND_API_KEY avec votre vraie clé!');
    console.log('   1. Allez sur: https://resend.com/signup');
    console.log('   2. Créez un compte (30 secondes)');
    console.log('   3. Copiez votre API Key');
    console.log('   4. Remplacez dans ce fichier\n');
    return;
  }

  const resend = new Resend(RESEND_API_KEY);

  try {
    console.log('📧 Envoi d\'un email de test...\n');

    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Email par défaut Resend (obligatoire au début)
      to: 'akramhimmich21@gmail.com', // Test avec ton email
      subject: '✅ Resend fonctionne - LexiFlow',
      html: `
        <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">✅ Resend fonctionne parfaitement!</h1>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>🎉 Félicitations!</h2>
            <p>Votre configuration Resend est opérationnelle.</p>

            <p><strong>Avantages de Resend:</strong></p>
            <ul>
              <li>✅ Super simple (juste une API key)</li>
              <li>✅ 100 emails/jour gratuit</li>
              <li>✅ Pas de configuration SMTP compliquée</li>
              <li>✅ Dashboard moderne</li>
              <li>✅ Webhooks inclus</li>
            </ul>

            <p style="background: white; padding: 15px; border-radius: 5px; margin-top: 20px;">
              <strong>Pour utiliser avec LexiFlow:</strong><br><br>
              Sur Render.com, ajoutez:<br>
              <code style="background: #f0f0f0; padding: 2px 5px;">
                EMAIL_SERVICE = resend<br>
                RESEND_API_KEY = ${RESEND_API_KEY}
              </code>
            </p>
          </div>

          <p style="color: #666; font-size: 14px;">
            Email envoyé via Resend le ${new Date().toLocaleString('fr-FR')}
          </p>
        </div>
      `
    });

    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }

    console.log('✅ Email envoyé avec succès!');
    console.log('   ID:', data.id);
    console.log('\n🎯 Parfait! Maintenant:');
    console.log('1. Ajoutez sur Render.com:');
    console.log('   EMAIL_SERVICE = resend');
    console.log('   RESEND_API_KEY =', RESEND_API_KEY);
    console.log('\n2. Vérifiez votre boîte mail!');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testResend();