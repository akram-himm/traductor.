# 🚀 Configuration Rapide Base de Données

## Option 1: SQLite (Le plus rapide - 30 secondes)

### 1. Modifier database.js pour utiliser SQLite
```javascript
// /home/akram/Bureau/my-backend-api/config/database.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

module.exports = sequelize;
```

### 2. Installer SQLite
```bash
cd /home/akram/Bureau/my-backend-api
npm install sqlite3
```

### 3. C'est tout ! Lancez le serveur
```bash
npm start
```

## Option 2: PostgreSQL Local (5 minutes)

### 1. Installer PostgreSQL
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### 2. Créer la base de données
```bash
sudo -u postgres psql
CREATE DATABASE lexiflow_db;
CREATE USER lexiflow_user WITH PASSWORD 'password123';
GRANT ALL PRIVILEGES ON DATABASE lexiflow_db TO lexiflow_user;
\q
```

### 3. Mettre dans .env
```
DATABASE_URL=postgresql://lexiflow_user:password123@localhost:5432/lexiflow_db
```

## Option 3: Utiliser les valeurs Render existantes

Si vous avez déjà une base sur Render :

1. Allez sur [render.com](https://render.com)
2. Cliquez sur votre base de données PostgreSQL
3. Copiez "External Database URL"
4. Collez dans .env : `DATABASE_URL=...`

## Configuration .env minimale pour tester

```bash
# Créer .env avec ces valeurs minimales
cat > /home/akram/Bureau/my-backend-api/.env << EOF
DATABASE_URL=sqlite://./database.sqlite
JWT_SECRET=test_secret_123456789
GOOGLE_CLIENT_ID=fake_for_now
GOOGLE_CLIENT_SECRET=fake_for_now
CLIENT_URL=chrome-extension://fimeadbjjjocfknijlhgemdjdkmipiil
SESSION_SECRET=test_session_123456789
EOF
```

Puis lancez :
```bash
npm start
```