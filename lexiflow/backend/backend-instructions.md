
# 🚀 LexiFlow Backend - Instructions Complètes

## 📁 Arborescence du dossier `lexiflow/backend/`

Ce dossier contient le backend Node.js de LexiFlow, qui gère l'API, la base de données, l'authentification, la facturation et la logique métier.

```
backend/
├── backend-instructions.md  # Documentation technique du backend
├── migrations/              # Scripts de migration de base de données
├── node_modules/            # Dépendances Node.js
├── package.json             # Dépendances et scripts du backend
├── scripts/                 # Scripts utilitaires (init, seed, tests, etc.)
├── src/                     # Code source principal (app, routes, modèles, services, middlewares)
├── tests/                   # Tests du backend
```

Backend API pour l'extension Chrome LexiFlow - Documentation technique et état du développement

## 📊 État Actuel du Backend

### Progression Globale : 95% ✅

| Composant | Statut | Description |
|-----------|---------|-------------|
| Architecture | ✅ 100% | Structure complète avec src/, routes/, models/ |
| Authentification | ✅ 100% | JWT avec register/login fonctionnels |
| Routes API | ✅ 100% | Toutes les routes principales implémentées |
| Tests | ✅ 100% | Tous les tests passent avec succès |
| Stripe | ✅ 90% | Paiements et webhooks configurés |
| Base de données | ⚠️ 50% | Modèles créés, PostgreSQL optionnel en dev |
| Emails | ✅ 100% | Service email configuré |
| Synchronisation | ❌ 0% | À implémenter pour Premium |

### 🎉 Ce qui Fonctionne

- ✅ Health endpoint (`/api/health`) opérationnel
- ✅ Webhook endpoint (`/api/payment/webhook`) répond avec succès
- ✅ Tous les tests Stripe passent
- ✅ Authentification complète (register/login)
- ✅ Gestion des flashcards avec limites
- ✅ Mode développement sans base de données

**Dernière mise à jour :** 17 juin 2025

## 📋 Table des Matières

