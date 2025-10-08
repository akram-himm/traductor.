# 🔔 Configuration des Webhooks Stripe pour LexiFlow

## ❌ Problème actuel
Le paiement fonctionne mais le compte n'est pas mis à jour en premium car Stripe ne notifie pas le serveur.

## ✅ Solution : Configurer les webhooks

### Étape 1 : Dashboard Stripe
1. Allez sur [dashboard.stripe.com](https://dashboard.stripe.com)
2. **Mode TEST** activé (switch en haut)
3. **Developers** → **Webhooks** → **Add endpoint**

### Étape 2 : Configuration du webhook
- **Endpoint URL** :
  ```
  https://my-backend-api-cng7.onrender.com/api/subscription/webhook
  ```

- **Events à sélectionner** :
  - ✅ `checkout.session.completed` (IMPORTANT!)
  - ✅ `customer.subscription.created`
  - ✅ `customer.subscription.updated`
  - ✅ `customer.subscription.deleted`
  - ✅ `invoice.payment_succeeded`
  - ✅ `invoice.payment_failed`

### Étape 3 : Récupérer le signing secret
1. Cliquez sur l'endpoint créé
2. **Reveal** le Signing secret
3. Copier (format : `whsec_xxxxxxxxxxxxx`)

### Étape 4 : Mettre à jour sur Render
1. Dashboard Render → `my-backend-api-cng7`
2. **Environment** → Variables
3. Mettre à jour :
   ```
   STRIPE_WEBHOOK_SECRET = whsec_[votre_clé]
   ```

### Étape 5 : Tester
Dans Stripe :
1. Votre webhook → Onglet **Test**
2. Event : `checkout.session.completed`
3. **Send test webhook**

## 🔍 Vérification

### Logs à vérifier sur Render :
```
✅ Stripe webhook received
✅ User subscription updated
```

### Dans la base de données :
- `isPremium` : true
- `subscriptionStatus` : 'active'

## 🚨 Erreurs communes

### "Webhook signature verification failed"
→ Le `STRIPE_WEBHOOK_SECRET` n'est pas correct

### "No such user"
→ L'email Stripe ne correspond pas à un utilisateur

### Rien ne se passe
→ Les webhooks ne sont pas configurés ou l'URL est incorrecte

## 📊 Flow complet

1. Utilisateur paie sur Stripe
2. Stripe envoie webhook à votre serveur
3. Serveur vérifie la signature
4. Serveur met à jour l'utilisateur en premium
5. Utilisateur a accès aux fonctionnalités premium

## 🎯 Résultat attendu

Après configuration :
1. Paiement test avec `4242 4242 4242 4242`
2. Webhook reçu automatiquement
3. Compte mis à jour en premium
4. Accès immédiat aux fonctionnalités premium