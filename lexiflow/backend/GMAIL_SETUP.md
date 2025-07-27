# Configuration Gmail pour LexiFlow

## 🚀 Guide rapide pour configurer les emails

### Option 1 : Gmail GRATUIT (Recommandé pour commencer)

1. **Créer un compte Gmail professionnel**
   - Allez sur [Gmail](https://gmail.com)
   - Créez : `lexiflow.contact@gmail.com` ou `lexiflow.app@gmail.com`
   - Utilisez un mot de passe fort

2. **Activer l'authentification 2 facteurs (obligatoire)**
   - Paramètres → Sécurité → Validation en 2 étapes
   - Activez avec votre téléphone

3. **Créer un mot de passe d'application**
   - Paramètres → Sécurité → Mots de passe des applications
   - Sélectionnez "Autre" et nommez-le "LexiFlow Backend"
   - Copiez le mot de passe généré (16 caractères)

4. **Configurer dans le backend**
   ```env
   # Dans le fichier .env
   EMAIL_USER=lexiflow.contact@gmail.com
   EMAIL_PASS=abcd efgh ijkl mnop  # Le mot de passe d'app (sans espaces)
   ```

### Option 2 : Email temporaire pour tests

Pour tester sans Gmail :
- Le code utilise automatiquement Ethereal Email en développement
- Les emails sont visibles sur : https://ethereal.email

### Option 3 : Domaine professionnel (Plus tard)

Quand vous aurez acheté lexiflow.com :
1. **Zoho Mail** (Gratuit jusqu'à 5 emails)
   - support@lexiflow.com
   - noreply@lexiflow.com
   
2. **Google Workspace** ($6/mois)
   - Plus professionnel
   - Meilleure délivrabilité

## 📧 Templates d'emails envoyés

### 1. Email de vérification
- **Objet** : "Verify your LexiFlow account"
- **Contenu** : Lien de vérification + présentation du trial

### 2. Email de bienvenue
- **Objet** : "Welcome to LexiFlow - Your 7-day trial has started! 🎉"
- **Contenu** : Confirmation du trial + guide de démarrage

### 3. Rappel fin de trial
- **Objet** : "Your LexiFlow trial ends in X days ⏰"
- **Contenu** : Rappel + offre Early Bird

## 🔒 Sécurité

- Ne jamais commiter le mot de passe dans Git
- Utiliser les variables d'environnement
- Le mot de passe d'application ≠ mot de passe Gmail

## 🚨 Limites Gmail

- **Envoi max** : 500 emails/jour
- **Destinataires max** : 500/jour
- Suffisant pour < 100 utilisateurs/jour

## 💡 Tips

1. **Signature professionnelle**
   ```
   Best regards,
   The LexiFlow Team
   
   Break Language Barriers
   https://lexiflow.com (coming soon)
   ```

2. **Éviter le spam**
   - Toujours inclure un lien de désabonnement
   - Éviter les mots "FREE", "CLICK HERE"
   - Personnaliser avec le nom de l'utilisateur

3. **Monitoring**
   - Vérifier régulièrement la boîte Gmail
   - Répondre aux questions des utilisateurs
   - Gmail → Paramètres → Filtres pour organiser