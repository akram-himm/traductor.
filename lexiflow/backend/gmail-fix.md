# Solution pour Gmail qui bloque depuis Render

## Option 1: Autoriser Render dans Gmail

1. **Connecte-toi à Gmail** avec `lexiflow.contact@gmail.com`
2. **Va sur:** https://myaccount.google.com/lesssecureapps
3. **Active:** "Autoriser les applications moins sécurisées"
4. **OU va sur:** https://myaccount.google.com/security
5. **Cherche:** "Activité récente" ou "Appareils récents"
6. **Autorise** les connexions depuis Render

## Option 2: Utiliser le port 465 (SSL)

Sur Render.com, change les variables:
```
EMAIL_PORT = 465
EMAIL_SECURE = true
```

## Option 3: Utiliser SendGrid (GRATUIT)

1. **Créer un compte sur:** https://sendgrid.com
2. **Obtenir une API Key** (gratuit jusqu'à 100 emails/jour)
3. **Sur Render, changer les variables:**
```
EMAIL_SERVICE = sendgrid
SENDGRID_API_KEY = [ta clé API]
```

## Option 4: Vérifier les logs

Après redéploiement, dans les logs Render, cherche:
- `📧 Configuration email:` → Vérifie que les variables sont bonnes
- `✅ Connexion SMTP` → Si tu vois ça, tout fonctionne
- `❌ Erreur de connexion SMTP` → Gmail bloque

## Debug rapide

Teste depuis ton terminal:
```bash
curl -X POST https://my-backend-api-cng7.onrender.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"akramhimmich21@gmail.com"}'
```

Puis regarde les logs Render pour voir l'erreur exacte.