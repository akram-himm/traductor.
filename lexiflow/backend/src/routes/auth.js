const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const router = express.Router();

// Inscription
router.post('/register', async (req, res) => {
  console.log('Reached /register route'); // Added log statement
  try {
    const { email, password, name } = req.body;

    // Mock response for testing without database
    if (process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL.includes('localhost')) {
      return res.status(201).json({
        message: 'Mock registration successful',
        token: 'mock-jwt-token-12345',
        user: { id: '123', email: req.body.email, isPremium: false }
      });
    }

    // Commented out database operations
    // Vérifier si l'utilisateur existe
    // const existingUser = await User.findOne({ where: { email } });
    // if (existingUser) {
    //   return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    // }
    
    // Créer l'utilisateur
    // const user = await User.create({ email, password, name });
    
    // Générer le token JWT
    const token = jwt.sign(
      { id: '123', email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );
    
    res.status(201).json({
      message: 'Inscription réussie',
      token,
      user: {
        id: '123',
        email,
        name,
        isPremium: false
      }
    });
  } catch (error) {
    console.error('Error in /register route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Debugging environment variables and condition
    console.log('Login route - NODE_ENV:', process.env.NODE_ENV);
    console.log('Login route - DATABASE_URL:', process.env.DATABASE_URL);
    console.log('Login route - Condition result:', process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL.includes('localhost'));

    // Always return mock data for testing
    if (email === 'test@lexiflow.test' && password === 'password123') {
      return res.status(200).json({
        message: 'Mock login successful',
        token: 'mock-jwt-token-12345',
        user: { id: '123', email, isPremium: false }
      });
    } else {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Commented out database operations
    // const user = await User.findOne({ where: { email } });
    // if (!user || !(await bcrypt.compare(password, user.password))) {
    //   return res.status(401).json({ error: 'Invalid credentials' });
    // }

    // Générer le token
    const token = jwt.sign(
      { id: '123', email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );
    
    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: '123',
        email,
        name: 'Test User',
        isPremium: false,
        flashcardLimit: 100
      }
    });
  } catch (error) {
    console.error('Error in /login route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route OAuth Google - Initier la connexion
router.get('/google', (req, res, next) => {
  // Extraire les paramètres de l'URL
  const prompt = req.query.prompt || 'consent';
  const maxAge = req.query.max_age;
  
  // Options pour Passport
  const authOptions = {
    scope: ['profile', 'email'],
    prompt: prompt
  };
  
  // Ajouter max_age si fourni
  if (maxAge !== undefined) {
    authOptions.maxAge = maxAge;
  }
  
  // Log pour debug
  console.log('OAuth options:', authOptions);
  
  passport.authenticate('google', authOptions)(req, res, next);
});

// Route OAuth Google - Callback
router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  (req, res) => {
    try {
      // Générer le token JWT
      const token = jwt.sign(
        { 
          id: req.user.id, 
          email: req.user.email,
          googleId: req.user.googleId 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '30d' }
      );

      // Rediriger vers la page de succès avec le token
      res.redirect(`${process.env.FRONTEND_URL || 'https://my-backend-api-cng7.onrender.com'}/oauth-success.html?token=${token}`);
    } catch (error) {
      console.error('Erreur OAuth callback:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'https://my-backend-api-cng7.onrender.com'}/oauth-error.html?error=Authentication%20failed`);
    }
  }
);

// Route de déconnexion
router.post('/logout', (req, res) => {
  // En mode JWT, on n'a pas vraiment besoin de faire quelque chose côté serveur
  // Le client doit simplement supprimer le token
  res.json({ message: 'Déconnexion réussie' });
});

module.exports = router;
