# Plan de migration vers stockage 100% serveur

## Objectifs
1. Supprimer tout stockage local des flashcards
2. Utiliser uniquement le serveur pour les flashcards
3. Conserver la détection de langue via Google Translate uniquement
4. Maintenir la stabilité du système

## Changements à effectuer dans popup.js

### 1. Fonction loadData()
- Ne plus charger les flashcards depuis chrome.storage.local
- Appeler loadFlashcardsFromServer() à la place

### 2. Fonction createFlashcardFromHistory()
- Remplacer la sauvegarde locale par un appel direct au serveur
- Utiliser createFlashcardOnServer()

### 3. Fonction deleteFlashcard()
- Supprimer directement sur le serveur
- Recharger depuis le serveur après suppression

### 4. Fonction clearFlashcards()
- Supprimer toutes les flashcards sur le serveur
- Ne plus toucher au stockage local

### 5. Fonction syncFlashcardsAfterLogin()
- Simplifier pour juste charger depuis le serveur
- Supprimer toute la logique de fusion

### 6. Supprimer ces lignes partout :
```javascript
localStorage.setItem('flashcards', JSON.stringify(flashcards));
chrome.storage.local.set({ flashcards });
chrome.storage.local.get(['flashcards'], ...);
```

## Changements dans content.js

### 1. Fonction createFlashcard()
- Envoyer directement au serveur via background.js
- Ne plus sauvegarder localement

### 2. S'assurer que sourceLanguage vient de Google Translate
- Utiliser data[2] de l'API Google Translate
- Ne jamais envoyer 'auto' comme sourceLanguage

## Avantages
- Plus de problèmes de synchronisation
- Source unique de vérité (serveur)
- Plus simple à maintenir
- Pas de conflits entre machines