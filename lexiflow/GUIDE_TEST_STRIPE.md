# Guide de Test Stripe pour LexiFlow

## 1. Démarrer le backend local

Sur votre machine Windows, ouvrez PowerShell dans le dossier `backend` :

```bash
cd C:\Users\akram\Dev\Git_projets\traductor\lexiflow\backend

# Vérifier que le fichier .env contient les bonnes clés
# STRIPE_SECRET_KEY=sk_test_51RpOQL2VEl7gdPoz3lOWEeSUKheSiuUy1RurdWypcJxaRWrM7PniDAxdGhFiOMsyCDViIMoFGxNIl2JVDLADCNrM00nZgcyIfH

# Démarrer le serveur
npm start
```

Le serveur devrait démarrer sur http://localhost:3001

## 2. Configurer l'extension

L'extension est maintenant configurée pour utiliser le backend local (localhost:3001).

## 3. Tester le paiement

1. Ouvrez l'extension Chrome
2. Cliquez sur "⭐ Passer à Premium" (visible dans le header)
3. Choisissez un plan (mensuel ou annuel)
4. Vous serez redirigé vers Stripe

## 4. Carte de test

Utilisez ces informations pour tester :
- **Numéro** : 4242 4242 4242 4242
- **Date** : N'importe quelle date future (ex: 12/25)
- **CVC** : 123
- **Email** : test@example.com

## Dépannage

### Si l'erreur 500 persiste :

1. Vérifiez que le serveur backend est bien démarré
2. Vérifiez les logs du serveur dans PowerShell
3. Assurez-vous que les clés Stripe sont correctes dans .env

### Si vous voulez utiliser le backend Render :

1. Modifiez `extension/config.js` :
   ```javascript
   BASE_URL: 'https://my-backend-api-cng7.onrender.com',
   ```

2. Mais il faudra configurer les variables d'environnement sur Render :
   - STRIPE_SECRET_KEY
   - STRIPE_PUBLISHABLE_KEY
   - STRIPE_WEBHOOK_SECRET
   - Etc.

## Prochaines étapes

1. Une fois les tests réussis en local
2. Déployez le backend avec les bonnes variables
3. Repassez l'extension sur le backend de production