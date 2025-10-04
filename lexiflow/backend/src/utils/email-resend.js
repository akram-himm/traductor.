// Service email avec Resend
const { Resend } = require('resend');

// Initialiser Resend avec l'API key
const resend = new Resend(process.env.RESEND_API_KEY);

console.log('📧 Email service: Resend');
console.log('   API Key:', process.env.RESEND_API_KEY ? '✅ Configurée' : '❌ Manquante');

const emailService = {
  // Email de réinitialisation de mot de passe
  async sendPasswordResetEmail(user, resetToken) {
    console.log(`📨 Envoi email via Resend à: ${user.email}`);

    const baseUrl = process.env.BASE_URL || 'https://my-backend-api-cng7.onrender.com';
    const resetUrl = `${baseUrl}/reset-password.html?token=${resetToken}&email=${user.email}`;

    try {
      const { data, error } = await resend.emails.send({
        from: 'LexiFlow <onboarding@resend.dev>', // Email par défaut Resend
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

            <p>L'équipe LexiFlow</p>
          </div>
        `
      });

      if (error) {
        console.error('❌ Erreur Resend:', error);
        throw new Error(error.message);
      }

      console.log('✅ Email envoyé via Resend:', data.id);
      return data;

    } catch (error) {
      console.error('❌ Erreur envoi Resend:', error.message);
      throw error;
    }
  },

  // Email de vérification
  async sendVerificationEmail(user, verificationToken) {
    const baseUrl = process.env.BASE_URL || 'https://my-backend-api-cng7.onrender.com';
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

    const { data, error } = await resend.emails.send({
      from: 'LexiFlow <onboarding@resend.dev>',
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
    });

    if (error) throw new Error(error.message);
    return data;
  },

  // Email de bienvenue
  async sendWelcomeEmail(user) {
    const { data, error } = await resend.emails.send({
      from: 'LexiFlow <onboarding@resend.dev>',
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
    });

    if (error) throw new Error(error.message);
    return data;
  }
};

module.exports = emailService;