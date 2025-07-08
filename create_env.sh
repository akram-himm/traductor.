#\!/bin/bash
cd /home/akram/Bureau/my-backend-api

# Créer le fichier .env avec SQLite pour tester localement
cat > .env << 'END'
DATABASE_URL=sqlite://./database.sqlite
JWT_SECRET=test_secret_123456789_pour_dev_local
GOOGLE_CLIENT_ID=temporaire_pour_test
GOOGLE_CLIENT_SECRET=temporaire_pour_test
CLIENT_URL=chrome-extension://fimeadbjjjocfknijlhgemdjdkmipiil
SESSION_SECRET=test_session_secret_456789
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000
END

echo "✅ Fichier .env créé\!"

# Installer SQLite
echo "📦 Installation de SQLite..."
npm install sqlite3

# Modifier database.js pour utiliser SQLite
echo "🔧 Configuration de SQLite..."
cat > config/database.js << 'END'
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Utiliser SQLite pour le développement local
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

module.exports = sequelize;
END

echo "✅ Configuration terminée\! Lancez 'npm start'"
