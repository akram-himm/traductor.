# Analyse des problèmes d'authentification et de persistance - LexiFlow

## Problèmes identifiés

### 1. OAuth ouvre un onglet au lieu d'une popup
**Localisation**: `popup.js` ligne 2279
```javascript
chrome.tabs.create({ url: authUrl }, (tab) => {
```
**Cause**: Utilisation de `chrome.tabs.create` au lieu de `chrome.windows.create`
**Impact**: L'utilisateur perd le contexte de l'extension pendant la connexion

### 2. Les flashcards disparaissent après création
**Localisation**: Multiple endroits
- `popup.js` : La fonction `saveFlashcards()` (ligne 1641) sauvegarde correctement localement
- `backend/routes/flashcards.js` : Le backend utilise des mocks (fakeFlashcardCount) au lieu de vraie persistance
- Après connexion OAuth, `loadUserFlashcards()` est appelée mais le backend retourne un tableau vide car pas de vraie DB

### 3. Données disparaissent lors de déconnexion/reconnexion
**Localisation**: `popup.js` ligne 2811
```javascript
// Dans resetUIAfterLogout()
translations = [];
flashcards = [];
```
**Cause**: La fonction `resetUIAfterLogout()` efface toutes les données locales
**Impact**: Perte de toutes les traductions et flashcards à chaque déconnexion

### 4. Menu utilisateur non affiché
**Localisation**: Le menu utilisateur n'existe pas dans `popup.html`
- Seul un bouton login existe (ligne 1244)
- Les fonctions `showUserMenu()` et les event listeners pour `logoutBtn`/`switchAccountBtn` existent dans `popup.js` mais pas d'éléments HTML correspondants
- Le menu est créé dynamiquement dans `showUserMenu()` mais jamais affiché car le bouton login n'a pas la logique pour l'afficher quand connecté

### 5. Connexion automatique sans choix de compte
**Localisation**: `auth.js` backend ligne 115
- Le paramètre `prompt: 'select_account'` est passé mais peut être ignoré si l'utilisateur a une session active
- Les modèles User et Flashcard existent mais ne sont pas utilisés correctement (routes mockées)

## Solutions proposées

### 1. Utiliser une popup pour OAuth
```javascript
// Remplacer chrome.tabs.create par:
chrome.windows.create({
  url: authUrl,
  type: 'popup',
  width: 500,
  height: 600,
  left: Math.round((window.screen.width - 500) / 2),
  top: Math.round((window.screen.height - 600) / 2)
}, (window) => {
  // Gérer la fenêtre popup
});
```

### 2. Corriger la synchronisation des flashcards
- Ne pas appeler `resetUIAfterLogout()` après une connexion réussie
- Implémenter une vraie synchronisation avec le backend
- Le backend doit retourner les vraies flashcards, pas des mocks

### 3. Séparer les données utilisateur de l'état d'authentification
```javascript
function resetAuthState() {
  // Clear ONLY auth-related data
  chrome.storage.local.remove(['authToken', 'userProfile']);
  // DO NOT clear flashcards or translations
}
```

### 4. Ajouter le menu utilisateur dans popup.html
```html
<div id="userMenu" class="user-menu" style="display: none;">
  <div class="user-info">
    <span id="userEmail"></span>
  </div>
  <button id="switchAccountBtn">Changer de compte</button>
  <button id="logoutBtn">Se déconnecter</button>
</div>
```

### 5. Forcer la sélection de compte Google
- Ajouter `prompt=select_account&approval_prompt=force` dans l'URL OAuth
- Vider les cookies Google avant la connexion
- Utiliser `max_age=0` pour forcer la ré-authentification

## Fichiers à modifier

1. **popup.js**
   - Fonction `handleOAuthLogin()` - utiliser popup
   - Fonction `resetUIAfterLogout()` - ne pas effacer les données
   - Fonction `handleSuccessfulAuth()` - ne pas appeler reset
   - Fonction `saveFlashcards()` - ajouter backup persistant

2. **popup.html**
   - Ajouter la structure HTML du menu utilisateur
   - Ajouter les styles CSS pour le menu

3. **backend/routes/flashcards.js**
   - Implémenter une vraie persistance au lieu des mocks
   - Retourner les vraies données de l'utilisateur

4. **background.js**
   - Améliorer la gestion des fenêtres OAuth
   - Ajouter un listener pour fermer la popup après succès

## Plan d'action

1. **Phase 1**: Corriger l'affichage du menu utilisateur
   - Modifier `popup.html` pour ajouter la structure du menu
   - Modifier la logique du bouton login pour afficher le menu quand connecté
   - Tester le menu avec déconnexion et changement de compte

2. **Phase 2**: Implémenter OAuth en popup
   - Remplacer `chrome.tabs.create` par `chrome.windows.create`
   - Gérer la fermeture automatique de la popup après succès
   - Améliorer la gestion dans `background.js`

3. **Phase 3**: Corriger la persistance des données
   - Ne pas appeler `resetUIAfterLogout()` après connexion
   - Séparer les données utilisateur de l'état d'authentification
   - Implémenter un système de backup local persistant

4. **Phase 4**: Corriger le backend
   - Implémenter la vraie persistance dans `routes/flashcards.js`
   - Utiliser les modèles Sequelize au lieu des mocks
   - Assurer la synchronisation bidirectionnelle

5. **Phase 5**: Tester tous les scénarios
   - Connexion/déconnexion sans perte de données
   - Changement de compte avec sauvegarde des données
   - Synchronisation offline/online
   - Limites free/premium

## Architecture actuelle

### Frontend (Extension)
- **popup.js**: Logique principale, gestion UI et flashcards
- **config.js**: Configuration API et helpers
- **background.js**: Service worker, gestion OAuth callbacks
- **popup.html**: Interface utilisateur (manque le menu)

### Backend
- **Models**: User et Flashcard avec Sequelize
- **Routes**: 
  - `/api/auth/*`: Authentification (Google OAuth fonctionnel)
  - `/api/flashcards`: CRUD flashcards (mocké)
  - `/api/sync/flashcards`: Synchronisation (nécessite premium)
- **Middleware**: Auth et premium check

### Problèmes critiques à résoudre en priorité
1. **Menu utilisateur manquant** - Empêche la déconnexion
2. **Backend mocké** - Flashcards ne persistent pas
3. **Reset des données** - Perte à chaque déconnexion