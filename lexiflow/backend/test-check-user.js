// Test pour vérifier si un utilisateur existe
require('dotenv').config();
const User = require('./src/models/User');
const sequelize = require('./src/config/database');

async function checkUser() {
  try {
    console.log('🔍 Recherche d\'utilisateurs dans la base de données...\n');

    // Initialiser la connexion
    await sequelize.authenticate();
    console.log('✅ Connecté à la base de données\n');

    // Trouver tous les utilisateurs
    const users = await User.findAll({
      attributes: ['id', 'email', 'name', 'emailVerified', 'createdAt']
    });

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé dans la base de données');
      console.log('\n⚠️  IMPORTANT: Le système n\'envoie des emails que si l\'utilisateur existe!');
      console.log('    Créez d\'abord un compte avec l\'email saadakram159@gmail.com');
    } else {
      console.log(`📊 ${users.length} utilisateur(s) trouvé(s):\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Nom: ${user.name || 'Non défini'}`);
        console.log(`   Vérifié: ${user.emailVerified ? '✅' : '❌'}`);
        console.log(`   Créé le: ${user.createdAt.toLocaleDateString()}\n`);
      });

      // Vérifier spécifiquement pour saadakram159@gmail.com
      const targetEmail = 'saadakram159@gmail.com';
      const targetUser = users.find(u => u.email === targetEmail);

      if (targetUser) {
        console.log(`✅ L'utilisateur ${targetEmail} existe!`);
        console.log('   → L\'email de récupération devrait être envoyé');
      } else {
        console.log(`⚠️  L'utilisateur ${targetEmail} n'existe pas!`);
        console.log('   → CRÉEZ D\'ABORD UN COMPTE AVEC CET EMAIL');
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n💡 La base de données n\'est peut-être pas initialisée');
  } finally {
    await sequelize.close();
  }
}

checkUser();