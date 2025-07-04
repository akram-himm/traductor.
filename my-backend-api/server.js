const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
require('dotenv').config();

const { sequelize } = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const flashcardRoutes = require('./routes/flashcards');
const subscriptionRoutes = require('./routes/subscription');

// Configuration du logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration CORS pour l'extension Chrome
const corsOptions = {
  origin: [
    'chrome-extension://*',
    'http://localhost:3000',
    'https://lexiflow.com',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middlewares globaux
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger des requêtes
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Rate limiting global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  message: 'Trop de requêtes, veuillez réessayer plus tard.'
});
app.use('/api/', limiter);

// Rate limiting strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 tentatives par 15 minutes
  skipSuccessfulRequests: true
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'LexiFlow API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      auth: '/api/auth',
      user: '/api/user',
      flashcards: '/api/flashcards',
      subscription: '/api/subscription'
    }
  });
});

// Routes API
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/subscription', subscriptionRoutes);

// Route de santé pour Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  logger.error(err.stack);
  
  const status = err.status || 500;
  const message = err.message || 'Erreur serveur interne';
  
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Connexion à la base de données et démarrage du serveur
async function startServer() {
  try {
    // Test de connexion à la base de données
    await sequelize.authenticate();
    logger.info('Connexion à la base de données établie avec succès.');
    
    // Synchronisation des modèles (en production, utiliser les migrations)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      logger.info('Modèles synchronisés avec la base de données.');
    }
    
    // Démarrage du serveur
    app.listen(PORT, () => {
      logger.info(`Serveur démarré sur le port ${PORT}`);
      logger.info(`Environnement: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Impossible de démarrer le serveur:', error);
    process.exit(1);
  }
}

// Gestion propre de l'arrêt
process.on('SIGTERM', async () => {
  logger.info('SIGTERM reçu, fermeture du serveur...');
  await sequelize.close();
  process.exit(0);
});

startServer();