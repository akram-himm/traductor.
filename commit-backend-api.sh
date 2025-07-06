#!/bin/bash

# Script pour commiter et pusher les changements du backend API

echo "🚀 Commit automatique pour my-backend-api..."

BACKEND_DIR="/home/akram/Bureau/my-backend-api"

# Vérifier si le dossier existe
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Le dossier $BACKEND_DIR n'existe pas!"
    exit 1
fi

# Aller dans le dossier
cd "$BACKEND_DIR" || exit 1

# Ajouter tous les fichiers
git add .

# Vérifier s'il y a des changements
if git diff --cached --quiet; then
    echo "✅ Aucun changement à commiter"
    exit 0
fi

# Commiter avec un message descriptif
git commit -m "Update backend configuration for Render deployment

- Add OAuth support with Passport.js
- Fix render.yaml duplicate sync:false
- Add ping endpoint for health checks
- Update CORS configuration for Chrome extension
- Add session management
- Update environment variables

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Pusher vers GitHub
echo "📤 Push vers GitHub..."
git push origin main

echo "✅ Terminé!"