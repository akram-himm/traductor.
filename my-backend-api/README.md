# LexiFlow Backend API

Backend API pour l'extension Chrome LexiFlow - Traduction instantanée et flashcards intelligentes.

## 🚀 Déploiement sur Render

### Option 1 : Déploiement automatique (Recommandé)

1. **Fork ce repository** sur votre compte GitHub

2. **Connectez-vous à Render** : https://render.com

3. **Créez un nouveau Web Service** :
   - Cliquez sur "New +" → "Web Service"
   - Connectez votre compte GitHub
   - Sélectionnez votre fork de `my-backend-api`
   - Render détectera automatiquement la configuration

4. **Variables d'environnement** à ajouter dans Render :
   ```
   JWT_SECRET=<générer avec: openssl rand -base64 32>
   STRIPE_SECRET_KEY=<votre clé Stripe> (optionnel)
   STRIPE_WEBHOOK_SECRET=<webhook secret> (optionnel)
   DEEPSEEK_API_KEY=<votre clé API> (optionnel)
   ```

5. **Cliquez sur "Create Web Service"**

### Option 2 : Déploiement manuel

1. **Clonez le repository** :
   ```bash
   git clone https://github.com/votre-username/my-backend-api.git
   cd my-backend-api
   ```

2. **Installez Render CLI** :
   ```bash
   npm install -g @render-cli/cli
   ```

3. **Déployez** :
   ```bash
   render up
   ```

## 📋 Configuration

### Variables d'environnement requises

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | URL PostgreSQL (fournie par Render) | postgresql://... |
| `JWT_SECRET` | Clé secrète pour JWT | Générer avec `openssl rand -base64 32` |
| `NODE_ENV` | Environnement | production |
| `PORT` | Port du serveur | 10000 (Render) |

### Variables optionnelles

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Pour les paiements Premium |
| `STRIPE_WEBHOOK_SECRET` | Webhook Stripe |
| `DEEPSEEK_API_KEY` | API DeepSeek pour traductions IA |
| `FRONTEND_URL` | URL de votre site/extension |

## 🔧 Développement local

1. **Installez les dépendances** :
   ```bash
   npm install
   ```

2. **Créez un fichier `.env`** :
   ```bash
   cp .env.example .env
   # Éditez .env avec vos valeurs
   ```

3. **Base de données locale** (PostgreSQL) :
   ```bash
   # Avec Docker
   docker run -d -p 5432:5432 \
     -e POSTGRES_PASSWORD=password \
     -e POSTGRES_DB=lexiflow \
     postgres:15
   ```

4. **Démarrez le serveur** :
   ```bash
   npm run dev
   ```

## 📚 Documentation API

### Authentification

#### Inscription
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Connexion
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Flashcards (Auth requise)

#### Récupérer toutes les flashcards
```http
GET /api/flashcards
Authorization: Bearer <token>
```

#### Créer une flashcard
```http
POST /api/flashcards
Authorization: Bearer <token>
Content-Type: application/json

{
  "front": "Hello",
  "back": "Bonjour",
  "fromLang": "en",
  "toLang": "fr",
  "folder": "default"
}
```

### Utilisateur

#### Profil
```http
GET /api/user/profile
Authorization: Bearer <token>
```

#### Mettre à jour les paramètres
```http
PUT /api/user/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "targetLanguage": "fr",
  "buttonColor": "#3b82f6"
}
```

## 🛡️ Sécurité

- **Authentification JWT** avec expiration 30 jours
- **Rate limiting** : 100 req/15min (global), 5 req/15min (auth)
- **Helmet.js** pour les headers de sécurité
- **CORS** configuré pour l'extension Chrome
- **Validation** des données avec express-validator
- **Mots de passe** hashés avec bcrypt

## 📊 Limites

### Utilisateurs gratuits
- 50 flashcards maximum
- 100 caractères par traduction

### Utilisateurs Premium
- 200 flashcards maximum
- 350 caractères par traduction
- Synchronisation cloud
- Mode pratique

## 🔍 Monitoring

- **Logs** : Accessibles dans le dashboard Render
- **Health check** : `GET /health`
- **Métriques** : Dashboard Render

## 💡 Tips pour Render

1. **Auto-sleep** : Le service gratuit s'endort après 15min d'inactivité
   - Solution : Implémenter un ping depuis l'extension

2. **Cold start** : Premier appel peut prendre 30-60s
   - Solution : Endpoint `/health` pour réveiller le service

3. **Limite DB** : 1GB sur le plan gratuit
   - Solution : Nettoyer régulièrement les anciennes données

4. **Logs** : Conservés 7 jours sur le plan gratuit

## 🐛 Debugging

1. **Vérifier les logs** :
   ```bash
   render logs lexiflow-api
   ```

2. **Tester la connexion DB** :
   ```bash
   curl https://votre-api.onrender.com/health
   ```

3. **Problèmes courants** :
   - "Database connection failed" → Vérifier DATABASE_URL
   - "JWT Error" → Vérifier JWT_SECRET
   - "CORS blocked" → Ajouter l'URL de l'extension dans CORS

## 📝 Licence

MIT

## 🤝 Support

- Email : support@lexiflow.com
- GitHub Issues : https://github.com/votre-username/my-backend-api/issues

---

Fait avec ❤️ pour LexiFlow