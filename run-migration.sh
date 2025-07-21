#!/bin/bash

echo "🔄 Exécution de la migration pour ajouter sourceLanguage..."

# Se déplacer dans le dossier backend
cd lexiflow/backend

# Exécuter la migration
echo "📊 Application de la migration..."
npx sequelize-cli db:migrate

echo "✅ Migration terminée!"
echo ""
echo "⚠️  IMPORTANT: Vous devez déployer ces changements sur Render :"
echo "1. Commitez et pushez ces changements"
echo "2. Le déploiement sur Render devrait se faire automatiquement"
echo "3. Vérifiez les logs sur Render pour confirmer que la migration s'est bien exécutée"