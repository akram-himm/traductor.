const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');

const router = express.Router();

// Validation des données
const validateRegister = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Générer un token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Route d'inscription
router.post('/register', validateRegister, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }

    // Créer l'utilisateur
    const user = await User.create({
      email,
      password
    });

    // Générer le token
    const token = generateToken(user.id);

    // Répondre avec les infos utilisateur et le token
    res.status(201).json({
      message: 'Inscription réussie',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// Route de connexion
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Trouver l'utilisateur
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Mettre à jour la dernière connexion
    await user.update({ lastLogin: new Date() });

    // Générer le token
    const token = generateToken(user.id);

    res.json({
      message: 'Connexion réussie',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// Route de vérification du token
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ valid: false });
    }

    res.json({
      valid: true,
      user: user.toJSON()
    });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
});

// Route de réinitialisation du mot de passe (à implémenter)
router.post('/forgot-password', 
  body('email').isEmail().normalizeEmail(),
  async (req, res) => {
    // TODO: Implémenter l'envoi d'email de réinitialisation
    res.json({ 
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé' 
    });
  }
);

// Route OAuth Google (à implémenter)
router.post('/google', async (req, res) => {
  // TODO: Implémenter l'authentification Google
  res.status(501).json({ error: 'Authentification Google non implémentée' });
});

module.exports = router;