# 🧪 Guide de Test - LexiFlow Authentication

## ✅ Tests API (Complétés)
- **Inscription** : ✓ Fonctionne
- **Connexion** : ✓ Retourne un token JWT valide
- **Vérification** : ✓ Le token est accepté

## 📱 Test depuis l'Extension Chrome

### 1. Charger l'extension en mode développeur
1. Ouvrez Chrome et allez sur `chrome://extensions/`
2. Activez le "Mode développeur" (en haut à droite)
3. Cliquez sur "Charger l'extension non empaquetée"
4. Sélectionnez le dossier `/home/akram/Bureau/traductor/lexiflow/extension`

### 2. Test de connexion Email/Password
1. Cliquez sur l'icône de l'extension
2. Cliquez sur "Sign in" (en haut à droite)
3. Utilisez ces identifiants de test :
   - Email : `test@lexiflow.com`
   - Password : `password123`
4. Cliquez sur "Se connecter"

### 3. Test de Google OAuth
1. Cliquez sur "Continuer avec Google"
2. Connectez-vous avec votre compte Google
3. Autorisez l'application

### 4. Vérifications après connexion
- Le bouton "Sign in" devient un bouton utilisateur
- Les flashcards se synchronisent
- Le quota s'affiche (0/50 ou 0/200 si premium)

## 🔧 Débuggage

### Console de développement de l'extension
1. Clic droit sur l'icône de l'extension
2. "Inspecter le popup"
3. Onglet "Console" pour voir les logs

### Erreurs communes
- **CORS Error** : Vérifiez que l'URL backend est correcte dans config.js
- **401 Unauthorized** : Le token a expiré, reconnectez-vous
- **Network Error** : Vérifiez que le backend est en ligne

## 📊 Endpoints de test

### Créer un nouveau compte
```bash
curl -X POST https://my-backend-api-cng7.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nouveau@test.com",
    "password": "motdepasse123",
    "username": "NouvelUtilisateur"
  }'
```

### Se connecter
```bash
curl -X POST https://my-backend-api-cng7.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lexiflow.com",
    "password": "password123"
  }'
```

### Obtenir le profil
```bash
curl -X GET https://my-backend-api-cng7.onrender.com/api/user/profile \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI"
```

### Créer une flashcard
```bash
curl -X POST https://my-backend-api-cng7.onrender.com/api/flashcards \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -H "Content-Type: application/json" \
  -d '{
    "originalText": "Hello",
    "translatedText": "Bonjour",
    "sourceLanguage": "en",
    "targetLanguage": "fr"
  }'
```

## 🚀 Prochaines étapes

1. **Configurer Google OAuth**
   - Créer un projet sur Google Cloud Console
   - Ajouter les variables sur Render

2. **Tester la synchronisation**
   - Créer des flashcards
   - Vérifier qu'elles se sauvent

3. **Tester les limites**
   - Utilisateur gratuit : max 50 flashcards
   - Utilisateur premium : max 200 flashcards