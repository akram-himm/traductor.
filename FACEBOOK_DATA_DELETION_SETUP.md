# Configuration de la suppression de données Facebook pour LexiFlow

## Problèmes identifiés et solutions

### 1. Problème : Endpoint non accessible
- **Cause** : Les nouvelles routes n'étaient pas déployées sur Render
- **Solution** : Code poussé sur GitHub, redéploiement automatique en cours

### 2. Configuration CORS
Le code actuel permet déjà les requêtes sans origine (ce qui inclut Facebook) :
```javascript
// Allow requests with no origin (like mobile apps or Postman)
if (!origin) return callback(null, true);
```

### 3. Variables d'environnement requises
Assurez-vous que ces variables sont configurées sur Render :
- `FACEBOOK_APP_SECRET` : Le secret de votre app Facebook
- `SOFT_DELETE` : (optionnel) "true" pour soft delete, sinon hard delete

## Configuration Facebook

### 1. Dans les paramètres de votre app Facebook :
1. Allez dans **Paramètres de base**
2. Notez votre **App Secret**
3. Ajoutez l'URL de callback : `https://my-backend-api-cng7.onrender.com/data-deletion`

### 2. Dans **Paramètres avancés** :
1. Activez **Rappel de suppression de données**
2. URL de rappel : `https://my-backend-api-cng7.onrender.com/data-deletion`
3. Type : **Rappel de suppression de données**

### 3. Dans Render :
1. Allez dans votre dashboard Render
2. Sélectionnez votre service backend
3. Dans **Environment**, ajoutez :
   - `FACEBOOK_APP_SECRET` = [votre app secret]
   - `SOFT_DELETE` = true (recommandé)

## Test de l'endpoint

Une fois le redéploiement terminé (généralement 2-5 minutes), testez :

```bash
# Test simple pour vérifier que l'endpoint existe
curl -X POST https://my-backend-api-cng7.onrender.com/data-deletion \
  -H "Content-Type: application/json" \
  -d '{"signed_request": "test"}'
```

Réponse attendue :
- Si FACEBOOK_APP_SECRET n'est pas configuré : `{"error": "Server configuration error"}`
- Si signed_request est invalide : `{"error": "Missing signed_request parameter"}`

## Flux de suppression de données

1. **Facebook envoie une requête POST** avec un `signed_request`
2. **Notre serveur** :
   - Valide la signature avec `FACEBOOK_APP_SECRET`
   - Extrait l'ID utilisateur Facebook
   - Supprime les données de l'utilisateur
   - Retourne une URL de confirmation
3. **L'utilisateur peut vérifier** le statut à l'URL retournée

## URLs disponibles

- **POST** `/data-deletion` : Endpoint pour Facebook
- **GET** `/data-deletion` : Page d'information pour les utilisateurs
- **GET** `/data-deletion-status?id=XXX` : Page de confirmation de suppression
- **GET** `/privacy` : Politique de confidentialité
- **GET** `/terms` : Conditions d'utilisation

## Vérification du déploiement

Après le push Git, vérifiez :
1. Le statut du build sur Render Dashboard
2. Les logs du service pour voir si les routes sont chargées
3. Testez les endpoints avec curl

## Debugging

Si l'endpoint ne fonctionne toujours pas après redéploiement :
1. Vérifiez les logs Render pour des erreurs
2. Assurez-vous que `src/routes/dataDeletion.js` est bien inclus dans le déploiement
3. Vérifiez que toutes les dépendances sont installées
4. Testez localement avec `npm start` pour valider le code