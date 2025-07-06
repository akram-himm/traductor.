#!/bin/bash

# Script de déploiement pour le backend my-backend-api
# Ce script automatise le processus de déploiement

echo "🚀 Déploiement du backend LexiFlow..."

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Vérifier si on est dans le bon répertoire
BACKEND_DIR="/home/akram/Bureau/my-backend-api"

if [ ! -d "$BACKEND_DIR" ]; then
    print_error "Le dossier $BACKEND_DIR n'existe pas!"
    exit 1
fi

# Aller dans le répertoire backend
cd "$BACKEND_DIR" || exit 1
print_status "Navigation vers $BACKEND_DIR"

# Vérifier le statut Git
echo ""
echo "📋 Statut Git actuel:"
git status --short

# Demander confirmation avant de continuer
echo ""
read -p "Voulez-vous continuer avec le déploiement? (o/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Oo]$ ]]; then
    print_warning "Déploiement annulé"
    exit 0
fi

# Ajouter tous les fichiers modifiés
print_status "Ajout des fichiers modifiés..."
git add .

# Vérifier s'il y a des changements à commiter
if git diff --cached --quiet; then
    print_warning "Aucun changement à commiter"
else
    # Commiter les changements
    echo ""
    read -p "Message de commit: " commit_message
    if [ -z "$commit_message" ]; then
        commit_message="Update backend configuration"
    fi
    
    git commit -m "$commit_message"
    print_status "Changements commités"
fi

# Pusher vers GitHub
print_status "Push vers GitHub..."
if git push origin main; then
    print_status "Push réussi!"
else
    print_error "Erreur lors du push"
    exit 1
fi

echo ""
echo "🎉 Déploiement terminé!"
echo ""
echo "📝 Prochaines étapes:"
echo "1. Vérifiez le déploiement sur https://dashboard.render.com"
echo "2. Attendez que le statut soit 'Live'"
echo "3. Testez l'API: https://my-backend-api-cng7.onrender.com/health"
echo ""
echo "💡 Variables à configurer sur Render:"
echo "   - CLIENT_URL = chrome-extension://VOTRE_ID_EXTENSION"
echo "   - CHROME_EXTENSION_ID = VOTRE_ID_EXTENSION"
echo "   - API_URL = https://my-backend-api-cng7.onrender.com"
echo ""