- [Installation](#-installation)
- [Configuration](#-configuration)
- [Utilisation](#-utilisation)
- [Architecture Détaillée](#-architecture-détaillée)
- [API Endpoints](#-api-endpoints)
- [Tests](#-tests)
- [Modèles de Données](#-modèles-de-données)
- [Développement](#-développement)
- [TODO pour Production](#-todo-pour-production)

## 📦 Installation

### Prérequis
- Node.js v18+ (testé avec v22.16.0)
- npm ou yarn
- PostgreSQL 12+ (optionnel pour développement)
- Stripe CLI (pour tester les webhooks)

### Installation Rapide

```bash
# 1. Cloner le repository
git clone https://github.com/yourusername/lexiflow.git
cd lexiflow/backend

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# 4. Démarrer le serveur
npm start
```

## ⚙️ Configuration

### Variables d'environnement (.env)

```env
# Server
NODE_ENV=development
PORT=3001

# Database (optionnel pour dev - fonctionne sans)
DATABASE_URL=postgresql://user:password@localhost:5432/lexiflow

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_51RaPVGBTFkJ5BVOVwzb0188Mxm3S4t7pnnTcf9hkIW0X4mqCMGW6qVC1s8prOVD8oU45vSLpaBuq81W1KNaPdxSl00tCzxP56r
STRIPE_WEBHOOK_SECRET=whsec_a42463b11c122704abdc85b57771edf9586e095cb21c589e025a2a90a104eb74
STRIPE_PRICE_REGULAR=price_1RaPqoBTFkJ5BVOVQMUiQjI0
STRIPE_PRICE_EARLYBIRD=price_1RaPtGBTFkJ5BVOV4wq2QTGb

# Email (à configurer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=test@example.com
EMAIL_PASS=testpassword

# Frontend
FRONTEND_URL=http://localhost:5000
```

### Mode Développement Sans Base de Données

Le backend fonctionne **sans PostgreSQL** en mode développement ! Les routes retournent automatiquement des données mock.

## 🚀 Utilisation

### Commandes Principales

```bash
# Démarrer le serveur
npm start

# Mode développement avec nodemon
npm run dev

# Lancer tous les tests
npm test

# Tests spécifiques
npm run test:api
npm run test:stripe

# Initialiser la base de données
npm run init-db
```

### Test Rapide

1. Démarrer le serveur : `npm start`
2. Tester la santé : `http://localhost:3001/api/health`
3. Lancer les tests : `npm test`

## 🏗️ Architecture Détaillée

### Structure des Dossiers

```
backend/
├── src/
│   ├── app.js              # Point d'entrée Express
│   ├── config/
│   │   ├── database.js     # Configuration Sequelize
│   │   └── stripe.js       # Configuration Stripe
│   ├── middleware/
│   │   ├── auth.js         # Vérification JWT
│   │   ├── premium.js      # Vérification Premium
│   │   └── rateLimiter.js  # Rate limiting
│   ├── models/
│   │   ├── User.js         # Modèle utilisateur
│   │   ├── Flashcard.js    # Modèle flashcard
│   │   └── Subscription.js # Modèle abonnement
│   ├── routes/
│   │   ├── auth.js         # Routes authentification
│   │   ├── flashcards.js   # Routes flashcards
│   │   ├── subscription.js # Routes Stripe
│   │   └── ...             # Autres routes
│   ├── services/
│   │   ├── deepseekService.js # Service DeepSeek AI
│   │   └── emailService.js    # Service emails
│   └── utils/
│       └── validators.js   # Validation des inputs
├── scripts/                # Scripts utilitaires
├── migrations/            # Migrations Sequelize
└── tests/                 # Tests HTML
```

### Middleware Implémentés

#### Auth Middleware
```javascript
// Vérifie le JWT et attache l'utilisateur à req.user
const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  // Support du mock token en développement
  if (token === 'mock-jwt-token-12345' && process.env.NODE_ENV === 'development') {
    req.user = {
      id: '123',
      email: 'test@lexiflow.test',
      isPremium: false,
      getFlashcardLimit: () => 50
    };
    return next();
  }
  
  // Vérification JWT normale
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findByPk(decoded.id);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

#### Limite Flashcards & Caractères
```javascript
const checkUserLimits = async (req, res, next) => {
  // Limite flashcards
  const flashcardCount = await Flashcard.count({ where: { userId: req.user.id } });
  const flashcardLimit = req.user.isPremium ? 200 : 50;
  
  if (flashcardCount >= flashcardLimit) {
    return res.status(403).json({ 
      error: 'Flashcard limit reached',
      limit: flashcardLimit,
      current: flashcardCount,
      needPremium: !req.user.isPremium
    });
  }
  
  // Limite caractères
  const text = req.body.text || '';
  const characterLimit = req.user.isPremium ? 350 : 100;
  
  if (text.length > characterLimit) {
    return res.status(403).json({
      error: 'Character limit exceeded',
      limit: characterLimit,
      current: text.length
    });
  }
  
  next();
};
```

## 📡 API Endpoints

### 🔐 Authentification
| Méthode | Endpoint | Description | Auth | Status |
|---------|----------|-------------|------|---------|
| POST | `/api/auth/register` | Inscription | ❌ | ✅ Fonctionnel |
| POST | `/api/auth/login` | Connexion | ❌ | ✅ Fonctionnel |
| POST | `/api/auth/refresh` | Renouveler token | ✅ | ✅ Fonctionnel |
| POST | `/api/auth/logout` | Déconnexion | ✅ | ✅ Fonctionnel |

### 👤 Utilisateur
| Méthode | Endpoint | Description | Auth | Status |
|---------|----------|-------------|------|---------|
| GET | `/api/user/profile` | Profil utilisateur | ✅ | ✅ Fonctionnel |
| PUT | `/api/user/profile` | Mettre à jour profil | ✅ | ✅ Fonctionnel |
| POST | `/api/user/deepseek-key` | Sauvegarder clé API | ✅ Premium | ⚠️ À implémenter |

### 📚 Flashcards
| Méthode | Endpoint | Description | Auth | Status |
|---------|----------|-------------|------|---------|
| GET | `/api/flashcards` | Liste des flashcards | ✅ | ✅ Fonctionnel |
| POST | `/api/flashcards` | Créer flashcard | ✅ | ✅ Fonctionnel |
| DELETE | `/api/flashcards/:id` | Supprimer flashcard | ✅ | ✅ Fonctionnel |

### 💳 Abonnements
| Méthode | Endpoint | Description | Auth | Status |
|---------|----------|-------------|------|---------|
| POST | `/api/subscription/create-checkout-session` | Créer session Stripe | ✅ | ✅ Fonctionnel |
| POST | `/api/subscription/webhook` | Webhook Stripe | ❌ | ✅ Fonctionnel |
| GET | `/api/subscription/status` | Statut abonnement | ✅ | ✅ Fonctionnel |
| POST | `/api/subscription/cancel` | Annuler abonnement | ✅ | ⚠️ À implémenter |

## 🧪 Tests

### Test Complet

```bash
# Lance tous les tests
npm test

# Résultat attendu :
🧪 TESTING LEXIFLOW BACKEND
========================
🔑 Testing Authentication Flow...
✅ User registration successful.
✅ User login successful.
📋 Testing Free User Limits...
✅ Created 50 flashcards.
✅ Free user flashcard limit enforced.
💳 Testing Stripe Integration...
✅ Checkout session created.
🎉 All tests completed.
```

### Tests Individuels

```bash
# API uniquement
node scripts/test-api.js

# Webhooks Stripe
node scripts/test-stripe-webhooks.js

# Validation environnement
node scripts/validate-env.js
```

## 📊 Modèles de Données

### User Model
```javascript
{
  id: UUID,
  email: String (unique),
  password: String (bcrypt hash),
  username: String,
  isPremium: Boolean (default: false),
  flashcardLimit: Integer (50/200),
  characterLimit: Integer (100/350),
  stripeCustomerId: String,
  deepseekApiKey: String (encrypted),
  createdAt: Date,
  updatedAt: Date
}
```

### Subscription Model
```javascript
{
  id: UUID,
  userId: UUID (foreign key),
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  stripePriceId: String,
  status: String ('active', 'canceled', 'past_due'),
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: Boolean,
  isEarlyBird: Boolean,
  amount: Decimal,
  createdAt: Date,
  updatedAt: Date
}
```

### Flashcard Model
```javascript
{
  id: UUID,
  userId: UUID (foreign key),
  front: String,           // Texte original
  back: String,            // Traduction
  sourceLang: String,
  targetLang: String,
  context: Text,
  tags: Array,
  difficulty: Integer (1-5),
  reviewCount: Integer (default: 0),
  lastReviewed: Date,
  nextReview: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 💻 Développement

### Mode Mock (Sans Base de Données)

En développement, les routes retournent des données mock :
- Login accepte : `test@lexiflow.test` / `password123`
- Token mock : `mock-jwt-token-12345`
- Limite flashcards simulée en mémoire

### Conventions de Code

```javascript
// Structure des réponses API
// Succès
{
  success: true,
  data: { ... },
  message: "Opération réussie"
}

// Erreur
{
  success: false,
  error: "Message d'erreur",
  code: "ERROR_CODE"
}
```

### Git Flow

```bash
# Feature
git checkout -b feature/nom-feature

# Bugfix
git checkout -b fix/description-bug

# Commit
git commit -m "feat: add user dashboard"
git commit -m "fix: correct token validation"
```

## 📋 TODO pour Production

### Phase 1 - Urgent (Cette semaine)
- [x] Configurer les emails transactionnels
- [x] Implémenter refresh token
- [x] Ajouter logout côté serveur
- [x] Tester toutes les routes avec Postman
- [x] Documenter l'API avec Swagger

### Phase 2 - Important
- [ ] Implémenter la synchronisation cloud
- [ ] Chiffrement des clés API DeepSeek
- [ ] Dashboard analytics
- [ ] Tests unitaires avec Jest
- [ ] CI/CD avec GitHub Actions

### Phase 3 - Optimisations
- [ ] Cache Redis pour performances
- [ ] Queue jobs pour emails
- [ ] Monitoring avec Sentry
- [ ] Rate limiting par IP
- [ ] Backup automatique DB

## 🚀 Commandes pour Démarrer

```bash
# 1. Installation
cd lexiflow/backend
npm install

# 2. Configuration
cp .env.example .env
# Éditer .env

# 3. Démarrer le serveur
npm start

# 4. Dans un autre terminal - Stripe CLI
stripe listen --forward-to localhost:3001/api/subscription/webhook

# 5. Tester
npm test
```

## 🔒 Sécurité

- JWT expiration : 7 jours
- Bcrypt rounds : 10
- Rate limiting : 100 req/min
- HTTPS obligatoire en production
- Validation stricte des inputs

## 📝 Notes Importantes

- **Mode Dev** : Fonctionne sans PostgreSQL !
- **Tests** : Tous passent avec succès
- **Stripe** : Configuré en mode test
- **Priorité** : Finir le site web pour lancer

---

**Version :** 0.8.0 | **Statut :** 95% complet | **Dernière mise à jour :** Juin 2025