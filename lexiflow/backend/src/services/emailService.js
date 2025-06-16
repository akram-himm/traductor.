const nodemailer = require('nodemailer');

// Configuration du transporteur
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const emailService = {
  // Email de bienvenue après inscription
  async sendWelcome(email, name) {
    const mailOptions = {
      from: '"LexiFlow" <noreply@lexiflow.com>',
      to: email,
      subject: 'Bienvenue sur LexiFlow ! 🌐',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6;">Bienvenue ${name || ''} !</h1>
          <p>Merci de rejoindre LexiFlow, votre compagnon linguistique intelligent.</p>
          
          <h2>🎯 Pour bien démarrer :</h2>
          <ul>
            <li>Installez l'extension depuis le Chrome Web Store</li>
            <li>Sélectionnez n'importe quel mot sur une page web</li>
            <li>Créez vos premières flashcards (limite : 50 en gratuit)</li>
          </ul>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>🎁 Offre Early Bird Exclusive</h3>
            <p>Passez à Premium pour seulement <strong>2.99€/mois</strong> et débloquez :</p>
            <ul>
              <li>✨ Traductions DeepSeek AI</li>
              <li>📚 200 flashcards (4x plus !)</li>
              <li>🎮 Mode Pratique interactif</li>
              <li>🔊 Prononciation audio</li>
            </ul>
            <a href="${process.env.FRONTEND_URL}/pricing" 
               style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
               Découvrir Premium
            </a>
          </div>
          
          <p>Des questions ? Répondez simplement à cet email.</p>
          <p>L'équipe LexiFlow</p>
        </div>
      `
    };
    
    try {
      await transporter.sendMail(mailOptions);
      console.log('Email de bienvenue envoyé à:', email);
    } catch (error) {
      console.error('Erreur envoi email:', error);
    }
  },
  
  // Email de bienvenue Premium
  async sendWelcomePremium(email, name) {
    const mailOptions = {
      from: '"LexiFlow" <noreply@lexiflow.com>',
      to: email,
      subject: '🎉 Bienvenue dans LexiFlow Premium !',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6;">Félicitations ${name || ''} !</h1>
          <p>Vous êtes maintenant membre Premium de LexiFlow.</p>
          
          <h2>✨ Vos avantages Premium :</h2>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
            <ul style="list-style: none; padding: 0;">
              <li>🤖 <strong>DeepSeek AI</strong> - Traductions ultra-précises</li>
              <li>📚 <strong>200 flashcards</strong> - 4x plus qu'en gratuit</li>
              <li>🎮 <strong>Mode Pratique</strong> - Apprenez en jouant</li>
              <li>🔊 <strong>Prononciation audio</strong> - Parlez comme un natif</li>
              <li>☁️ <strong>Synchronisation</strong> - Vos données partout</li>
              <li>🎯 <strong>Support prioritaire</strong> - Réponse en 24h</li>
            </ul>
          </div>
          
          <h3>💡 Conseils pour profiter au maximum :</h3>
          <ol>
            <li>Activez DeepSeek AI dans les paramètres</li>
            <li>Essayez le Mode Pratique avec vos flashcards</li>
            <li>Utilisez la prononciation audio pour améliorer votre accent</li>
          </ol>
          
          <p>Merci de nous faire confiance !</p>
          <p>L'équipe LexiFlow</p>
          
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            Votre abonnement sera renouvelé automatiquement. 
            Vous pouvez l'annuler à tout moment depuis votre compte.
          </p>
        </div>
      `
    };
    
    try {
      await transporter.sendMail(mailOptions);
      console.log('Email Premium envoyé à:', email);
    } catch (error) {
      console.error('Erreur envoi email:', error);
    }
  },
  
  // Email de rappel limite atteinte
  async sendLimitReached(email, name, currentCount, limit) {
    const mailOptions = {
      from: '"LexiFlow" <noreply@lexiflow.com>',
      to: email,
      subject: '⚠️ Limite de flashcards atteinte',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f59e0b;">Limite atteinte !</h1>
          <p>Bonjour ${name || ''},</p>
          
          <p>Vous avez atteint votre limite de <strong>${limit} flashcards</strong> en version gratuite.</p>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>🚀 Passez à Premium pour continuer !</h3>
            <p>Avec Premium, vous pouvez créer jusqu'à <strong>200 flashcards</strong> et profiter de :</p>
            <ul>
              <li>Traductions DeepSeek AI ultra-précises</li>
              <li>Mode Pratique pour réviser efficacement</li>
              <li>Prononciation audio native</li>
            </ul>
            <p><strong>Offre spéciale : 2.99€/mois seulement !</strong></p>
            <a href="${process.env.FRONTEND_URL}/pricing" 
               style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
               Passer à Premium
            </a>
          </div>
          
          <p>Continuez votre apprentissage sans limites !</p>
          <p>L'équipe LexiFlow</p>
        </div>
      `
    };
    
    try {
      await transporter.sendMail(mailOptions);
      console.log('Email limite atteinte envoyé à:', email);
    } catch (error) {
      console.error('Erreur envoi email:', error);
    }
  }
};

module.exports = emailService;
