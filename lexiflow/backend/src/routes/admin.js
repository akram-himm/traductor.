const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const User = require('../models/User');

// Route temporaire pour initialiser la base de données
// À SUPPRIMER après utilisation !
router.get('/init-db', async (req, res) => {
  try {
    // Vérifier un token secret simple
    const secretToken = req.query.token;
    if (secretToken !== 'lexiflow-init-2025') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    console.log('🔄 Initialisation de la base de données...');
    
    // Synchroniser tous les modèles
    await sequelize.sync({ force: false });
    
    // Lister les tables créées
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    const tables = results.map(row => row.table_name);
    
    res.json({
      message: 'Base de données initialisée avec succès',
      tables: tables
    });
    
  } catch (error) {
    console.error('Erreur init DB:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'initialisation',
      details: error.message 
    });
  }
});

// Route temporaire pour vérifier un email manuellement
router.post('/verify-email-manual', async (req, res) => {
  try {
    const { email, token } = req.body;
    
    if (token !== 'lexiflow-init-2025') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await user.update({
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null
    });
    
    res.json({ 
      message: 'Email verified successfully',
      user: {
        email: user.email,
        emailVerified: user.emailVerified
      }
    });
    
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;