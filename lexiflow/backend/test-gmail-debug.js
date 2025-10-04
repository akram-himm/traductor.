// Test approfondi avec debug Gmail
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testGmailDebug() {
  console.log('🔍 DEBUG COMPLET GMAIL');
  console.log('======================\n');

  // 1. Vérifier les variables
  console.log('📋 Variables d\'environnement:');
  console.log('   EMAIL_USER:', process.env.EMAIL_USER || 'Non défini ❌');
  console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? `✅ ${process.env.EMAIL_PASS.substring(0, 4)}...` : 'Non défini ❌');
  console.log('\n');

  // 2. Créer transporteur avec debug activé
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'lexiflow.contact@gmail.com',
      pass: 'ntmxvkzflvmumknt'
    },
    debug: true, // Active le mode debug
    logger: true  // Active les logs
  });

  // 3. Tester différentes configurations d'envoi
  const testConfigs = [
    {
      name: 'Test 1: Email simple',
      options: {
        from: 'lexiflow.contact@gmail.com',
        to: 'akramhimmich21@gmail.com',
        subject: 'Test Simple LexiFlow',
        text: 'Test simple sans HTML'
      }
    },
    {
      name: 'Test 2: Avec nom d\'expéditeur',
      options: {
        from: '"LexiFlow" <lexiflow.contact@gmail.com>',
        to: 'akramhimmich21@gmail.com',
        subject: 'Test avec nom LexiFlow',
        html: '<p>Test avec HTML</p>'
      }
    },
    {
      name: 'Test 3: Reply-To différent',
      options: {
        from: 'lexiflow.contact@gmail.com',
        to: 'akramhimmich21@gmail.com',
        replyTo: 'no-reply@lexiflow.com',
        subject: 'Test Reply-To LexiFlow',
        text: 'Test avec Reply-To'
      }
    }
  ];

  console.log('📧 Destinataire: akramhimmich21@gmail.com\n');

  for (const config of testConfigs) {
    console.log(`\n🔄 ${config.name}`);
    console.log('----------------------------------------');

    try {
      const info = await transporter.sendMail(config.options);
      console.log('✅ Succès!');
      console.log('   Message ID:', info.messageId);
      console.log('   Response:', info.response);
      console.log('   Accepted:', info.accepted);
      console.log('   Rejected:', info.rejected);
    } catch (error) {
      console.error('❌ Erreur:', error.message);
      if (error.response) {
        console.error('   Response:', error.response);
      }
      if (error.command) {
        console.error('   Command:', error.command);
      }
    }
  }

  console.log('\n');
  console.log('📌 VÉRIFICATIONS À FAIRE DANS GMAIL:');
  console.log('=====================================');
  console.log('1. BOÎTE DE RÉCEPTION principale');
  console.log('2. Dossier SPAM/Courrier indésirable');
  console.log('3. Onglet "Promotions" ou "Social"');
  console.log('4. Dossier "Tous les messages"');
  console.log('5. Corbeille (au cas où)');
  console.log('\n');
  console.log('🔍 RECHERCHE GMAIL:');
  console.log('   Dans Gmail, recherchez: from:lexiflow.contact@gmail.com');
  console.log('   Ou recherchez: LexiFlow');
  console.log('\n');
  console.log('⚙️ SI RIEN REÇU:');
  console.log('   1. Vérifiez les filtres Gmail');
  console.log('   2. Vérifiez la liste de blocage');
  console.log('   3. Essayez avec une autre adresse email');

  // Fermer la connexion
  transporter.close();
}

testGmailDebug().catch(console.error);