# LexiFlow Backend

Backend API pour l'extension Chrome LexiFlow avec gestion des paiements Stripe.

## 🛠️ Installation

1. **Installer les dépendances**
```powershell
npm install
```

2. **Configurer l'environnement**
```powershell
copy .env.example .env
```
Éditer le fichier `.env` avec vos configurations.

3. **Créer la base de données**
```sql
CREATE DATABASE lexiflow;
```

4. **Exécuter les migrations**
```powershell
npm run migrate
```

5. **Lancer le serveur de développement**
```powershell
npm run dev
```

## 🔑 Configuration Stripe

1. Créer un compte [Stripe](https://stripe.com)

2. Dans le dashboard Stripe, créer :
   - Un produit "LexiFlow Premium"
   - Prix Early Bird Mensuel (2.99€)
   - Prix Early Bird Annuel (29.99€)
   - Prix Standard Mensuel (4.99€)
   - Prix Standard Annuel (49.99€)

3. Configurer le webhook :
   ```powershell
   npm install -g stripe
   stripe login
   npm run stripe:listen
   ```

4. Copier la clé webhook dans `.env`

## 📝 Endpoints API

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Abonnements
- `POST /api/subscription/create-checkout-session` - Créer session Stripe
- `POST /api/subscription/webhook` - Webhook Stripe
- `GET /api/subscription/status` - Statut abonnement
- `POST /api/subscription/cancel` - Annuler abonnement

### Flashcards
- `GET /api/flashcards` - Liste des flashcards
- `POST /api/flashcards` - Créer flashcard
- `DELETE /api/flashcards/:id` - Supprimer flashcard

## 🧪 Tests

```powershell
npm test
```

## 📦 Déploiement

1. Configurer les variables d'environnement de production
2. Exécuter les migrations
3. Démarrer avec PM2 ou similaire :
   ```powershell
   npm install -g pm2
   pm2 start src/app.js --name lexiflow-backend
   ```

## 🔄 Commandes utiles

- **Réinitialiser la base** : `npm run init-db`
- **Annuler dernière migration** : `npm run migrate:undo`
- **Annuler toutes les migrations** : `npm run migrate:undo:all`
- **Écouter les webhooks** : `npm run stripe:listen`
