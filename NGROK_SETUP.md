# 🚀 Guide Ngrok - Configuration Correcte

## Étape 1: Vérifier que le backend fonctionne

```bash
# Terminal 1
cd /home/akram/Bureau/my-backend-api
npm start
```

Vous devriez voir :
```
Server is running on port 5000
Database connected successfully
```

## Étape 2: Lancer Ngrok

```bash
# Terminal 2
ngrok http 5000
```

## Étape 3: Copier la VRAIE URL

Ngrok affichera quelque chose comme :
```
Forwarding  https://1234-5678-abcd.ngrok-free.app -> http://localhost:5000
            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
            COPIEZ CETTE URL !
```

⚠️ **ATTENTION**: L'URL change à chaque fois que vous relancez ngrok !

## Étape 4: Mettre à jour config.js

Dans `/home/akram/Bureau/traductor/lexiflow/extension/config.js`, remplacez :
```javascript
BASE_URL: 'https://1234-5678-abcd.ngrok-free.app',  // Votre vraie URL ngrok
```

## Étape 5: Google Cloud Console

1. Aller sur [console.cloud.google.com](https://console.cloud.google.com)
2. APIs & Services → Credentials → OAuth 2.0 Client IDs
3. Cliquer sur votre client
4. Dans "Authorized redirect URIs", ajouter :
   ```
   https://1234-5678-abcd.ngrok-free.app/api/auth/google/callback
   ```
5. Sauvegarder

## Étape 6: Variables d'environnement du backend

Dans `/home/akram/Bureau/my-backend-api/.env`, assurez-vous d'avoir :
```
CLIENT_URL=chrome-extension://fimeadbjjjocfknijlhgemdjdkmipiil
API_URL=https://1234-5678-abcd.ngrok-free.app
```

## Étape 7: Recharger l'extension

1. Chrome → Extensions → Recharger LexiFlow
2. Tester la connexion Google

## Problèmes Fréquents

### "Tunnel not found"
→ Ngrok n'est pas lancé ou l'URL est incorrecte

### "Invalid redirect URI"
→ L'URL dans Google Cloud Console ne correspond pas

### "CORS error"
→ Vérifier CLIENT_URL dans le backend

## Alternative si Ngrok ne marche pas

Utilisez **localtunnel** :
```bash
npm install -g localtunnel
lt --port 5000
```

Ou **Railway** pour un déploiement permanent :
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

## Commande Rapide

Pour copier/coller :
```bash
# Terminal 1
cd /home/akram/Bureau/my-backend-api && npm start

# Terminal 2
ngrok http 5000

# Puis mettre à jour config.js avec l'URL affichée
```