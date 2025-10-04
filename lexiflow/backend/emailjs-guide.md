# EmailJS - Envoyer des emails SANS BACKEND!

## Parfait pour éviter tous les problèmes de serveur

### Comment ça marche?
EmailJS envoie les emails **directement depuis le navigateur** (extension Chrome).
Pas besoin de configurer le serveur Render!

### Configuration (5 minutes)

1. **Créer un compte**
   - Va sur [emailjs.com](https://www.emailjs.com/docs/get-started/sign-up/)
   - Inscris-toi (pas de téléphone)

2. **Connecter ton Gmail**
   - Dashboard → Email Services → Add New Service
   - Choisis "Gmail"
   - Connecte ton compte Gmail personnel
   - EmailJS utilisera TON Gmail pour envoyer

3. **Créer un template**
   - Dashboard → Email Templates → Create New
   - Nom: "password_reset"
   - Subject: "Réinitialisation mot de passe"
   - Content:
   ```
   Bonjour {{user_name}},

   Cliquez ici pour réinitialiser votre mot de passe:
   {{reset_link}}

   LexiFlow
   ```

4. **Obtenir tes clés**
   - Public Key: Dans Account → API Keys
   - Service ID: Dans Email Services
   - Template ID: Dans Email Templates

### Code pour l'extension (popup.js)

```javascript
// Ajouter EmailJS (dans popup.html)
// <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>

// Initialiser EmailJS
emailjs.init("VOTRE_PUBLIC_KEY");

// Envoyer l'email de récupération
async function sendPasswordReset(email) {
  try {
    const response = await emailjs.send(
      'VOTRE_SERVICE_ID',
      'VOTRE_TEMPLATE_ID',
      {
        user_email: email,
        user_name: email.split('@')[0],
        reset_link: `https://lexiflow.com/reset?token=${generateToken()}`
      }
    );

    console.log('Email envoyé!', response);
    return true;
  } catch (error) {
    console.error('Erreur:', error);
    return false;
  }
}
```

### Avantages
- ✅ **200 emails/mois GRATUIT**
- ✅ **Pas de serveur à configurer**
- ✅ **Fonctionne depuis l'extension directement**
- ✅ **Utilise ton propre Gmail**
- ✅ **Pas de problème avec Render**