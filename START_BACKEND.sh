#!/bin/bash

# Script pour démarrer rapidement le backend avec ngrok

echo "🚀 Démarrage du backend..."

# Terminal 1: Backend
gnome-terminal --tab --title="Backend" -- bash -c "cd /home/akram/Bureau/my-backend-api && npm start; bash"

# Attendre que le serveur démarre
sleep 3

# Terminal 2: Ngrok
echo "🌐 Démarrage de ngrok..."
gnome-terminal --tab --title="Ngrok" -- bash -c "ngrok http 5000; bash"

echo "✅ Backend et ngrok démarrés!"
echo ""
echo "📝 Prochaines étapes:"
echo "1. Copier l'URL HTTPS de ngrok (ex: https://abc123.ngrok.io)"
echo "2. Mettre à jour config.js avec cette URL"
echo "3. Ajouter l'URL dans Google Cloud Console"
echo "4. Recharger l'extension Chrome"