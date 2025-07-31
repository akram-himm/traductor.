# Guide de résolution des problèmes de souscription

## Problème : "Failed to cancel subscription" / "Failed to create subscription record"

### Solutions implémentées :

1. **Ajout du bouton "Sync with Stripe"** dans la page de souscription
   - Ce bouton synchronise votre compte avec Stripe
   - Il crée automatiquement les enregistrements manquants dans la base de données

2. **Amélioration de la route d'annulation**
   - Cherche maintenant directement dans Stripe si pas trouvé dans la DB
   - Gère plusieurs statuts de souscription (active, trialing, past_due)

3. **Corrections techniques**
   - Import des associations Sequelize corrigé
   - Gestion des souscriptions existantes améliorée
   - Suppression de la contrainte unique sur stripeCustomerId

### Comment utiliser :

1. **Ouvrir la page de souscription** dans l'extension
2. **Cliquer sur le bouton "Sync with Stripe"** (bouton violet)
3. **Attendre le message de confirmation**
4. **Essayer d'annuler à nouveau** si c'était votre objectif

### Si le problème persiste :

1. **Faire un clic droit sur le bouton "Cancel Subscription"**
2. **Confirmer la création de l'enregistrement manquant**
3. **Rafraîchir la page et réessayer**

### Notes :
- Les boutons de synchronisation sont temporaires et seront retirés une fois que tout fonctionne correctement
- Votre souscription Stripe est toujours active même si la DB avait un problème