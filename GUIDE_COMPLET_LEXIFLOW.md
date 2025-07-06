# 🚀 Guide Complet LexiFlow - Extension & Backend

## 📋 Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Installation de l'extension](#installation-de-lextension)
3. [Configuration du backend](#configuration-du-backend)
4. [Connexion Extension ↔ Backend](#connexion-extension--backend)
5. [Tests et validation](#tests-et-validation)
6. [Dépannage](#dépannage)

---

## 🎯 Vue d'ensemble

LexiFlow est composé de :
- **Extension Chrome** : Interface utilisateur pour traduire et gérer les flashcards
- **Backend API** : Serveur Node.js hébergé sur Render pour la persistance des données
- **Base de données** : PostgreSQL pour stocker utilisateurs et flashcards

### URLs importantes :
- Backend API : `https://my-backend-api-cng7.onrender.com`
- Health Check : `https://my-backend-api-cng7.onrender.com/health`

---

## 🔧 Installation de l'extension

### 1. Charger l'extension dans Chrome

1. Ouvrez Chrome et allez sur `chrome://extensions/`
2. Activez **"Developer mode"** (en haut à droite)
3. Cliquez **"Load unpacked"**
4. Sélectionnez le dossier : `/home/akram/Bureau/traductor/lexiflow/extension`
5. **IMPORTANT** : Notez l'ID de l'extension (32 caractères)

### 2. Configurer l'ID dans Render

1. Allez sur [Render Dashboard](https://dashboard.render.com)
2. Sélectionnez votre service `my-backend-api-cng7`
3. Onglet **Environment**
4. Mettez à jour :
   - `CLIENT_URL` = `chrome-extension://VOTRE_ID_ICI`
   - `CHROME_EXTENSION_ID` = `VOTRE_ID_ICI`

---

## 🗄️ Configuration du backend

### Variables d'environnement sur Render

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | Auto-généré par Render | postgres://... |
| `JWT_SECRET` | Auto-généré par Render | (cliquez Generate) |
| `SESSION_SECRET` | Auto-généré par Render | (cliquez Generate) |
| `NODE_ENV` | Environnement | production |
| `PORT` | Port du serveur | 10000 |
| `CLIENT_URL` | URL de l'extension | chrome-extension://abc123... |
| `API_URL` | URL du backend | https://my-backend-api-cng7.onrender.com |

### Variables optionnelles (OAuth)

Laissez vides pour l'instant :
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`

---

## 🔌 Connexion Extension ↔ Backend

### 1. Tester la connexion

1. Ouvrez le fichier : `lexiflow/extension/test-backend.html` dans Chrome
2. Testez dans l'ordre :
   - **Test /health** → Doit afficher "Server is running"
   - **Register** → Créer un compte test
   - **Login** → Se connecter
   - **Get Flashcards** → Voir les flashcards

### 2. Intégrer dans l'extension

L'extension utilise maintenant `config.js` qui contient :
- Configuration API
- Fonctions d'authentification
- Gestion des flashcards

---

## 🧪 Tests et validation

### Test rapide via terminal :

```bash
# Test de santé
curl https://my-backend-api-cng7.onrender.com/health

# Test ping
curl https://my-backend-api-cng7.onrender.com/ping
```

### Test complet via l'extension :

1. Rechargez l'extension (`chrome://extensions/` → Refresh)
2. Ouvrez la popup de l'extension
3. Ouvrez la console (clic droit → Inspect popup)
4. Testez :

```javascript
// Test connexion
fetch('https://my-backend-api-cng7.onrender.com/health')
  .then(r => r.json())
  .then(console.log)

// Test inscription
authAPI.register('Test', 'test@test.com', 'password123')
  .then(console.log)
```

---

## 🔧 Dépannage

### Erreur CORS

**Symptôme** : "Access blocked by CORS policy"

**Solution** :
1. Vérifiez que l'ID de l'extension est correct dans Render
2. Redéployez après avoir mis à jour les variables

### Backend ne répond pas

**Symptôme** : Timeout ou erreur de connexion

**Solution** :
1. Vérifiez sur Render Dashboard que le service est "Live"
2. Le plan gratuit s'endort après 15 min d'inactivité (normal)

### Erreur d'authentification

**Symptôme** : "Unauthorized" ou "Invalid token"

**Solution** :
1. Effacez le localStorage : `localStorage.clear()`
2. Reconnectez-vous

---

## 🚀 Déploiement des mises à jour

### Pour le backend :

```bash
cd /home/akram/Bureau/my-backend-api
git add .
git commit -m "Description du changement"
git push origin main
```

Render redéploiera automatiquement.

### Pour l'extension :

1. Modifiez les fichiers
2. Rechargez l'extension dans Chrome
3. Pas besoin de redéployer le backend

---

## 📝 Commandes utiles

### Script de déploiement automatique :

```bash
# Exécuter depuis n'importe où
/home/akram/Bureau/traductor/deploy-backend.sh
```

### Voir les logs Render :

1. Dashboard → Logs
2. Ou via CLI : `render logs my-backend-api-cng7`

---

## 🎉 Félicitations !

Votre extension LexiFlow est maintenant connectée à un backend persistant !

**Prochaines étapes suggérées :**
1. Implémenter la synchronisation automatique des flashcards
2. Ajouter la connexion Google/Facebook
3. Créer une interface de révision des flashcards
4. Ajouter des statistiques d'apprentissage

---

## 💡 Support

- Logs Render : Dashboard → Logs
- Console Chrome : F12 dans la popup
- Test page : `extension/test-backend.html`