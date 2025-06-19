require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const limiters = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

// Stripe webhook needs raw body
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));

// Middleware de sécurité
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5000', 'http://localhost:8000'],
  credentials: true,
  // Ajouter l'extension Chrome aux origines autorisées
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting par route
app.use('/api/auth', limiters.auth);
app.use('/api/flashcards', limiters.flashcards);
app.use('/api/deepseek', limiters.deepseek);
app.use('/api/', limiters.global);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/flashcards', require('./routes/flashcards'));
app.use('/api/translations', require('./routes/translations'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/sync', require('./routes/sync'));
app.use('/api/waitlist', require('./routes/waitlist'));

// Ensure all routes are loaded from src/routes
const healthRoute = require('./routes/health');
const authRoute = require('./routes/auth');

app.use('/api', healthRoute);
app.use('/api/auth', authRoute);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'LexiFlow Backend is running!' });
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

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 LexiFlow Backend running on port ${PORT}`);
});
