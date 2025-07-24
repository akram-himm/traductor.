# 🛠️ Guide Développeur LexiFlow

## 📋 Vue d'ensemble

LexiFlow est une extension Chrome (Manifest V3) qui combine traduction instantanée et apprentissage par flashcards avec synchronisation cloud.

## 🏗️ Architecture

### Structure des Fichiers

```
extension/
├── manifest.json          # Configuration Manifest V3
├── background.js          # Service Worker
├── content.js            # Script de contenu (injection)
├── popup.html            # Interface utilisateur principale
├── popup.js              # Logique du popup
├── popup.css             # Styles de l'interface
├── practice-system.js    # Système de pratique des flashcards
├── flashcard-sync.js     # Synchronisation avec le backend
├── config.js             # Configuration API
└── auth-example.js       # Exemple d'authentification
```

### Composants Principaux

#### 1. Service Worker (`background.js`)
- Gestion des événements Chrome
- Communication entre popup et content script
- Synchronisation des flashcards avec le backend
- Gestion OAuth2

#### 2. Content Script (`content.js`)
- Détection de sélection de texte
- Affichage de la bulle de traduction
- Communication avec le service worker
- Gestion des raccourcis clavier

#### 3. Popup (`popup.js`)
- Interface utilisateur principale
- Gestion des flashcards locales
- Synchronisation avec le backend
- Mode pratique

#### 4. Système de Pratique (`practice-system.js`)
- Algorithme de révision espacée
- Génération des choix multiples
- Suivi des performances
- Gestion des cartes ratées

## 🔧 Installation pour le Développement

### Prérequis
- Chrome/Chromium navigateur
- Node.js 16+ (pour le backend)
- Git

### Étapes

1. **Cloner le dépôt**
```bash
git clone [repository-url]
cd lexiflow/extension
```

2. **Configuration du Backend**
```bash
cd my-backend-api
npm install
# Configurer les variables d'environnement (.env)
npm start
```

3. **Charger l'Extension**
- Ouvrir `chrome://extensions/`
- Activer "Mode développeur"
- "Charger l'extension non empaquetée"
- Sélectionner le dossier `extension/`

## 🔑 APIs et Services

### Backend API (Render)
- **URL**: `https://my-backend-api-cng7.onrender.com`
- **Authentification**: JWT Bearer Token
- **Endpoints**:
  - `/api/auth/google` - OAuth Google
  - `/api/flashcards` - CRUD flashcards
  - `/api/user` - Gestion utilisateur

### Services de Traduction
- **Google Translate** (API gratuite)
- Format: `https://translate.googleapis.com/translate_a/single`

## 💾 Stockage des Données

### Chrome Storage API

#### `chrome.storage.local`
```javascript
{
  authToken: "jwt_token",
  user: { id, email, name },
  translations: [...],      // Historique local
  practiceStats: {...}      // Statistiques de pratique
}
```

#### `chrome.storage.sync`
```javascript
{
  targetLanguage: "fr",
  isEnabled: true,
  buttonColor: "#3b82f6",
  deletedFolders: ["en_fr", "es_fr"],  // Dossiers supprimés
  settings: {...}
}
```

#### LocalStorage (popup uniquement)
```javascript
{
  failedFlashcards: ["id1", "id2"],    // Cartes ratées
  flashcards: [...]                     // Cache local (deprecated)
}
```

## 🔄 Flux de Données

### Création de Flashcard
1. Utilisateur sélectionne texte
2. Content script détecte et affiche bulle
3. Click sur "Flashcard"
4. Message vers background.js
5. Background synchronise avec backend
6. Popup se met à jour via message

### Synchronisation
```javascript
// Flux de synchronisation
Content Script -> Background -> Backend API
                      ↓
                   Storage
                      ↓
                   Popup UI
```

## 🐛 Debug et Développement

### Activer le Mode Debug
```javascript
// Dans chaque fichier
const DEBUG = true;
const POPUP_DEBUG = true;
const SYNC_DEBUG = true;
```

### Console de Développement
- **Popup**: Clic droit → Inspecter
- **Background**: chrome://extensions/ → Service Worker
- **Content**: F12 sur la page web

### Logs Utiles
```javascript
debug('🔄 Synchronisation:', data);
debug('✅ Succès:', response);
debug('❌ Erreur:', error);
```

## 📝 Conventions de Code

### Nommage
- **Variables**: camelCase
- **Constantes**: UPPER_SNAKE_CASE
- **Classes**: PascalCase
- **Fichiers**: kebab-case.js

### Structure des Fonctions
```javascript
async function createFlashcard(data) {
  // Validation
  if (!data.originalText) return;
  
  // Debug
  debug('📝 Création flashcard:', data);
  
  // Logique
  try {
    const response = await api.create(data);
    return response;
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}
```

### Gestion d'Erreurs
```javascript
try {
  // Code risqué
} catch (error) {
  if (error.status === 401) {
    // Gérer authentification
  } else if (error.status === 409) {
    // Gérer duplication
  } else {
    // Erreur générale
    console.error('Erreur:', error);
  }
}
```

## 🧪 Tests

### Tests Manuels
1. **Traduction**: Sélectionner texte sur différents sites
2. **Flashcards**: Créer, modifier, supprimer
3. **Pratique**: Tester avec 5+ cartes
4. **Synchronisation**: Déconnexion/reconnexion
5. **Multi-onglets**: Vérifier la cohérence

### Cas de Test Critiques
- [ ] Création flashcard sans connexion
- [ ] Restauration dossier supprimé
- [ ] Pratique avec cartes inversées
- [ ] Synchronisation après offline
- [ ] Limites utilisateur gratuit

## 🚀 Déploiement

### Extension
1. Incrémenter version dans `manifest.json`
2. Créer ZIP du dossier `extension/`
3. Upload sur Chrome Web Store

### Backend
- Push sur `main` → Auto-déploiement Render
- Variables d'environnement sur Render Dashboard

## 🔒 Sécurité

### Bonnes Pratiques
- Jamais de clés API dans le code
- Validation côté serveur
- Échapper tout contenu utilisateur
- HTTPS obligatoire
- CSP strict dans manifest.json

### Permissions Manifest V3
```json
{
  "permissions": [
    "storage",
    "activeTab",
    "contextMenus"
  ],
  "host_permissions": [
    "https://translate.googleapis.com/*",
    "https://my-backend-api-cng7.onrender.com/*"
  ]
}
```

## 📚 Ressources

### Documentation
- [Chrome Extensions](https://developer.chrome.com/docs/extensions/mv3/)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/)

### Outils
- [Extension Reloader](https://chrome.google.com/webstore/detail/extensions-reloader)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

## 🤝 Contribution

### Workflow Git
```bash
git checkout -b feature/nom-feature
# Développement
git add .
git commit -m "feat: description"
git push origin feature/nom-feature
# Créer Pull Request
```

### Standards de Commit
- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage
- `refactor:` Refactoring
- `test:` Tests
- `chore:` Maintenance

---

**Version**: 1.0.0  
**Dernière mise à jour**: Janvier 2025