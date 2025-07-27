const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Configuration du transporteur email
// Pour le développement, on utilise Ethereal Email (gratuit)
// En production, utiliser Gmail, SendGrid, etc.
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Pour Gmail (nécessite mot de passe d'application)
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'lexiflow.contact@gmail.com',
        pass: process.env.EMAIL_PASS // Mot de passe d'application Gmail
      }
    });
  } else {
    // Pour le développement - Email de test
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'test@ethereal.email',
        pass: 'test'
      }
    });
  }
};

const emailService = {
  // Générer un token de vérification unique
  generateVerificationToken: () => {
    return crypto.randomBytes(32).toString('hex');
  },

  // Envoyer l'email de vérification
  sendVerificationEmail: async (user, verificationToken) => {
    const transporter = createTransporter();
    
    // URL de vérification
    const verificationUrl = process.env.NODE_ENV === 'production'
      ? `https://lexiflow.onrender.com/api/auth/verify-email?token=${verificationToken}`
      : `http://localhost:3001/api/auth/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: '"LexiFlow" <noreply@lexiflow.com>',
      to: user.email,
      subject: 'Verify your LexiFlow account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6; text-align: center;">Welcome to LexiFlow! 🌐</h1>
          
          <p>Hi ${user.name || 'there'},</p>
          
          <p>Thanks for signing up! Please verify your email address to activate your account and start your 7-day free trial.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #3b82f6; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email & Start Free Trial
            </a>
          </div>
          
          <p>Or copy this link: ${verificationUrl}</p>
          
          <h3>What you get with your 7-day free trial:</h3>
          <ul>
            <li>✅ Unlimited translations</li>
            <li>✅ Access to all 11 languages</li>
            <li>✅ Unlimited flashcards</li>
            <li>✅ DeepSeek AI translations</li>
            <li>✅ Cloud synchronization</li>
          </ul>
          
          <p style="color: #666; font-size: 14px;">
            This link expires in 24 hours. If you didn't create an account, please ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            LexiFlow - Break Language Barriers<br>
            © 2025 LexiFlow. All rights reserved.
          </p>
        </div>
      `
    };
    
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Verification email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending verification email:', error);
      return { success: false, error: error.message };
    }
  },

  // Email de bienvenue après vérification
  sendWelcomeEmail: async (user) => {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: '"LexiFlow" <noreply@lexiflow.com>',
      to: user.email,
      subject: 'Welcome to LexiFlow - Your 7-day trial has started! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6; text-align: center;">Your Free Trial Has Started! 🚀</h1>
          
          <p>Hi ${user.name || 'there'},</p>
          
          <p>Great news! Your email is verified and your 7-day Premium trial is now active.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Trial Details:</h3>
            <p><strong>Start date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>End date:</strong> ${new Date(user.trialEndsAt).toLocaleDateString()}</p>
            <p><strong>Status:</strong> Premium features unlocked ✨</p>
          </div>
          
          <h3>Quick Start Guide:</h3>
          <ol>
            <li>Visit any website in your browser</li>
            <li>Select any text you want to translate</li>
            <li>Click the 🌐 icon that appears</li>
            <li>Save translations as flashcards for learning</li>
          </ol>
          
          <p>Need help? Reply to this email or check our <a href="#">support page</a>.</p>
          
          <p style="text-align: center; margin-top: 30px;">
            <a href="#" style="background-color: #10b981; color: white; padding: 12px 30px; 
                           text-decoration: none; border-radius: 5px; display: inline-block;">
              Open LexiFlow Extension
            </a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            You're receiving this because you signed up for LexiFlow.<br>
            © 2025 LexiFlow. All rights reserved.
          </p>
        </div>
      `
    };
    
    try {
      await transporter.sendMail(mailOptions);
      console.log('Welcome email sent to:', user.email);
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  },

  // Email de rappel avant fin du trial
  sendTrialEndingReminder: async (user, daysLeft) => {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: '"LexiFlow" <noreply@lexiflow.com>',
      to: user.email,
      subject: `Your LexiFlow trial ends in ${daysLeft} days ⏰`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f59e0b; text-align: center;">Your Trial Ends Soon!</h1>
          
          <p>Hi ${user.name || 'there'},</p>
          
          <p>Your 7-day free trial ends in <strong>${daysLeft} days</strong>.</p>
          
          <p>Don't lose access to:</p>
          <ul>
            <li>🌍 All 11 languages</li>
            <li>🧠 DeepSeek AI translations</li>
            <li>📚 Unlimited flashcards</li>
            <li>☁️ Cloud synchronization</li>
          </ul>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="#" style="background-color: #3b82f6; color: white; padding: 12px 30px; 
                           text-decoration: none; border-radius: 5px; display: inline-block;">
              Upgrade to Premium - $4.99/month
            </a>
          </p>
          
          <p style="text-align: center; color: #666;">
            Early Bird offer: Save 37.5% forever!
          </p>
        </div>
      `
    };
    
    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending trial reminder:', error);
    }
  }
};

module.exports = emailService;