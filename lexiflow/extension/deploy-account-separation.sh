#!/bin/bash

echo "🚀 Déploiement de la séparation stricte des données par compte..."

# Naviguer vers le dossier backend
cd /home/akram/Bureau/my-backend-api

echo "📦 Commit des changements backend..."
git add routes/oauth.js public/oauth-intermediate.html
git commit -m "Fix: Forcer la sélection de compte Google avec déconnexion automatique

- Gestion des paramètres prompt et max_age dans la route OAuth
- Page intermédiaire pour forcer la déconnexion Google après authentification
- Garantit la sélection de compte à chaque connexion"

echo "📤 Push vers le serveur backend..."
git push origin main

echo "✅ Backend déployé!"

# Naviguer vers le dossier extension
cd /home/akram/Bureau/traductor/lexiflow/extension

echo "📦 Commit des changements extension..."
git add popup.js
git commit -m "Refactor: Séparation stricte des données par compte

- Suppression de toute logique de fusion des données locales
- Les flashcards sont maintenant exclusivement liées au compte connecté
- Nettoyage automatique des données lors de la déconnexion
- Synchronisation directe avec le serveur lors de la création de flashcards
- Les données sont rechargées uniquement depuis le serveur à la connexion"

echo "📤 Push vers le serveur extension..."
git push origin main

echo "✅ Extension déployée!"

echo "
🎉 Déploiement terminé!

📋 Changements appliqués:

1. ✅ Séparation stricte des données par compte
   - Chaque compte a ses propres flashcards sur le serveur
   - Aucune fusion avec les données locales
   - Les données locales sont nettoyées à la déconnexion

2. ✅ Forçage de la sélection de compte Google
   - Déconnexion automatique de Google après chaque authentification
   - L'utilisateur doit sélectionner son compte à chaque connexion

3. ✅ Synchronisation serveur uniquement
   - Les flashcards sont créées directement sur le serveur
   - Les données sont chargées depuis le serveur à la connexion
   - Stockage local uniquement pour l'utilisation hors ligne

⚠️  Actions requises:
1. Redémarrer le serveur backend sur Render
2. Recharger l'extension dans Chrome (chrome://extensions)
3. Tester avec différents comptes Google

🔒 Comportement attendu:
- À la déconnexion: toutes les données locales sont effacées
- À la connexion: les données du compte sont chargées depuis le serveur
- Changement de compte: les données du compte précédent disparaissent
- Même compte sur un autre PC: retrouve ses données depuis le serveur
"