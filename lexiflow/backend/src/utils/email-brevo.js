const nodemailer = require('nodemailer');

// Configuration pour Brevo (SendinBlue)
// GRATUIT: 300 emails/jour, pas besoin de téléphone!

console.log('📧 Configuration email Brevo:', {
  service: 'Brevo (SendinBlue)',
  host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
  port: process.env.EMAIL_PORT || 587,
  user: process.env.EMAIL_USER,
  passSet: !!process.env.EMAIL_PASS
});

// Créer le transporteur avec configuration Brevo
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true pour 465, false pour 587
  auth: {
    user: process.env.EMAIL_USER, // Votre login Brevo
    pass: process.env.EMAIL_PASS  // Votre SMTP Key Brevo
  }
});

// Vérifier la connexion au démarrage
transporter.verify()
  .then(() => {
    console.log('✅ Connexion SMTP Brevo établie avec succès');
  })
  .catch((error) => {
    console.error('❌ Erreur de connexion SMTP Brevo:', error.message);
    console.error('   Vérifiez vos identifiants Brevo');
  });

const emailService = {
  // Email de réinitialisation de mot de passe
  async sendPasswordResetEmail(user, resetToken) {
    console.log(`📨 Envoi email via Brevo à: ${user.email}`);

    const baseUrl = process.env.BASE_URL || 'https://my-backend-api-cng7.onrender.com';
    const resetUrl = `${baseUrl}/reset-password.html?token=${resetToken}&email=${user.email}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"LexiFlow" <no-reply@lexiflow.com>',
      to: user.email,
      subject: 'Réinitialisation de votre mot de passe LexiFlow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6;">Réinitialisation de mot de passe</h1>
          <p>Bonjour ${user.name || ''},</p>

          <p>Vous avez demandé une réinitialisation de mot de passe pour votre compte LexiFlow.</p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
                Réinitialiser mon mot de passe
              </a>
            </p>
            <p style="font-size: 14px; color: #666;">Ce lien expirera dans 1 heure.</p>
          </div>

          <p style="font-size: 14px; color: #666;">
            Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.
          </p>

          <p style="font-size: 14px; color: #666;">
            Si le bouton ne fonctionne pas, copiez ce lien :<br>
            <a href="${resetUrl}" style="color: #3b82f6; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
      `
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email envoyé via Brevo:', info.messageId);
      console.log('   Accepted:', info.accepted);
      return info;
    } catch (error) {
      console.error('❌ Erreur envoi Brevo:', error.message);
      throw error;
    }
  },

  // Email de vérification
  async sendVerificationEmail(user, verificationToken) {
    const baseUrl = process.env.BASE_URL || 'https://my-backend-api-cng7.onrender.com';
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"LexiFlow" <no-reply@lexiflow.com>',
      to: user.email,
      subject: '🔐 Vérifiez votre email - LexiFlow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6;">Bienvenue sur LexiFlow !</h1>
          <p>Bonjour ${user.name || ''},</p>

          <p>Pour activer votre compte, veuillez vérifier votre adresse email.</p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="text-align: center;">
              <a href="${verifyUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
                Vérifier mon email
              </a>
            </p>
          </div>

          <p>L'équipe LexiFlow</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  },

  // Email de bienvenue
  async sendWelcomeEmail(user) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"LexiFlow" <no-reply@lexiflow.com>',
      to: user.email,
      subject: 'Bienvenue sur LexiFlow !',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6;">Bienvenue sur LexiFlow !</h1>
          <p>Bonjour ${user.name || ''},</p>

          <p>Merci d'avoir rejoint LexiFlow, votre compagnon linguistique intelligent.</p>

          <h2>🎯 Pour bien démarrer :</h2>
          <ol>
            <li>Installez notre extension Chrome</li>
            <li>Sélectionnez un mot sur n'importe quelle page web</li>
            <li>Créez vos premières flashcards</li>
          </ol>

          <p>L'équipe LexiFlow</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  }
};

module.exports = emailService;