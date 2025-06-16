# BACKEND.md - Documentation Backend LexiFlow

## 🎯 Objectif de ce fichier
Ce document sert de référence pour GitHub Copilot et l'équipe de développement. Il contient l'état actuel du backend, les tâches accomplies et les instructions détaillées pour la suite.

## 📊 État actuel du backend (15 juin 2025)

### 🎯 Progression globale : 40%

- ✅ Architecture de base (100%)
- ✅ Modèles de données (100%)
- ⚠️ Routes API (60%)
- ⚠️ Authentification (80%)
- ❌ Intégration Stripe (0%)
- ❌ Synchronisation cloud (0%)
- ❌ Tests unitaires (0%)

### ✅ Ce qui est fait

#### 1. Architecture de base
```javascript
// Structure du projet backend
backend/
├── config/
│   ├── database.js      // ✅ Configuration PostgreSQL avec Sequelize
│   └── stripe.js        // ⚠️ À créer - Configuration Stripe
├── models/
│   ├── User.js          // ✅ Modèle utilisateur complet
│   ├── Subscription.js  // ✅ Modèle abonnement
│   └── Flashcard.js     // ✅ Modèle flashcards
├── routes/
│   ├── auth.js          // ✅ Routes authentification (register, login)
│   ├── user.js          // ✅ Routes utilisateur (profile, update)
│   └── payment.js       // ⚠️ À compléter - Routes Stripe
├── middleware/
│   ├── auth.js          // ✅ Vérification JWT
│   └── rateLimiter.js   // ✅ Limitation des requêtes
├── utils/
│   └── validators.js    // ✅ Validation des inputs
└── server.js            // ✅ Serveur Express configuré
```

#### 2. Modèles de données implémentés

**User Model:**
```javascript
{
  id: UUID,
  email: String (unique),
  password: String (bcrypt hash),
  username: String,
  isPremium: Boolean (default: false),
  flashcardLimit: Integer (default: 50),
  characterLimit: Integer (default: 100), // 350 pour premium
  createdAt: Date,
  updatedAt: Date
}
```

