const nodemailer = require('nodemailer');

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const emailService = {
  // Email de vérification
  async sendVerificationEmail(user, verificationToken) {
    const baseUrl = process.env.BASE_URL || 'https://my-backend-api-cng7.onrender.com';
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: '"LexiFlow" <noreply@lexiflow.com>',
      to: user.email,
      subject: '🔐 Vérifiez votre email - LexiFlow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6;">Bienvenue sur LexiFlow !</h1>
          <p>Bonjour ${user.name || ''},</p>

          <p>Merci de vous être inscrit ! Pour activer votre compte, veuillez vérifier votre adresse email.</p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin-bottom: 20px;">Cliquez sur le bouton ci-dessous pour vérifier votre email :</p>
            <a href="${verifyUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Vérifier mon email
            </a>
            <p style="font-size: 12px; color: #666; margin-top: 16px;">
              Ce lien expire dans 24 heures
            </p>
          </div>

          <p style="font-size: 14px; color: #666;">
            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
            <a href="${verifyUrl}" style="color: #3b82f6; word-break: break-all; font-size: 12px;">${verifyUrl}</a>
          </p>

          <p style="font-size: 14px; color: #666;">
            Si vous n'avez pas créé de compte, ignorez cet email.
          </p>

          <p>L'équipe LexiFlow</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  },

  // Email de bienvenue
  async sendWelcomeEmail(user) {
    const mailOptions = {
      from: '"LexiFlow" <noreply@lexiflow.com>',
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
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #3b82f6;">🎁 Offre Early Bird</h3>
            <p>Passez à Premium pour seulement <strong>2.99€/mois</strong> et profitez de :</p>
            <ul>
              <li>✨ Traductions DeepSeek AI</li>
              <li>📚 200 flashcards (4x plus !)</li>
              <li>🎮 Mode Pratique interactif</li>
              <li>🔊 Prononciation audio</li>
            </ul>
          </div>
          
          <p>Des questions ? Répondez simplement à cet email.</p>
          
          <p>L'équipe LexiFlow</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  },

  // Email de confirmation de paiement
  async sendPaymentSuccessEmail(user, subscription) {
    const endDate = new Date(subscription.currentPeriodEnd);
    const mailOptions = {
      from: '"LexiFlow" <noreply@lexiflow.com>',
      to: user.email,
      subject: 'Votre abonnement LexiFlow Premium est actif !',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6;">Merci de votre confiance !</h1>
          <p>Bonjour ${user.name || ''},</p>
          
          <p>Votre abonnement Premium est maintenant actif jusqu'au ${endDate.toLocaleDateString('fr-FR')}.</p>
          
          <h2>✨ Vos avantages Premium :</h2>
          <ul>
            <li>🤖 DeepSeek AI pour des traductions de haute précision</li>
            <li>📚 Limite augmentée à 200 flashcards</li>
            <li>📝 Traduction de textes jusqu'à 350 caractères</li>
            <li>🎮 Mode Pratique pour réviser efficacement</li>
            <li>🔊 Prononciation audio native</li>
          </ul>
          
          <p>Profitez au maximum de votre expérience Premium !</p>
          
          <p>L'équipe LexiFlow</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  },

  // Email d'annulation d'abonnement
  async sendSubscriptionCanceledEmail(user, subscription) {
    const endDate = new Date(subscription.currentPeriodEnd);
    const mailOptions = {
      from: '"LexiFlow" <noreply@lexiflow.com>',
      to: user.email,
      subject: 'Votre abonnement LexiFlow a été annulé',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6;">Annulation confirmée</h1>
          <p>Bonjour ${user.name || ''},</p>
          
          <p>Nous confirmons l'annulation de votre abonnement Premium.</p>
          <p>Vous conservez l'accès Premium jusqu'au ${endDate.toLocaleDateString('fr-FR')}.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Ce qui va changer après cette date :</h3>
            <ul>
              <li>Limite de 50 flashcards</li>
              <li>Limite de 100 caractères par traduction</li>
              <li>Plus d'accès à DeepSeek AI</li>
              <li>Plus d'accès au Mode Pratique</li>
            </ul>
          </div>
          
          <p>Vous pouvez réactiver votre abonnement à tout moment depuis votre compte.</p>
          
          <p>L'équipe LexiFlow</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  },

  // Email de réinitialisation de mot de passe
  async sendPasswordResetEmail(user, resetToken) {
    const baseUrl = process.env.BASE_URL || 'https://my-backend-api-cng7.onrender.com';
    const resetUrl = `${baseUrl}/reset-password.html?token=${resetToken}&email=${user.email}`;
    
    const mailOptions = {
      from: '"LexiFlow" <noreply@lexiflow.com>',
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
            Votre mot de passe restera inchangé.
          </p>
          
          <p style="font-size: 14px; color: #666;">
            Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
            <a href="${resetUrl}" style="color: #3b82f6; word-break: break-all;">${resetUrl}</a>
          </p>
          
          <p>L'équipe LexiFlow</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  },

  // Email d'échec de paiement
  async sendPaymentFailedEmail(user) {
    const mailOptions = {
      from: '"LexiFlow" <noreply@lexiflow.com>',
      to: user.email,
      subject: 'Problème avec votre paiement LexiFlow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">Problème de paiement détecté</h1>
          <p>Bonjour ${user.name || ''},</p>
          
          <p>Nous n'avons pas pu prélever le montant de votre abonnement Premium.</p>
          
          <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>🚨 Action requise :</h3>
            <p>Pour éviter l'interruption de vos services Premium, veuillez :</p>
            <ol>
              <li>Vérifier que votre carte n'est pas expirée</li>
              <li>Vous assurer que vous avez suffisamment de fonds</li>
              <li>Mettre à jour vos informations de paiement</li>
            </ol>
          </div>
          
          <p><a href="${process.env.FRONTEND_URL}/settings/billing" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Mettre à jour mon moyen de paiement</a></p>
          
          <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
          
          <p>L'équipe LexiFlow</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  }
};

module.exports = emailService;
