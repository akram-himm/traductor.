# Test du serveur en local

## Pour tester en local :

1. **Démarrer le backend local :**
```bash
cd lexiflow/backend
npm run dev
```

2. **Dans l'extension, changer l'URL temporairement :**

Ouvrez `config.js` et changez :
```javascript
// Ligne 4 - Commentez Render et décommentez localhost
// BASE_URL: 'https://my-backend-api-cng7.onrender.com',
BASE_URL: 'http://localhost:3001',
```

3. **Recharger l'extension**

4. **Tester "Mot de passe oublié"**

## Vérifier que les routes existent :

```bash
# Test local
curl http://localhost:3001/api/auth/forgot-password -X POST -H "Content-Type: application/json" -d '{"email":"test@test.com"}'
```

## Si ça marche en local :

Alors il faut juste redéployer sur Render avec :
```bash
git add .
git commit -m "Fix password reset"
git push
```