# Changelog - LexiFlow Extension

## [1.0.1] - 2025-01-24

### 🔄 Changements
- **Suppression de la gestion des dossiers supprimés** : L'option "Gérer les dossiers supprimés" a été retirée des paramètres
- **Simplification de la suppression** : Quand un dossier est supprimé, toutes ses flashcards sont définitivement supprimées (serveur + local)
- **Création automatique de dossiers** : Les dossiers sont automatiquement recréés lors de l'ajout d'une nouvelle flashcard

### 🐛 Corrections
- Correction du bug où les flashcards étaient invisibles après ajout dans un dossier précédemment supprimé
- Nettoyage automatique des anciennes données de dossiers supprimés au démarrage

### ✨ Fonctionnalités confirmées
- Mode pratique avec sélection par checkboxes
- Validation minimum 5 mots par dossier pour la pratique
- Option "Pratiquer seulement les cartes ratées" avec badge rouge
- Synchronisation cloud complète
- Mode debug activé pour le développement

### 📝 Documentation
- Ajout du guide utilisateur complet (USER_GUIDE.md)
- Ajout du guide développeur (DEVELOPER_GUIDE.md)
- Mise à jour du README principal
- Création du fichier de test (test-folder-deletion.js)

## [1.0.0] - 2025-01-23

### 🎉 Version initiale
- Traduction instantanée avec bulle contextuelle
- Système de flashcards avec organisation automatique
- Mode pratique avec révision espacée
- Synchronisation via compte Google
- Support de 11 langues
- Interface moderne et responsive