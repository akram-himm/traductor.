# 🚨 CORRECTION URGENTE - URL WEBHOOK INCORRECTE

## ❌ Problème trouvé
L'URL du webhook configurée sur Stripe est **INCORRECTE** !

- **URL actuelle (FAUSSE):** `https://lexiflow.onrender.com/api/subscription/webhook`
- **URL correcte:** `https://my-backend-api-cng7.onrender.com/api/subscription/webhook`

## ✅ Solution en 30 secondes

### 1️⃣ Allez sur Stripe Dashboard
👉 https://dashboard.stripe.com/test/webhooks

### 2️⃣ Cliquez sur votre webhook
(celui avec l'URL `https://lexiflow.onrender.com/...`)

### 3️⃣ Modifiez l'URL
- Cliquez sur **"Update endpoint"** ou les 3 points → **"Update details"**
- Remplacez l'URL par :
```
https://my-backend-api-cng7.onrender.com/api/subscription/webhook
```
- Cliquez **"Update endpoint"**

### 4️⃣ Testez immédiatement
- Dans le même webhook, onglet **"Test"**
- Event type: `checkout.session.completed`
- Cliquez **"Send test webhook"**
- Vous devriez voir **"200 OK"** ✅

## 🎯 Alternative : Recréer le webhook

Si vous ne pouvez pas modifier l'URL :

1. **Supprimez** l'ancien webhook
2. **"Add endpoint"** avec la BONNE URL :
```
https://my-backend-api-cng7.onrender.com/api/subscription/webhook
```
3. Events à sélectionner :
   - ✅ checkout.session.completed
   - ✅ customer.subscription.created
   - ✅ customer.subscription.updated
   - ✅ customer.subscription.deleted
   - ✅ invoice.payment_succeeded
   - ✅ invoice.payment_failed

4. **Reveal** le nouveau signing secret
5. Mettez à jour sur Render : `STRIPE_WEBHOOK_SECRET = whsec_xxx`

## 🔍 Vérification

Après correction, testez avec :
```bash
cd lexiflow/backend
node test-webhook-manual.js
```

L'URL doit maintenant afficher :
```
URL: https://my-backend-api-cng7.onrender.com/api/subscription/webhook
✅ C'est votre endpoint Render!
```

## 🎉 Résultat attendu

1. Test manuel → **200 OK**
2. Logs Render → **"✅ Stripe webhook received"**
3. Paiement test → **Compte premium activé** !

---

**C'est LA cause du problème !** Une fois l'URL corrigée, tout fonctionnera.