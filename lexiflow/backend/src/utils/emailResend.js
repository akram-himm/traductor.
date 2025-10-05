const { Resend } = require('resend');

// Initialiser Resend avec la clé API
const resend = new Resend(process.env.RESEND_API_KEY);

const emailService = {
  // Email de récupération de mot de passe
  async sendPasswordResetEmail(user, resetToken) {
    console.log(`📨 Envoi email via Resend à: ${user.email}`);

    const baseUrl = process.env.BASE_URL || 'https://my-backend-api-cng7.onrender.com';
    const resetUrl = `${baseUrl}/reset-password.html?token=${resetToken}&email=${user.email}`;

    try {
      const { data, error } = await resend.emails.send({
        from: 'LexiFlow <onboarding@resend.dev>', // Domaine de test Resend
        to: [user.email],
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
      });

      if (error) {
        console.error('❌ Erreur Resend:', error);
        throw error;
      }

      console.log('✅ Email envoyé via Resend:', data);
      return data;
    } catch (error) {
      console.error('❌ Erreur envoi email Resend:', error);
      throw error;
    }
  },

  // Les autres méthodes peuvent être ajoutées ici plus tard
  async sendVerificationEmail(user, verificationToken) {
    // À implémenter
  },

  async sendWelcomeEmail(user) {
    // À implémenter
  }
};

module.exports = emailService;