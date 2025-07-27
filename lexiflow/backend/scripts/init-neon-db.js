require('dotenv').config({ path: '../.env' });
const { sequelize } = require('../src/config/database');

async function initDatabase() {
  try {
    console.log('🔄 Initialisation de la base de données Neon...');
    
    // Synchroniser tous les modèles avec la base de données
    // force: false = ne supprime pas les tables existantes
    await sequelize.sync({ force: false });
    
    console.log('✅ Toutes les tables ont été créées avec succès !');
    
    // Lister les tables créées
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    console.log('\n📋 Tables créées :');
    results.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation :', error);
    process.exit(1);
  }
}

initDatabase();