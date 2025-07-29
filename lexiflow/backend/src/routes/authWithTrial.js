const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const emailService = require('../utils/email');
const router = express.Router();

// Inscription avec Free Trial et vérification email
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation basique
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Mode développement sans DB
    if (process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL) {
      console.log('Mock mode - Registration with trial');
      
      // Simuler l'envoi d'email
      console.log(`[MOCK] Verification email would be sent to: ${email}`);
      
      return res.status(201).json({
        message: 'Registration successful! Please check your email to verify your account.',
        requiresVerification: true,
        mockVerificationUrl: `http://localhost:3001/api/auth/verify-email?token=mock-token-123`
      });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'This email is already registered' });
    }

    // Générer le token de vérification
    // const verificationToken = emailService.generateVerificationToken();
    const verificationToken = require('crypto').randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // Expire dans 24h

    // Créer l'utilisateur (non vérifié)
    const user = await User.create({
      email,
      password,
      name,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
      // Pas encore de trial - commence après vérification
      trialStartedAt: null,
      trialEndsAt: null
    });

    // Envoyer l'email de vérification
    // TODO: Réactiver après configuration email
    // await emailService.sendVerificationEmail(user, verificationToken);
    console.log('📧 Email de vérification désactivé temporairement');

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      requiresVerification: true
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Vérifier l'email et démarrer le Free Trial
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>❌ Invalid Link</h1>
            <p>This verification link is invalid.</p>
          </body>
        </html>
      `);
    }

    // Mode développement
    if (process.env.NODE_ENV === 'development' && token === 'mock-token-123') {
      return res.send(`
        <html>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>✅ Email Verified!</h1>
            <p>Your 7-day free trial has started.</p>
            <p>You can now close this page and return to the extension.</p>
          </body>
        </html>
      `);
    }

    // Trouver l'utilisateur avec ce token
    const user = await User.findOne({
      where: {
        emailVerificationToken: token,
        emailVerified: false
      }
    });

    if (!user) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>❌ Invalid or Expired Link</h1>
            <p>This verification link is invalid or has already been used.</p>
          </body>
        </html>
      `);
    }

    // Vérifier si le token n'a pas expiré
    if (new Date() > user.emailVerificationExpires) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>⏰ Link Expired</h1>
            <p>This verification link has expired. Please register again.</p>
          </body>
        </html>
      `);
    }

    // Activer le compte et démarrer le Free Trial
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7); // 7 jours de trial

    await user.update({
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      trialStartedAt: trialStart,
      trialEndsAt: trialEnd
    });

    // Envoyer l'email de bienvenue
    await emailService.sendWelcomeEmail(user);

    // Page de succès
    res.send(`
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 50px;
              background: #f3f4f6;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #10b981; }
            .trial-info {
              background: #f0fdf4;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .button {
              background: #3b82f6;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              display: inline-block;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Email Verified Successfully!</h1>
            <p>Welcome to LexiFlow, ${user.name || 'there'}!</p>
            
            <div class="trial-info">
              <h2>🎉 Your 7-Day Free Trial Has Started!</h2>
              <p><strong>Start date:</strong> ${trialStart.toLocaleDateString()}</p>
              <p><strong>End date:</strong> ${trialEnd.toLocaleDateString()}</p>
              <p>You now have access to all Premium features!</p>
            </div>
            
            <p>You can close this page and return to the LexiFlow extension.</p>
            <a href="#" class="button" onclick="window.close()">Close This Page</a>
          </div>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>❌ Verification Failed</h1>
          <p>An error occurred. Please try again or contact support.</p>
        </body>
      </html>
    `);
  }
});

// Login avec vérification du trial
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Mode développement
    if (process.env.NODE_ENV === 'development' && email === 'test@lexiflow.test') {
      const mockTrialEnd = new Date();
      mockTrialEnd.setDate(mockTrialEnd.getDate() + 5); // 5 jours restants
      
      return res.json({
        message: 'Login successful',
        token: 'mock-jwt-token-12345',
        user: {
          id: '123',
          email,
          emailVerified: true,
          isTrialActive: true,
          trialEndsAt: mockTrialEnd,
          subscriptionStatus: 'trial',
          flashcardLimit: Infinity
        }
      });
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ where: { email } });
    
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Vérifier si l'email est vérifié
    // TODO: Réactiver après configuration email
    // if (!user.emailVerified) {
    //   return res.status(403).json({ 
    //     error: 'Please verify your email first',
    //     requiresVerification: true 
    //   });
    // }
    console.log('⚠️ Vérification email désactivée temporairement');

    try {
      // Vérifier le statut du trial/premium
      const subscriptionStatus = user.isTrialActive ? user.isTrialActive() : false;
      const isPremium = user.checkPremiumStatus ? user.checkPremiumStatus() : user.isPremium;
      const status = subscriptionStatus ? 'trial' : (isPremium ? 'premium' : 'free');

      // Générer le token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '30d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
          subscriptionStatus: status,
          isPremium: user.isPremium,
          isTrialActive: subscriptionStatus,
          trialEndsAt: user.trialEndsAt,
          flashcardLimit: user.getFlashcardLimit ? user.getFlashcardLimit() : 100
        }
      });
    } catch (error) {
      console.error('Login response error:', error);
      // Réponse minimale en cas d'erreur
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '30d' }
      );
      
      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isPremium: user.isPremium || false
        }
      });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Vérifier la validité du token JWT
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false, error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      // Le token utilise 'id' et non 'userId'
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        return res.status(401).json({ valid: false, error: 'User not found' });
      }

      return res.json({ 
        valid: true, 
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isPremium: user.isPremium,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionPlan: user.subscriptionPlan,
          billingCycle: user.billingCycle
        }
      });
    } catch (error) {
      return res.status(401).json({ valid: false, error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ valid: false, error: error.message });
  }
});

// Renvoyer l'email de vérification
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ 
      where: { 
        email,
        emailVerified: false 
      } 
    });

    if (!user) {
      return res.status(400).json({ 
        error: 'No unverified account found with this email' 
      });
    }

    // Générer un nouveau token
    // const verificationToken = emailService.generateVerificationToken();
    const verificationToken = require('crypto').randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);

    await user.update({
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires
    });

    // Renvoyer l'email
    // TODO: Réactiver après configuration email
    // await emailService.sendVerificationEmail(user, verificationToken);
    console.log('📧 Email de vérification désactivé temporairement');

    res.json({ 
      message: 'Verification email sent! Please check your inbox.' 
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend email' });
  }
});

module.exports = router;