# 🔍 DIAGNOSTIC COMPLET - Problème Webhook Stripe

## 📊 Situation actuelle
- ✅ Paiement Stripe fonctionne
- ✅ Session de checkout créée
- ❌ Compte NON mis à jour en premium
- ❌ Aucun log "Stripe webhook received"

## 🎯 DIAGNOSTIC RAPIDE

### 1️⃣ Vérifier sur Stripe Dashboard
```
1. Allez sur: https://dashboard.stripe.com/test/webhooks
2. Cliquez sur votre webhook (https://my-backend-api-cng7.onrender.com/...)
3. Regardez l'onglet "Webhook attempts" (Tentatives)

   ✅ SI vous voyez des tentatives VERTES (200)
      → Le webhook arrive mais n'est pas traité
      → Vérifiez le signing secret (étape 2)

   ❌ SI vous voyez des tentatives ROUGES (400/500)
      → Le webhook arrive mais génère une erreur
      → Regardez le message d'erreur

   ⚠️ SI vous ne voyez AUCUNE tentative
      → Le webhook n'est pas configuré correctement
      → Recréez le webhook (étape 3)
```

### 2️⃣ Vérifier le Signing Secret
```bash
# Sur votre machine locale
node test-webhook-diagnostic.js

# Comparez avec Stripe:
# Dashboard → Votre webhook → "Signing secret" → Reveal
# Les deux doivent être EXACTEMENT identiques
```

### 3️⃣ Test manuel depuis Stripe
```
1. Dashboard Stripe → Votre webhook
2. Onglet "Test"
3. Event type: checkout.session.completed
4. "Send test webhook"
5. Regardez immédiatement les logs Render
```

## 🔧 SOLUTIONS PAR PROBLÈME

### Problème A: "Webhook signature verification failed"
**Solution:**
```bash
# 1. Récupérer le bon secret sur Stripe
# Dashboard → Webhook → Signing secret → Reveal

# 2. Mettre à jour sur Render
# Dashboard Render → Environment → STRIPE_WEBHOOK_SECRET
# Collez la clé EXACTEMENT (format: whsec_xxxxx)
```

### Problème B: Aucune tentative sur Stripe
**Solution: Recréer le webhook**
```
1. SUPPRIMEZ l'ancien webhook sur Stripe
2. Créez un NOUVEAU webhook:
   - URL: https://my-backend-api-cng7.onrender.com/api/subscription/webhook
   - Events: checkout.session.completed (minimum)
3. Copiez le nouveau signing secret
4. Mettez à jour sur Render
```

### Problème C: Erreur 404 sur Stripe
**Solution: Vérifier l'URL**
```
L'URL EXACTE doit être:
https://my-backend-api-cng7.onrender.com/api/subscription/webhook

⚠️ Attention aux fautes de frappe!
- Pas de slash final
- "subscription" pas "subscriptions"
- "webhook" pas "webhooks"
```

## 🚀 ACTIONS IMMÉDIATES

### Étape 1: Tester la connexion Stripe
```bash
cd lexiflow/backend
node test-webhook-manual.js
```

### Étape 2: Vérifier le statut d'un utilisateur
```bash
node test-check-premium.js lexiflow.contact@gmail.com
```

### Étape 3: Mise à jour manuelle (pour tester)
```bash
# Met l'utilisateur en premium manuellement
node fix-premium-manual.js lexiflow.contact@gmail.com monthly

# Testez l'extension pour voir si ça fonctionne
```

### Étape 4: Logs en temps réel sur Render
```
1. https://dashboard.render.com
2. my-backend-api-cng7 → Logs
3. Gardez ouvert pendant les tests
```

## 🎯 TEST FINAL

1. **Test avec webhook manuel Stripe:**
   - Dashboard Stripe → Test webhook
   - Voyez-vous "✅ Stripe webhook received" dans les logs?

2. **Test avec vrai paiement:**
   - Carte test: 4242 4242 4242 4242
   - Attendez 30 secondes
   - Vérifiez avec: `node test-check-premium.js votre.email@example.com`

## 💡 SI RIEN NE FONCTIONNE

**Solution nucléaire:**
1. Supprimez TOUS les webhooks sur Stripe
2. Créez un nouveau webhook PROPRE
3. Testez IMMÉDIATEMENT avec "Send test webhook"
4. Si le test manuel fonctionne → Refaites un paiement test

## 📝 CHECKLIST FINALE

- [ ] Webhook visible sur Stripe Dashboard
- [ ] URL correcte (pas de faute de frappe)
- [ ] Event checkout.session.completed activé
- [ ] Signing secret identique Stripe/Render
- [ ] Test manuel depuis Stripe = 200 OK
- [ ] Logs Render montrent "webhook received"
- [ ] Compte mis à jour en premium après paiement

## 🆘 BESOIN D'AIDE?

Si après tout ça, ça ne fonctionne toujours pas:

1. **Vérifiez les logs détaillés sur Render**
2. **Copiez l'erreur exacte**
3. **Le problème est probablement:**
   - Signing secret incorrect (90% des cas)
   - URL mal configurée (5% des cas)
   - Webhook désactivé/supprimé (5% des cas)