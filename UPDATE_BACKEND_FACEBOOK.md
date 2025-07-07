# 🚀 Mise à jour Backend pour Facebook OAuth

## Résumé des modifications

J'ai créé les endpoints requis par Facebook pour la suppression des données :

### 1. **POST /data-deletion**
- Accepte le `signed_request` de Facebook
- Décode et vérifie la signature
- Supprime les données utilisateur
- Retourne un JSON avec l'URL de statut

### 2. **GET /data-deletion-status**
- Affiche une page de confirmation
- Montre le statut de suppression
- Interface claire et professionnelle

### 3. **GET /data-deletion**
- Page d'information pour les utilisateurs
- Instructions de suppression manuelle

## 📝 Variables d'environnement requises

Assurez-vous d'avoir ces variables sur Render :

```bash
FACEBOOK_APP_SECRET=votre_app_secret_facebook
SOFT_DELETE=false  # ou true si vous voulez garder les données 30 jours
```

## 🔧 Déploiement sur Render

### Option 1 : Commit et push automatique

```bash
cd /home/akram/Bureau/traductor
git add lexiflow/backend/src/routes/dataDeletion.js
git add lexiflow/backend/src/routes/legal.js
git add lexiflow/backend/src/app.js
git commit -m "Add Facebook data deletion endpoints"
git push origin main
```

### Option 2 : Push manuel du dossier backend

```bash
cd /home/akram/Bureau/traductor/lexiflow/backend
git init
git add .
git commit -m "Add Facebook data deletion endpoints"
git remote add origin votre_url_github_backend
git push -f origin main
```

## ✅ Vérification après déploiement

1. **Testez GET** : https://my-backend-api-cng7.onrender.com/data-deletion
   - Doit afficher la page d'information

2. **Testez GET** : https://my-backend-api-cng7.onrender.com/data-deletion-status?id=test
   - Doit afficher la page de confirmation

3. **Testez POST** avec curl :
```bash
curl -X POST https://my-backend-api-cng7.onrender.com/data-deletion \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "signed_request=test"
```
   - Doit retourner une erreur JSON (normal sans vrai signed_request)

## 🎯 Configuration Facebook

Une fois déployé et testé, retournez dans Facebook Developer Console :

1. Dans "Suppression des données utilisateur"
2. Entrez : `https://my-backend-api-cng7.onrender.com/data-deletion`
3. Sauvegardez
4. Facebook devrait maintenant accepter l'URL

## 📋 Checklist finale

- [ ] Variables d'environnement ajoutées sur Render
- [ ] Code déployé sur Render
- [ ] URLs testées et fonctionnelles
- [ ] URL ajoutée dans Facebook Developer Console
- [ ] App Facebook soumise pour révision

## 🔍 Débuggage

Si Facebook refuse toujours l'URL :

1. Vérifiez les logs Render : Dashboard → Logs
2. Testez avec Facebook URL Debugger
3. Assurez-vous que FACEBOOK_APP_SECRET est bien configuré
4. Vérifiez que le serveur répond en moins de 5 secondes