require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const passport = require('./config/passport');
const limiters = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Render (nécessaire pour express-rate-limit)
app.set('trust proxy', 1);

// Stripe webhook needs raw body
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));

// Middleware de sécurité
app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:5000',
      'http://localhost:8000',
      'http://localhost:3000',
      process.env.FRONTEND_URL,
      process.env.CLIENT_URL
    ];
    
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // Allow Chrome extension requests
    if (origin.startsWith('chrome-extension://')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (pour les pages de succès)
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

// Session pour OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'lexiflow-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
}));

// Initialiser Passport
app.use(passport.initialize());
app.use(passport.session());

// Servir les fichiers statiques (pour les pages OAuth)
app.use(express.static('public'));

// Rate limiting par route
app.use('/api/auth', limiters.auth);
app.use('/api/flashcards', limiters.flashcards);
app.use('/api/deepseek', limiters.deepseek);
app.use('/api/', limiters.global);

// Health check endpoint (pas d'auth requis)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', require('./routes/authWithTrial'));
app.use('/api/auth', require('./routes/password-reset'));
app.use('/api/user', require('./routes/user'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/flashcards', require('./routes/flashcards'));
app.use('/api/translations', require('./routes/translations'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/sync', require('./routes/sync'));
app.use('/api/waitlist', require('./routes/waitlist'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/diagnostic', require('./routes/diagnostic'));
app.use('/api', require('./routes/health'));

// Legal pages (privacy, terms)
app.use('/', require('./routes/legal'));

// Data deletion endpoints for Facebook
app.use('/', require('./routes/dataDeletion'));

// Route de test (déjà définie dans routes/health.js)

// Ping endpoint
app.get('/ping', (req, res) => {
  res.send('pong');
});

// List all routes (for debugging)
app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
    console.log(r.route.methods, r.route.path);
  }
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Initialiser la base de données avant de démarrer le serveur
const initDatabase = require('./config/initDatabase');

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 LexiFlow Backend running on port ${PORT}`);
  console.log(`📱 Accessible depuis: http://${require('os').hostname()}:${PORT}`);
  console.log(`🌐 Ou via IP: http://10.0.2.15:${PORT}`);
  
  // Initialiser la base de données après le démarrage du serveur
  await initDatabase();
});
