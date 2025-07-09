#!/bin/bash

echo "🚀 Auto-push des modifications..."

# Fonction pour push un repository
push_repo() {
    local repo_path=$1
    local repo_name=$2
    
    echo ""
    echo "📁 Repository: $repo_name"
    echo "Path: $repo_path"
    
    cd "$repo_path" || {
        echo "❌ Impossible d'accéder à $repo_path"
        return 1
    }
    
    # Vérifier s'il y a des modifications
    if [[ -z $(git status -s) ]]; then
        echo "✅ Aucune modification à pusher"
        return 0
    fi
    
    # Afficher le status
    echo "📝 Modifications détectées:"
    git status -s
    
    # Ajouter tous les fichiers
    git add .
    
    # Créer le commit
    echo "💾 Création du commit..."
    git commit -m "Fix: OAuth authentication and flashcard synchronization

- Fixed popup not updating after OAuth login
- Fixed flashcards disappearing after login
- Fixed flashcard creation and sync with backend
- Added support for multiple flashcard formats
- Improved error handling and user feedback"
    
    # Pusher vers GitHub
    echo "📤 Push vers GitHub..."
    git push origin main || git push origin master
    
    if [ $? -eq 0 ]; then
        echo "✅ Push réussi pour $repo_name!"
    else
        echo "❌ Erreur lors du push pour $repo_name"
        return 1
    fi
}

# Push du backend
push_repo "/home/akram/Bureau/my-backend-api" "Backend API"

# Push de l'extension
push_repo "/home/akram/Bureau/traductor" "Extension Chrome"

echo ""
echo "🎉 Terminé!"
echo ""
echo "Prochaines étapes:"
echo "1. Recharger l'extension dans Chrome"
echo "2. Ouvrir la console (Clic droit → Inspecter le popup)"
echo "3. Chercher les erreurs JavaScript"
echo "4. Me partager l'erreur pour corriger"