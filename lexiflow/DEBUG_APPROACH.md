# Guide d'approche pour le débogage - LexiFlow

## 🎯 Approche systématique pour résoudre les problèmes

### 1. Vue d'ensemble (TOUJOURS commencer par là)
Avant de toucher au code, vérifier dans cet ordre :

#### a) Infrastructure
- [ ] Le serveur est-il accessible ? (ping, health check)
- [ ] La base de données répond-elle ?
- [ ] Les colonnes nécessaires existent-elles dans la DB ?
- [ ] Les variables d'environnement sont-elles configurées ?

#### b) Données
- [ ] Que retourne exactement l'API ? (vérifier la réponse brute)
- [ ] Les données sont-elles complètes ?
- [ ] Y a-t-il des champs manquants ?

#### c) Logs
- [ ] Vérifier les logs serveur (Render, console)
- [ ] Chercher les erreurs spécifiques (surtout les erreurs DB)
- [ ] Noter les timestamps pour corréler les événements

### 2. Analyse des symptômes

#### Exemple : "Je ne peux pas me connecter"
```
1. Tester l'endpoint → 500 Internal Server Error
2. Vérifier les logs → "column subscriptionPlan does not exist"
3. Conclusion → Problème de base de données
4. Solution → Synchroniser/migrer la DB
```

#### Exemple : "Le plan n'est pas détecté"
```
1. Console utilisateur → "Plan détecté: AUCUN"
2. Réponse API → {"isPremium": true} (pas de subscriptionPlan)
3. Conclusion → Données manquantes côté serveur
4. Solution → Vérifier/ajouter les colonnes DB
```

### 3. Erreurs courantes à éviter

❌ **NE PAS** :
- Supposer que le problème est dans le code frontend
- Ajouter des logs partout sans comprendre
- Faire des modifications complexes avant de vérifier les bases
- Ignorer les messages d'erreur évidents

✅ **FAIRE** :
- Lire attentivement TOUS les messages d'erreur
- Vérifier la chaîne complète : DB → Backend → API → Frontend
- Tester avec des outils simples (curl, Postman) avant de modifier le code
- Documenter chaque hypothèse et son résultat

### 4. Checklist de débogage rapide

Pour tout problème :
1. **Reproduire** : Peut-on reproduire le problème ?
2. **Isoler** : À quel niveau se situe le problème ?
   - Base de données ?
   - Backend/API ?
   - Frontend ?
   - Communication entre les deux ?
3. **Vérifier les bases** :
   - Structure DB correcte ?
   - Endpoints accessibles ?
   - Authentification valide ?
   - Données complètes ?
4. **Solution minimale** : Quelle est la solution la plus simple ?

### 5. Cas spécifiques LexiFlow

#### Problèmes d'authentification
- Vérifier le token JWT
- Vérifier les colonnes User dans la DB
- Vérifier les routes auth

#### Problèmes de subscription
- Vérifier les colonnes subscriptionPlan/subscriptionStatus
- Vérifier la table Subscriptions
- Vérifier les webhooks Stripe

#### Problèmes de synchronisation
- Vérifier chrome.storage
- Vérifier les endpoints API
- Vérifier les permissions

### 6. Leçons apprises

1. **Problème de connexion (30/07/2025)** :
   - Symptôme : Error 500 au login
   - Cause : Colonnes subscriptionPlan/subscriptionStatus manquantes
   - Leçon : Toujours vérifier la structure DB en premier

2. **Problème de détection de plan** :
   - Symptôme : "Plan détecté: AUCUN" malgré isPremium=true
   - Cause : L'API ne retournait pas subscriptionPlan
   - Leçon : Vérifier les données retournées, pas juste le code

### 7. Outils de diagnostic

```bash
# Vérifier l'API
curl https://my-backend-api-cng7.onrender.com/api/health

# Vérifier la réponse d'un endpoint
curl -X POST https://my-backend-api-cng7.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

# Logs Render
# Dashboard → Service → Logs

# Console navigateur
# F12 → Console → Filtrer par erreurs
```

### 8. Communication avec l'équipe/utilisateur

Quand un utilisateur signale un problème :
1. Demander les détails exacts (messages d'erreur, screenshots)
2. Demander les étapes pour reproduire
3. Vérifier les logs au moment du problème
4. Communiquer les hypothèses avant de coder

---

💡 **Rappel** : 90% des problèmes viennent de l'infrastructure (DB, serveur, config) plutôt que du code lui-même. Toujours vérifier les fondations avant de reconstruire la maison !