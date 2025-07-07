# Configuration Backend sur Render

## 🔧 Variables d'environnement à configurer sur Render

### 1. Obtenir l'ID de votre extension Chrome
1. Ouvrez Chrome et allez sur `chrome://extensions/`
2. Activez le "Mode développeur" en haut à droite
3. Chargez votre extension (dossier `lexiflow/extension`)
4. Copiez l'ID qui apparaît sous le nom de l'extension (format: `abcdefghijklmnopqrstuvwxyz123456`)

### 2. Variables à ajouter dans Render Dashboard

Allez sur [Render Dashboard](https://dashboard.render.com/) → Votre service → Environment → Add Environment Variable

```bash
# === SÉCURITÉ CORS ===
CHROME_EXTENSION_ID=votre_id_extension_chrome
ALLOWED_ORIGINS=chrome-extension://votre_id_extension_chrome,https://votre-site.com

# === OAUTH GOOGLE ===
GOOGLE_CLIENT_ID=votre_google_client_id
GOOGLE_CLIENT_SECRET=votre_google_client_secret

# === OAUTH FACEBOOK ===
FACEBOOK_APP_ID=votre_facebook_app_id
FACEBOOK_APP_SECRET=votre_facebook_app_secret

# === OAUTH APPLE ===
APPLE_CLIENT_ID=votre_apple_client_id
APPLE_TEAM_ID=votre_apple_team_id
APPLE_KEY_ID=votre_apple_key_id
APPLE_PRIVATE_KEY=votre_apple_private_key_base64

# === URLs DE CALLBACK ===
OAUTH_REDIRECT_URL=https://my-backend-api-cng7.onrender.com/api/auth/callback
FRONTEND_URL=chrome-extension://votre_id_extension_chrome
```

## 📱 Configuration OAuth

### Google OAuth
1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un projet ou sélectionnez-en un existant
3. Dans "APIs & Services" → "Credentials"
4. Créez "OAuth 2.0 Client ID"
5. Type d'application : "Web application"
6. Ajoutez les URIs de redirection autorisées :
   - `https://my-backend-api-cng7.onrender.com/api/auth/google/callback`
   - `https://my-backend-api-cng7.onrender.com/api/auth/google`

### Facebook OAuth
1. Allez sur [Facebook Developers](https://developers.facebook.com/)
2. Créez une nouvelle app → Type: "Consumer"
3. Dans "App Settings" → "Basic", copiez App ID et App Secret
4. Dans "Facebook Login" → "Settings" :
   - Valid OAuth Redirect URIs : `https://my-backend-api-cng7.onrender.com/api/auth/facebook/callback`
   - Domaines autorisés : `my-backend-api-cng7.onrender.com`

### Apple OAuth
1. Allez sur [Apple Developer](https://developer.apple.com/)
2. Dans "Certificates, Identifiers & Profiles"
3. Créez un "App ID" avec "Sign in with Apple" activé
4. Créez un "Services ID" pour le web
5. Configurez les domaines et URLs de retour :
   - Domaine : `my-backend-api-cng7.onrender.com`
   - Return URL : `https://my-backend-api-cng7.onrender.com/api/auth/apple/callback`
6. Créez une "Key" pour Sign in with Apple
7. Téléchargez le fichier .p8 et encodez-le en base64 pour APPLE_PRIVATE_KEY

## 🔒 Modification du backend pour la sécurité CORS

Dans votre fichier `backend/src/app.js`, modifiez la configuration CORS :

```javascript
// Remplacez la configuration CORS actuelle par :
const corsOptions = {
  origin: function (origin, callback) {
    // Récupérer les origines autorisées depuis les variables d'environnement
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : ['chrome-extension://votre_id_extension'];
    
    // Permettre les requêtes sans origine (ex: Postman) en développement
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Vérifier si l'origine est autorisée
    if (allowedOrigins.some(allowed => origin && origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
```

## 🚀 Déploiement

1. Après avoir ajouté toutes les variables d'environnement, cliquez sur "Save Changes"
2. Render redémarrera automatiquement votre service
3. Vérifiez les logs pour vous assurer que tout fonctionne

## ✅ Test de la configuration

Pour tester que tout fonctionne :

1. Ouvrez votre extension Chrome
2. Cliquez sur "Se connecter"
3. Testez la connexion normale (email/mot de passe)
4. Testez les boutons OAuth (Google, Facebook, Apple)

## 🛠️ Dépannage

Si OAuth ne fonctionne pas :
- Vérifiez que l'ID de l'extension est correct dans les variables d'environnement
- Assurez-vous que les URLs de callback correspondent exactement
- Vérifiez les logs sur Render Dashboard
- Pour Apple Sign In, assurez-vous que la clé privée est correctement encodée en base64