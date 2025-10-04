// Test avec différents emails pour voir si c'est spécifique à akramhimmich21
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testOtherEmails() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'lexiflow.contact@gmail.com',
      pass: 'ntmxvkzflvmumknt'
    }
  });

  console.log('🧪 TEST AVEC DIFFÉRENTS EMAILS');
  console.log('================================\n');

  // Liste d'emails à tester
  const emails = [
    'akramhimmich21@gmail.com',     // Ton email principal
    'saadakram159@gmail.com',        // Autre email si tu l'as
    'lexiflow.contact@gmail.com'     // S'envoyer à soi-même
  ];

  for (const email of emails) {
    console.log(`📧 Test vers: ${email}`);

    try {
      const info = await transporter.sendMail({
        from: 'lexiflow.contact@gmail.com',
        to: email,
        subject: `Test LexiFlow - ${new Date().toLocaleTimeString()}`,
        text: `Email de test envoyé à ${new Date().toLocaleString('fr-FR')}`,
        html: `
          <div style="padding: 20px; background: #f0f0f0;">
            <h2>Test Email LexiFlow</h2>
            <p>Ceci est un email de test envoyé le ${new Date().toLocaleString('fr-FR')}</p>
            <p>Destinataire: ${email}</p>
            <hr>
            <small>Si vous recevez cet email, l'envoi fonctionne!</small>
          </div>
        `
      });

      console.log(`   ✅ Envoyé! ID: ${info.messageId}`);

    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
    }
  }

  console.log('\n📌 ACTIONS À FAIRE:');
  console.log('1. Vérifier chaque boîte mail listée ci-dessus');
  console.log('2. Si lexiflow.contact@gmail.com reçoit mais pas akramhimmich21:');
  console.log('   → C\'est un problème de filtre ou blocage côté akramhimmich21');
  console.log('3. Essayer d\'ajouter lexiflow.contact@gmail.com aux contacts');

  transporter.close();
}

testOtherEmails();