# Configuration Stripe pour LexiFlow

## 🎯 Quick Start

### 1. Créer compte Stripe
- URL: https://dashboard.stripe.com/register
- Email: VOTRE email personnel (pas lexiflow.contact@)
- Mode: Gardez "Test mode" activé

### 2. Obtenir les clés API
Dashboard → Developers → API keys
```
Publishable key: pk_test_...
Secret key: sk_test_...
```

### 3. Créer les produits
Dashboard → Products → Add product

**LexiFlow Premium**
- Monthly: $4.99/month
- Yearly: $49.90/year (save 17%)

Notez les Price IDs générés

### 4. Configurer Webhook
Dashboard → Developers → Webhooks → Add endpoint

URL: `https://lexiflow.onrender.com/api/subscription/webhook`

Events:
- checkout.session.completed
- customer.subscription.updated
- customer.subscription.deleted

### 5. Variables d'environnement (.env)
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...
```

## 🧪 Cartes de test

| Type | Numéro | CVC | Date |
|------|---------|-----|------|
| ✅ Succès | 4242 4242 4242 4242 | Any 3 | Any future |
| ❌ Refusé | 4000 0000 0000 0002 | Any 3 | Any future |
| 🔄 3D Secure | 4000 0025 0000 3155 | Any 3 | Any future |

## 📊 Dashboard

### Voir les paiements
Payments → All transactions

### Voir les abonnements
Billing → Subscriptions

### Voir les clients
Customers → Overview

## 🚀 Passer en Production

1. Compléter la vérification d'identité
2. Ajouter compte bancaire
3. Switcher sur "Live mode"
4. Remplacer les clés test par les clés live

## ⚠️ Important

- Ne JAMAIS partager la Secret Key
- Toujours vérifier les webhooks signatures
- Utiliser HTTPS en production
- Logger tous les événements Stripe

## 🔧 Debug

Si webhook échoue:
1. Vérifier l'URL est accessible
2. Vérifier la signature
3. Regarder Stripe logs
4. Tester avec Stripe CLI

```bash
# Installer Stripe CLI
stripe listen --forward-to localhost:3001/api/subscription/webhook
```