**Subscription Model:**
```javascript
{
  id: UUID,
  userId: UUID (foreign key),
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  status: String ('active', 'canceled', 'past_due'),
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Flashcard Model:**
```javascript
{
  id: UUID,
  userId: UUID (foreign key),
  originalText: String,
  translatedText: String,
  sourceLang: String,
  targetLang: String,
  context: Text,
  tags: Array,
  reviewCount: Integer (default: 0),
  lastReviewed: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. Routes API fonctionnelles

**Auth Routes (✅ Complétées):**
- `POST /api/auth/register` - Création de compte
- `POST /api/auth/login` - Connexion avec JWT
- `POST /api/auth/refresh` - Renouvellement du token
- `POST /api/auth/logout` - Déconnexion

**User Routes (✅ Complétées):**
- `GET /api/user/profile` - Profil utilisateur
- `PUT /api/user/profile` - Mise à jour profil
- `GET /api/user/flashcards` - Liste des flashcards
- `POST /api/user/flashcards` - Créer flashcard
- `DELETE /api/user/flashcards/:id` - Supprimer flashcard

#### 4. Middleware implémentés

**Auth Middleware:**
```javascript
// Vérifie le JWT et attache l'utilisateur à req.user
const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findByPk(decoded.id);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

**Limite Flashcards & Caractères:**
```javascript
// Vérifie les limites utilisateur
const checkUserLimits = async (req, res, next) => {
  // Limite flashcards
  const flashcardCount = await Flashcard.count({ where: { userId: req.user.id } });
  const flashcardLimit = req.user.isPremium ? 200 : 50;
  
  if (flashcardCount >= flashcardLimit) {
    return res.status(403).json({ 
      error: 'Flashcard limit reached',
      limit: flashcardLimit,
      current: flashcardCount
    });
  }
  
  // Limite caractères pour traduction
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

### 🚧 En cours de développement

#### 1. Intégration Stripe (Priorité #1)

**Prochaines étapes pour GitHub Copilot:**

```javascript
// À créer dans config/stripe.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// À créer dans routes/payment.js
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  // TODO: Créer une session de checkout Stripe
  // - Prix: price_xxx (à créer dans Stripe Dashboard)
  // - Mode: subscription
  // - Success URL: frontend URL + /success
  // - Cancel URL: frontend URL + /pricing
});

router.post('/webhook', async (req, res) => {
  // TODO: Gérer les webhooks Stripe
  // Events à gérer:
  // - checkout.session.completed
  // - customer.subscription.updated
  // - customer.subscription.deleted
  // - invoice.payment_failed
});

// À ajouter dans models/User.js
User.prototype.upgradeToPremmium = async function() {
  this.isPremium = true;
  this.flashcardLimit = 200;
  this.characterLimit = 350;
  await this.save();
};
```

#### 2. Système de synchronisation

**À implémenter:**
```javascript
// routes/sync.js
router.post('/api/sync/flashcards', authMiddleware, premiumOnly, async (req, res) => {
  // TODO: Synchroniser les flashcards depuis l'extension
  // - Vérifier que l'utilisateur est Premium
  // - Merger les flashcards locales avec celles du serveur
  // - Gérer les conflits (dernière modification gagne)
});

router.get('/api/sync/flashcards', authMiddleware, premiumOnly, async (req, res) => {
  // TODO: Récupérer toutes les flashcards pour sync
  // - Inclure les métadonnées de synchronisation
  // - Paginer si > 100 flashcards
});
```

#### 3. Gestion des clés API DeepSeek

**À implémenter:**
```javascript
// utils/deepseek.js
const encryptApiKey = (apiKey) => {
  // TODO: Chiffrer la clé API avant stockage
};

const decryptApiKey = (encryptedKey) => {
  // TODO: Déchiffrer pour utilisation
};

// routes/user.js - À ajouter
router.post('/api/user/deepseek-key', authMiddleware, premiumOnly, async (req, res) => {
  // TODO: Stocker la clé API DeepSeek de l'utilisateur
  // - Valider le format
  // - Chiffrer avant stockage
  // - Tester la clé avec un appel API
});
```

### 📋 TODO List détaillée pour GitHub Copilot

#### Phase 1 - Paiements Stripe (Cette semaine)
1. **Créer les produits dans Stripe Dashboard**
   - Produit: LexiFlow Premium
   - Prix mensuel: 4.99€ (price_regular)
   - Prix Early Bird: 2.99€ (price_earlybird)

2. **Implémenter routes/payment.js**
   ```javascript
   // Routes à créer:
   POST /api/payment/create-checkout-session
   POST /api/payment/webhook
   GET /api/payment/subscription-status
   POST /api/payment/cancel-subscription
   POST /api/payment/resume-subscription
   ```

3. **Mettre à jour le modèle Subscription**
   - Ajouter champ `priceId` (regular ou earlybird)
   - Ajouter champ `amount` (montant payé)

4. **Créer les emails transactionnels**
   - Welcome email (après inscription)
   - Payment successful (après paiement)
   - Subscription canceled
   - Payment failed

#### Phase 2 - Dashboard utilisateur
1. **Créer routes dashboard**
   ```javascript
   GET /api/dashboard/stats // Statistiques flashcards
   GET /api/dashboard/usage // Usage actuel vs limites
   GET /api/dashboard/billing // Historique facturation
   ```

2. **Analytics flashcards**
   - Nombre de révisions par jour
   - Taux de mémorisation
   - Langues les plus traduites

#### Phase 3 - Optimisations
1. **Cache Redis** pour les données fréquentes
2. **Queue jobs** pour emails et tâches lourdes
3. **Tests unitaires** avec Jest
4. **Documentation API** avec Swagger

### 🔧 Configuration environnement

```bash
# .env requis
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/lexiflow
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_REGULAR=price_...
STRIPE_PRICE_EARLYBIRD=price_...
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@lexiflow.com
EMAIL_PASS=your-email-password
FRONTEND_URL=http://localhost:3000
```

### 🐛 Bugs connus à corriger

1. **Rate limiting trop strict** - Augmenter à 100 req/min pour /api/flashcards
2. **Validation email** - Accepter les + dans les adresses (user+tag@email.com)
3. **CORS** - Ajouter l'extension Chrome aux origines autorisées

### 📝 Notes pour GitHub Copilot

**Conventions de code:**
- Utiliser async/await partout (pas de callbacks)
- Toujours valider les inputs avec Joi
- Retourner des codes HTTP appropriés
- Logger toutes les erreurs avec timestamps
- Utiliser les transactions pour opérations multiples

**Structure des réponses API:**
```javascript
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

**Sécurité:**
- Hasher tous les mots de passe avec bcrypt (rounds: 10)
- Valider tous les inputs utilisateur
- Utiliser des prepared statements (Sequelize le fait)
- Rate limiting sur toutes les routes publiques
- HTTPS obligatoire en production

---

**Dernière mise à jour:** 15 juin 2025 - 23h45
**Prochaine revue:** Après implémentation Stripe