#!/bin/bash

echo "🚀 Déploiement des corrections OAuth et Flashcards..."

# Naviguer vers le dossier backend
cd /home/akram/Bureau/my-backend-api

echo "📦 Commit des changements backend..."
git add routes/oauth.js public/oauth-intermediate.html
git commit -m "Fix: Forcer la sélection de compte Google et déconnexion automatique

- Ajout de la gestion des paramètres de requête (prompt, max_age) dans OAuth
- Création d'une page intermédiaire pour forcer la déconnexion Google
- Amélioration du flux d'authentification pour éviter la connexion automatique"

echo "📤 Push vers le serveur..."
git push origin main

echo "✅ Backend déployé!"

# Naviguer vers le dossier extension
cd /home/akram/Bureau/traductor/lexiflow/extension

echo "📦 Commit des changements extension..."
git add popup.js
git commit -m "Fix: Préservation des flashcards lors de la reconnexion

- Amélioration de la détection du même utilisateur (lastUserId + lastDisconnectedUserId)
- Conservation des flashcards locales lors de la déconnexion
- Fusion intelligente des flashcards locales et serveur
- Correction du nettoyage des données entre comptes différents"

echo "📤 Push vers le serveur..."
git push origin main

echo "✅ Extension déployée!"

echo "
🎉 Déploiement terminé!

Changements appliqués:
1. ✅ OAuth forcera maintenant la sélection de compte Google
2. ✅ Les flashcards sont préservées lors de la reconnexion au même compte
3. ✅ Les données sont correctement nettoyées lors du changement de compte
4. ✅ Synchronisation améliorée entre local et serveur

⚠️  N'oubliez pas de:
- Redémarrer le serveur backend sur Render
- Recharger l'extension dans Chrome
"