// Reset et initialisation de la base de données
require('dotenv').config();
const { sequelize } = require('../src/config/database');
const User = require('../src/models/User');
const Subscription = require('../src/models/Subscription');
const Flashcard = require('../src/models/Flashcard');

async function initDb() {
  try {
    // Forcer la recréation des tables
    await sequelize.sync({ force: true });
    console.log('✅ Base de données réinitialisée');
    
    // Créer un utilisateur de test
    const user = await User.create({
      email: 'test@lexiflow.com',
      password: 'password123',
      name: 'Utilisateur Test'
    });
    console.log('✅ Utilisateur de test créé:', user.email);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

initDb();
