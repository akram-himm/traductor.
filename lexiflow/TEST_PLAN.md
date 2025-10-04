# Plan de test LexiFlow - Nouveau compte

## 🧪 Test 1 : Création de compte

1. **Obtenir un email de test**
   - Option 1 : Utiliser `votre-email+test1@gmail.com`
   - Option 2 : Utiliser temp-mail.org

2. **Créer le compte**
   - Ouvrir l'extension
   - Cliquer sur "Sign in"
   - Choisir "Create account"
   - Entrer l'email et mot de passe
   - Vérifier l'email de confirmation

3. **Vérifier dans la DB**
   ```bash
   cd /home/akram/traductor/lexiflow/backend
   node src/scripts/check-new-user.js votre-email+test1@gmail.com
   ```

## 🎴 Test 2 : Flashcards

1. **Traduire un mot**
   - Aller sur une page web
   - Sélectionner un mot (ex: "hello")
   - Cliquer sur le bouton de traduction

2. **Sauvegarder la flashcard**
   - Cliquer sur "Save" dans la popup
   - Vérifier le message "Added!"

3. **Vérifier la synchronisation**
   - Aller dans l'onglet Dashboard
   - La flashcard doit apparaître
   - Fermer et rouvrir l'extension
   - La flashcard doit toujours être là

4. **Vérifier dans la DB**
   ```bash
   node src/scripts/check-new-user.js votre-email+test1@gmail.com
   ```

## 📚 Test 3 : Historique

1. **Faire plusieurs traductions**
   - Traduire 3-4 mots différents
   - NE PAS les sauvegarder

2. **Vérifier l'historique**
   - Aller dans l'onglet History
   - Les traductions doivent apparaître
   - Elles sont stockées localement (pas dans la DB)

## 💎 Test 4 : Premium (optionnel)

1. **Upgrader vers Premium**
   - Cliquer sur "Upgrade"
   - Utiliser la carte de test : `4242 4242 4242 4242`
   - Date : n'importe quelle date future
   - CVC : 123

2. **Vérifier les changements**
   - Le bouton Upgrade disparaît
   - Badge PREMIUM visible
   - Section dans Settings apparaît

## 🔄 Test 5 : Synchronisation multi-appareil

1. **Se connecter sur un autre navigateur**
   - Même compte
   - Les flashcards doivent apparaître
   - L'historique est local (pas synchronisé)

## ✅ Checklist de vérification

- [ ] Compte créé avec succès
- [ ] Email de vérification reçu
- [ ] Connexion fonctionne
- [ ] Flashcards sauvegardées dans la DB
- [ ] Flashcards synchronisées entre sessions
- [ ] Historique local fonctionne
- [ ] Premium fonctionne (si testé)
- [ ] Déconnexion/reconnexion OK

## 🐛 Problèmes courants

1. **"Failed to save flashcard"**
   - Vérifier la connexion internet
   - Vérifier que le serveur est actif

2. **Flashcards disparaissent**
   - Normal si non connecté (stockage serveur uniquement)
   - Se reconnecter pour les récupérer

3. **Email non reçu**
   - Vérifier les spams
   - Attendre 1-2 minutes