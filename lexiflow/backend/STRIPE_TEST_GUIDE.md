# Guide de Test Stripe pour LexiFlow

## 🚀 Quick Test

Pour tester rapidement l'intégration Stripe:

```bash
# 1. Vérifier la configuration
node test-stripe.js

# 2. Lancer le test complet (serveur + paiement)
node test-complete-flow.js
```

## 📋 Test Manuel Détaillé

### 1. Démarrer le serveur backend
```bash
npm run dev
# ou
node src/app.js
```

### 2. Tester les webhooks (dans un autre terminal)
```bash
node test-webhook.js
```

### 3. Créer un utilisateur test
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lexiflow.com",
    "password": "test123456",
    "name": "Test User"
  }'
```

### 4. Se connecter et récupérer le token
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lexiflow.com",
    "password": "test123456"
  }'
```

### 5. Créer une session de paiement
```bash
# Remplacer YOUR_TOKEN par le token reçu
curl -X POST http://localhost:3001/api/subscription/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"priceType": "monthly"}'
```

### 6. Ouvrir l'URL de paiement retournée

## 💳 Cartes de Test

| Type | Numéro | Résultat |
|------|---------|----------|
| ✅ Succès | 4242 4242 4242 4242 | Paiement réussi |
| ❌ Refusé | 4000 0000 0000 0002 | Carte refusée |
| 🔐 3D Secure | 4000 0025 0000 3155 | Authentification requise |

**Pour tous les tests:**
- Date expiration: N'importe quelle date future (ex: 12/25)
- CVC: N'importe quel 3 chiffres (ex: 123)
- Code postal: N'importe quel code (ex: 12345)

## 🔧 Débugger les Webhooks

### Option 1: Stripe CLI (recommandé)
```bash
# Installer Stripe CLI
# https://stripe.com/docs/stripe-cli

# Écouter les webhooks
stripe listen --forward-to localhost:3001/api/subscription/webhook

# Déclencher un événement test
stripe trigger checkout.session.completed
```

### Option 2: Serveur webhook local
```bash
node test-webhook.js
```

## 📊 Vérifier dans Stripe Dashboard

1. Aller sur https://dashboard.stripe.com
2. Vérifier le mode **TEST** est activé (en haut à droite)
3. Naviguer vers:
   - **Payments** → Voir les paiements test
   - **Customers** → Voir les clients créés
   - **Billing → Subscriptions** → Voir les abonnements actifs

## 🐛 Problèmes Courants

### "No such price"
- Vérifier les Price IDs dans `.env`
- S'assurer qu'ils correspondent aux IDs dans Stripe Dashboard

### Webhook signature invalid
- Vérifier `STRIPE_WEBHOOK_SECRET` dans `.env`
- S'assurer d'utiliser le bon secret pour l'endpoint

### Paiement refusé
- Utiliser la carte test correcte (4242...)
- Vérifier que vous êtes en mode TEST

## 🔍 Logs Utiles

Pour voir tous les logs détaillés:
```bash
# Backend avec logs détaillés
DEBUG=* npm run dev

# Voir uniquement les logs Stripe
grep "stripe" logs/app.log
```

## ✅ Checklist de Test

- [ ] Configuration `.env` correcte
- [ ] Serveur backend démarre sans erreur
- [ ] `test-stripe.js` se connecte à Stripe
- [ ] Création utilisateur fonctionne
- [ ] Email de vérification envoyé
- [ ] Session de paiement créée
- [ ] Redirection vers Stripe Checkout
- [ ] Paiement test réussi
- [ ] Webhook reçoit l'événement
- [ ] Utilisateur devient Premium
- [ ] Statut mis à jour dans la base