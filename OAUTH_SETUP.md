# Configuration OAuth Google pour LexiFlow

## Prérequis

1. Un compte Google Cloud Platform
2. Un projet créé dans Google Cloud Console
3. Les variables d'environnement configurées

## Étapes de configuration

### 1. Créer un projet Google Cloud

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un nouveau projet ou sélectionner un projet existant
3. Activer l'API Google+ (pour OAuth)

### 2. Configurer OAuth 2.0

1. Dans la console Google Cloud, aller dans "APIs & Services" > "Credentials"
2. Cliquer sur "Create Credentials" > "OAuth client ID"
3. Choisir "Web application"
4. Configurer les URIs :
   - **Authorized JavaScript origins** :
     - `https://my-backend-api-cng7.onrender.com`
     - `http://localhost:3000` (pour le développement)
   - **Authorized redirect URIs** :
     - `https://my-backend-api-cng7.onrender.com/api/auth/google/callback`
     - `http://localhost:3000/api/auth/google/callback` (pour le développement)

### 3. Variables d'environnement

Créer un fichier `.env` dans le dossier backend avec :

```env
# Google OAuth
GOOGLE_CLIENT_ID=votre-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre-client-secret
GOOGLE_CALLBACK_URL=https://my-backend-api-cng7.onrender.com/api/auth/google/callback

# Frontend URL
FRONTEND_URL=https://my-backend-api-cng7.onrender.com

# JWT et Session
JWT_SECRET=une-clé-secrète-complexe
SESSION_SECRET=une-autre-clé-secrète
```

### 4. Déploiement sur Render

1. Dans les paramètres de votre service Render, ajouter les variables d'environnement
2. S'assurer que les URLs de callback correspondent à votre domaine Render
3. Redéployer le service

## Flux d'authentification

1. L'utilisateur clique sur "Se connecter avec Google"
2. L'extension ouvre un nouvel onglet vers `/api/auth/google`
3. Le serveur redirige vers Google pour l'authentification
4. Google redirige vers `/api/auth/google/callback` avec le code
5. Le serveur échange le code contre un token JWT
6. Le serveur redirige vers `/oauth-success.html?token=JWT`
7. L'extension détecte cette URL et récupère le token
8. L'extension ferme l'onglet et connecte l'utilisateur

## Changement de compte

Pour forcer la sélection d'un autre compte Google :
- L'URL inclut `?prompt=select_account&max_age=0`
- Cela force Google à afficher la page de sélection de compte

## Dépannage

### Le bouton reste en chargement
- Vérifier les logs du serveur pour les erreurs OAuth
- Vérifier que les variables d'environnement sont correctes
- Vérifier les URLs de callback dans Google Cloud Console

### Erreur "Not allowed by CORS"
- Vérifier que l'origine de l'extension est autorisée dans le backend
- Les extensions Chrome ont une origine de type `chrome-extension://...`

### L'utilisateur reste connecté après déconnexion
- S'assurer que le token est bien supprimé du stockage Chrome
- Vérifier que `resetUIAfterLogout()` est appelé