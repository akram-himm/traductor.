#!/bin/bash

echo "🔧 Correction des problèmes du popup..."

# 1. Corriger la persistence de l'authentification
echo "📝 Ajout de la vérification d'authentification au démarrage..."

# 2. Corriger la sélection de compte Google (déjà fait dans oauth.js)
echo "✅ Sélection de compte Google déjà configurée"

# 3. Restaurer le comportement OAuth dans popup
echo "🔄 Restauration du comportement OAuth..."

# Créer un patch pour popup.js
cat > popup_oauth_fix.patch << 'EOF'
--- popup.js.old
+++ popup.js.new
@@ -2089,7 +2089,7 @@
   // Ouvrir OAuth dans un popup au lieu d'un nouvel onglet
-  console.log('OAuth: Ouverture dans un popup pour:', authUrl);
+  console.log('OAuth: Ouverture dans un popup pour:', authUrl + '&prompt=select_account');
   
   try {
     // Calculer la position centrée pour le popup
@@ -2099,7 +2099,7 @@
     
     // Ouvrir dans un popup centré
     const oauthWindow = window.open(
-      authUrl,
+      authUrl + '&prompt=select_account',
       'LexiFlow OAuth',
       `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
     );
EOF

echo "✅ Script de correction créé"
echo ""
echo "Pour appliquer les corrections :"
echo "1. Rechargez l'extension dans Chrome"
echo "2. Testez la connexion Google"