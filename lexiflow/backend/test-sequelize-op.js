// Test de l'import et utilisation de Sequelize Op
require('dotenv').config();

console.log('=== TEST SEQUELIZE OP ===\n');

// Test 1: Import depuis sequelize directement
try {
  const { Op } = require('sequelize');
  console.log('✅ Import Op depuis sequelize réussi');
  console.log('   Op.gt existe:', !!Op.gt);
  console.log('   Type de Op.gt:', typeof Op.gt);
} catch (error) {
  console.log('❌ Import Op depuis sequelize échoué:', error.message);
}

// Test 2: Import depuis database.js
try {
  const { Op } = require('./src/config/database');
  console.log('✅ Import Op depuis database.js réussi');
  console.log('   Op.gt existe:', !!Op.gt);
  console.log('   Type de Op.gt:', typeof Op.gt);

  // Test d'utilisation
  const testQuery = {
    resetPasswordExpires: { [Op.gt]: new Date() }
  };
  console.log('✅ Création de query avec Op.gt réussie');
} catch (error) {
  console.log('❌ Import Op depuis database.js échoué:', error.message);
}

// Test 3: Import du modèle User et test de requête
try {
  const User = require('./src/models/User');
  const { Op } = require('./src/config/database');

  console.log('\n=== TEST REQUÊTE USER ===');

  // Test simple sans Op
  const testEmail = 'test@example.com';
  console.log(`\nRecherche d'utilisateur avec email: ${testEmail}`);

  User.findOne({ where: { email: testEmail } })
    .then(user => {
      console.log('✅ Requête simple réussie:', user ? 'Utilisateur trouvé' : 'Aucun utilisateur');
    })
    .catch(err => {
      console.log('❌ Erreur requête simple:', err.message);
    });

  // Test avec Op.gt
  console.log('\nRecherche avec Op.gt...');
  User.findOne({
    where: {
      resetPasswordExpires: { [Op.gt]: new Date() }
    }
  })
    .then(user => {
      console.log('✅ Requête avec Op.gt réussie');
    })
    .catch(err => {
      console.log('❌ Erreur requête avec Op.gt:', err.message);
    });

} catch (error) {
  console.log('❌ Erreur test User:', error.message);
}

// Test 4: Solution alternative sans Op
console.log('\n=== SOLUTION ALTERNATIVE SANS Op ===');
try {
  const User = require('./src/models/User');

  // Alternative 1: Utiliser Sequelize.literal
  const { sequelize } = require('./src/config/database');

  User.findOne({
    where: sequelize.literal(`"resetPasswordExpires" > NOW()`)
  })
    .then(user => {
      console.log('✅ Solution avec sequelize.literal réussie');
    })
    .catch(err => {
      console.log('❌ Erreur sequelize.literal:', err.message);
    });

} catch (error) {
  console.log('❌ Erreur solution alternative:', error.message);
}

setTimeout(() => {
  console.log('\n=== FIN DES TESTS ===');
  process.exit(0);
}, 3000);