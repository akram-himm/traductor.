# 🔧 Guide de Débogage OAuth Google

## Problème actuel
- **Erreur** : "Authorization page could not be loaded"
- **Cause** : chrome.identity.launchWebAuthFlow nécessite une configuration spéciale dans manifest.json et Google Console

## Solution appliquée
J'ai désactivé chrome.identity et forcé l'utilisation de la méthode popup qui fonctionne toujours.

## Configuration requise

### 1. Variables d'environnement sur Render
```
GOOGLE_CLIENT_ID=votre_client_id_google
GOOGLE_CLIENT_SECRET=votre_client_secret_google
JWT_SECRET=une_longue_chaine_secrete
CLIENT_URL=chrome-extension://votre_extension_id
SESSION_SECRET=autre_chaine_secrete
API_URL=https://my-backend-api-cng7.onrender.com
```

### 2. Google Cloud Console
1. Allez sur [console.cloud.google.com](https://console.cloud.google.com)
2. Créez un nouveau projet
3. Activez "Google+ API"
4. Créez des identifiants OAuth 2.0 :
   - **Type** : Application Web
   - **Origines JavaScript autorisées** :
     ```
     https://my-backend-api-cng7.onrender.com
     http://localhost:3000
     ```
   - **URI de redirection autorisés** :
     ```
     https://my-backend-api-cng7.onrender.com/api/auth/google/callback
     http://localhost:3000/api/auth/google/callback
     ```

### 3. Obtenir l'ID de votre extension
1. Ouvrez `chrome://extensions/`
2. Activez le mode développeur
3. Copiez l'ID de votre extension (ex: `abcdefghijklmnopqrstuvwxyz123456`)

## Test de débogage

### 1. Vérifier les logs dans la console de l'extension
```javascript
// Clic droit sur l'extension → Inspecter le popup → Console
```

### 2. Tester l'URL OAuth directement
```
https://my-backend-api-cng7.onrender.com/api/auth/google
```

### 3. Vérifier les erreurs côté serveur
Dans les logs Render, cherchez :
- Erreurs de configuration Google
- Erreurs de base de données
- Erreurs de création d'utilisateur

## Corrections appliquées
1. ✅ Désactivé chrome.identity (problématique)
2. ✅ Utilisé la méthode window.open (plus fiable)
3. ✅ Ajouté des pages HTML pour la communication
4. ✅ Amélioré la gestion des erreurs
5. ✅ Ajouté un feedback visuel sur le bouton

## Commandes à exécuter

### 1. Dans my-backend-api
```bash
cd /home/akram/Bureau/my-backend-api
git add .
git commit -m "Fix trust proxy and OAuth flow"
git push
```

### 2. Recharger l'extension
1. `chrome://extensions/`
2. Cliquer sur l'icône de rechargement

## Erreurs communes et solutions

### "User already exists with this email"
- Le compte existe déjà avec email/password
- Solution : Le backend devrait lier automatiquement le compte Google

### "Authorization page could not be loaded"
- chrome.identity mal configuré
- Solution : Utiliser window.open (déjà fait)

### "Not allowed by CORS"
- Mauvaise configuration CLIENT_URL
- Solution : Vérifier que CLIENT_URL commence par "chrome-extension://"