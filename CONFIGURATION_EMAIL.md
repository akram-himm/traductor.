# 📧 Configuration du service email pour LexiFlow

## 🔧 Configuration Gmail pour l'envoi d'emails

### Étape 1 : Activer la vérification en 2 étapes
1. Allez sur [myaccount.google.com](https://myaccount.google.com)
2. Cliquez sur **Sécurité** dans le menu de gauche
3. Sous "Connexion à Google", cliquez sur **Validation en deux étapes**
4. Suivez les instructions pour l'activer

### Étape 2 : Créer un mot de passe d'application
1. Retournez dans **Sécurité**
2. Sous "Connexion à Google", cliquez sur **Mots de passe des applications**
3. Sélectionnez **Messagerie** et **Autre (nom personnalisé)**
4. Entrez "LexiFlow Backend"
5. Cliquez sur **Générer**
6. **COPIEZ LE MOT DE PASSE À 16 CARACTÈRES** (vous ne le reverrez plus)

### Étape 3 : Configurer votre fichier .env
```env
# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre.email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx  # Le mot de passe d'app à 16 caractères (sans espaces)
```

### Étape 4 : Tester l'envoi
```bash
# Dans le backend
cd lexiflow/backend
npm run test:email  # Si le script existe
```

## 🚀 Alternative : Utiliser un service professionnel

### SendGrid (recommandé pour production)
1. Créez un compte sur [sendgrid.com](https://sendgrid.com)
2. Plan gratuit : 100 emails/jour
3. Configuration :
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
```

### Mailgun
1. Créez un compte sur [mailgun.com](https://mailgun.com)
2. Plan gratuit : 5000 emails/mois pendant 3 mois
3. Configuration :
```env
EMAIL_SERVICE=mailgun
MAILGUN_API_KEY=key-xxxxxxxxxxxxx
MAILGUN_DOMAIN=mg.votredomaine.com
```

## ⚠️ Important pour la sécurité

1. **NE JAMAIS** commiter le fichier `.env` avec les vraies clés
2. Utilisez des variables d'environnement sur Render :
   - Dashboard Render → Service → Environment → Add Environment Variable
3. Testez d'abord en local avant de déployer

## 🔍 Vérification du service

Pour vérifier que les emails fonctionnent :

1. **Test de connexion** :
```javascript
// Créer un fichier test-email.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Erreur:', error);
  } else {
    console.log('✅ Serveur email prêt!');
  }
});
```

2. **Test d'envoi** :
```javascript
transporter.sendMail({
  from: '"LexiFlow" <noreply@lexiflow.com>',
  to: 'test@example.com',
  subject: 'Test Email',
  html: '<h1>Test réussi!</h1>'
}, (error, info) => {
  if (error) {
    console.log('❌ Erreur envoi:', error);
  } else {
    console.log('✅ Email envoyé:', info.messageId);
  }
});
```

## 📝 Checklist avant production

- [ ] Mot de passe d'application Gmail créé
- [ ] Variables dans `.env` configurées
- [ ] Test d'envoi réussi en local
- [ ] Variables ajoutées sur Render
- [ ] URL de récupération configurée (ligne 126 dans `email.js`)

## 🐛 Résolution des problèmes courants

### Erreur "Invalid login"
→ Vérifiez que vous utilisez le mot de passe d'application, pas votre mot de passe Gmail

### Erreur "self signed certificate"
→ Ajoutez `tls: { rejectUnauthorized: false }` dans la config (développement seulement)

### Emails n'arrivent pas
→ Vérifiez le dossier Spam
→ Utilisez une adresse "from" avec votre domaine

### Limite de taux dépassée
→ Gmail limite à 500 emails/jour
→ Passez à un service professionnel pour la production