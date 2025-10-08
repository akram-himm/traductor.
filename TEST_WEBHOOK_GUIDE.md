# 🎯 GUIDE TEST WEBHOOK - ÉTAPE PAR ÉTAPE

## OÙ REGARDER SUR STRIPE

### 1. Page principale des webhooks
URL : https://dashboard.stripe.com/test/webhooks

Vous devez voir :
```
📌 LexiFlow Premium Subscriptions
   https://my-backend-api-cng7.onrender.com/...
   Enabled
```

### 2. CLIQUEZ sur "LexiFlow Premium Subscriptions"

### 3. Vous voyez 3 onglets :
```
[ Details ] [ Webhook attempts ] [ Test ]
```

### 4. Cliquez sur "Test"

### 5. Dans l'onglet Test :
- **Select event** → Choisissez : `checkout.session.completed`
- Descendez → Bouton bleu : **"Send test webhook"**
- CLIQUEZ sur ce bouton

### 6. Après avoir cliqué :
- Allez dans l'onglet **"Webhook attempts"**
- ATTENDEZ 5 secondes
- Rafraîchissez la page (F5)

## CE QUE VOUS DEVEZ VOIR

### ✅ SI TOUT FONCTIONNE :
```
Webhook attempts
━━━━━━━━━━━━━━━
🟢 200  checkout.session.completed  Il y a quelques secondes
```

### ❌ SI ERREUR SIGNING SECRET :
```
Webhook attempts
━━━━━━━━━━━━━━━
🔴 400  checkout.session.completed  Il y a quelques secondes
        "Webhook signature verification failed"
```

### ⚫ SI RIEN N'APPARAÎT :
- Le test n'a pas été envoyé
- Réessayez depuis l'onglet "Test"

## ACTIONS SELON LE RÉSULTAT

### Si 🟢 200 OK :
✅ Parfait ! Les webhooks fonctionnent !
→ Faites un paiement test pour vérifier

### Si 🔴 400 Erreur :
1. Récupérez le signing secret (onglet Details → Reveal)
2. Mettez-le sur Render
3. Attendez 3 min
4. Refaites le test

### Si ⚫ Rien :
1. Vérifiez que vous êtes bien dans le bon webhook
2. Réessayez le test
3. Vérifiez que le webhook est "Enabled"

## TEST FINAL

Une fois que vous avez 🟢 200 :
1. Faites un vrai paiement test
2. Carte : 4242 4242 4242 4242
3. Le compte doit passer en Premium !

---

**IMPORTANT** : Dites-moi quelle couleur/status vous voyez dans "Webhook attempts" !