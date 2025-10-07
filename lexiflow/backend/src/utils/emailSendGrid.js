const sgMail = require('@sendgrid/mail');

// Configurer SendGrid avec la clé API
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const emailService = {
  // Email de récupération de mot de passe
  async sendPasswordResetEmail(user, resetToken) {
    console.log(`📨 Envoi email via SendGrid à: ${user.email}`);

    // La page de réinitialisation est sur le backend, pas le frontend
    // En production, toujours utiliser l'URL Render même si BACKEND_URL n'est pas défini correctement
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://my-backend-api-cng7.onrender.com'
      : (process.env.BACKEND_URL || 'http://localhost:3001');
    const resetUrl = `${baseUrl}/reset-password.html?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    const msg = {
      to: user.email,
      from: 'lexiflow.contact@gmail.com', // Doit être vérifié sur SendGrid
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
            <a href="${resetUrl}" style="color: #3b82f6;">${resetUrl}</a>
          </p>

          <p>L'équipe LexiFlow</p>
        </div>
      `
    };

    try {
      const result = await sgMail.send(msg);
      console.log('✅ Email envoyé via SendGrid:', result[0].statusCode);
      return result;
    } catch (error) {
      console.error('❌ Erreur SendGrid:', error);
      if (error.response) {
        console.error('   Détails:', error.response.body);
      }
      throw error;
    }
  },

  // Les autres méthodes peuvent être ajoutées ici
  async sendVerificationEmail(user, verificationToken) {
    // À implémenter
  },

  async sendWelcomeEmail(user) {
    // À implémenter
  }
};

module.exports = emailService;