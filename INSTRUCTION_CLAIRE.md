# 🚨 INSTRUCTIONS ULTRA CLAIRES

## ❌ NE PAS UTILISER :
- La CLI Stripe
- La ligne de commande
- Les pages de documentation

## ✅ UTILISER UNIQUEMENT LE DASHBOARD WEB

### ÉTAPE 1 : Ouvrez ce lien
# 👉 https://dashboard.stripe.com/test/webhooks

### ÉTAPE 2 : Vous voyez une LISTE
Vous devez voir :
```
Webhooks
━━━━━━━━━━
📌 LexiFlow Premium Subscriptions
   https://my-backend-api-cng7.onrender.com/api/subscription/webhook
   Enabled
```

### ÉTAPE 3 : CLIQUEZ sur "LexiFlow Premium Subscriptions"

### ÉTAPE 4 : Une nouvelle page s'ouvre
En haut, vous voyez 3 ONGLETS :
```
[ Details ] [ Webhook attempts ] [ Test ]
                                    ^^^^
                                CLIQUEZ ICI
```

### ÉTAPE 5 : Dans l'onglet "Test"
Vous voyez :
```
Select event: [Dropdown menu]
              ↓
              checkout.session.completed

[Send test webhook] ← BOUTON BLEU
```

### ÉTAPE 6 : CLIQUEZ "Send test webhook"

### ÉTAPE 7 : Allez dans "Webhook attempts"
Cliquez sur l'onglet du milieu

### ÉTAPE 8 : Dites-moi ce que vous voyez
- 🟢 Ligne verte = OK
- 🔴 Ligne rouge = Erreur
- ⚫ Rien = Pas envoyé

---

## 📱 SI VOUS ÊTES PERDU :

1. FERMEZ tout
2. Ouvrez : https://dashboard.stripe.com/test/webhooks
3. C'est le DASHBOARD, pas la documentation
4. Vous devez voir votre webhook dans une LISTE
5. CLIQUEZ dessus pour l'ouvrir