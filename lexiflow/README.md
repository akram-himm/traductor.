# LexiFlow - Extension Chrome de Traduction Instantanée

<div align="center">
  <img src="assets/logo.png" alt="LexiFlow Logo" width="120" height="120" />
  <h3>Traduisez, Apprenez, Maîtrisez. Votre Monde en Toutes Langues.</h3>
  
  [![Version](https://img.shields.io/badge/version-0.8.5-blue.svg)](https://github.com/yourusername/lexiflow)
  [![Status](https://img.shields.io/badge/status-en%20développement-orange.svg)](https://github.com/yourusername/lexiflow)
  [![License](https://img.shields.io/badge/license-propriétaire-red.svg)](LICENSE)
</div>

## 📋 Vue d'ensemble

**LexiFlow** est une extension Chrome révolutionnaire qui combine traduction instantanée et apprentissage des langues. Notre mission est de briser les barrières linguistiques en offrant une expérience de traduction fluide et un système de flashcards intelligent.

### 🎯 Points clés
- **11 langues supportées** (FR, EN, AR, ES, DE, IT, PT, RU, JA, KO, ZH)
- **Traduction instantanée** d'un simple clic
- **Flashcards intelligentes** pour mémoriser le vocabulaire
- **Modèle Freemium** avec IA avancée en Premium

## 🚀 État du projet (Mise à jour : 18 juin 2025)

### Version actuelle : 0.8.5
| Phase | Statut | Progression |
|-------|---------|-------------|
| Phase 1 - Extension Base | ✅ Complété | 100% |
| Phase 2 - Backend & Auth | ✅ Complété | **100%** |
| Phase 3 - Site Web | 🚧 En cours | **15%** |
| Phase 4 - Extension Premium | 📅 Planifié | 0% |
| Phase 5 - Lancement | 📅 Août 2025 | 0% |

### 🏆 Ce qui est fait (18 juin 2025)
- ✅ Extension Chrome 100% fonctionnelle (version gratuite)
- ✅ Système de traduction instantanée (11 langues)
- ✅ Flashcards avec limites (50/200)
- ✅ Limites de caractères (100/350)
- ✅ Architecture backend complète
- ✅ Authentification JWT sécurisée
- ✅ Intégration Stripe complète avec webhooks
- ✅ **Tous les tests passent au vert** 🎉
- ✅ Serveur de développement opérationnel
- ✅ **Mode développement sans base de données**
- ✅ **Page Coming Soon fonctionnelle** 🆕
- ✅ **Système de liste d'attente opérationnel** 🆕
- ✅ **API waitlist avec stockage JSON** 🆕

### 🎯 Prochaines priorités
1. **🌐 Terminer le site web** (85% restant)
   - ✅ Page Coming Soon LIVE
   - ⏳ Landing page attractive
   - ⏳ Pages Features, Pricing, FAQ
   - ⏳ Dashboard utilisateur
2. **🚀 Déployer en production**
   - Backend sur Railway/Render
   - Site sur Vercel/Netlify
3. **💰 Lancer la campagne Early Bird** (2.99€/mois)
4. **✨ Connecter l'extension au backend**

## 💰 Modèle économique

| Fonctionnalité | Gratuit | Premium (4.99€/mois) |
|----------------|---------|----------------------|
| Traductions instantanées | ✅ Illimitées | ✅ Illimitées |
| Limite de caractères | 100 caractères | 350 caractères |
| Services de traduction | Google, MyMemory | DeepSeek AI + tous |
| Flashcards | 50 cartes | 200 cartes |
| Mode Pratique | ❌ | ✅ |
| Traduction longue | ❌ | ✅ |
| Prononciation audio | ❌ | ✅ |
| Synchronisation cloud | ❌ | ✅ |
| Support | Communautaire | Prioritaire |

### 🐦 Offre Early Bird
**2.99€/mois** à vie pour les 1000 premiers utilisateurs (au lieu de 4.99€)

## 🛠️ Installation pour développeurs

### Extension Chrome
```bash
# 1. Cloner le repository
git clone https://github.com/yourusername/lexiflow.git

# 2. Installer l'extension
- Ouvrir Chrome → Extensions → Mode développeur
- Charger l'extension non empaquetée → Dossier 'extension'
```

### Backend (100% complet) 🆕
```bash
# 1. Aller dans le dossier backend
cd lexiflow/backend

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env

# 4. Démarrer le serveur
npm start
# ou avec un port spécifique
PORT=3001 npm start

# Le serveur fonctionne sans PostgreSQL en mode dev !
```

### Site Web (15% complet) 🆕
```bash
# 1. Aller dans le dossier website
cd lexiflow/website

# 2. Lancer le serveur local
python -m http.server 8000

# 3. Ouvrir dans le navigateur
http://localhost:8000/coming-soon.html
```

### Tests Backend
```bash
# Lancer tous les tests (100% passent !)
npm test

# Test API uniquement
npm run test:api

# Test Stripe webhooks
npm run test:stripe
```

## 📂 Structure du projet

```
lexiflow/
├── README.md           # Ce fichier
├── extension/          # Extension Chrome (100% fonctionnelle)
│   └── EXTENSION_GUIDE.md
├── backend/            # API Node.js (100% complété) 🆕
│   ├── src/
│   │   ├── routes/
│   │   │   └── waitlist.js  # Route liste d'attente 🆕
│   │   └── app.js           # CORS configuré pour ports 5000 & 8000 🆕
│   └── backend-instructions.md
├── website/            # Site web (15% complété) 🆕
│   ├── coming-soon.html     # Page fonctionnelle 🆕
│   └── WEBSITE-DESC.md
└── data/               # Données locales 🆕
    └── waitlist.json   # Liste d'attente (créé automatiquement) 🆕
```

## 🏗️ Architecture technique

### Extension (Complète)
- Manifest V3
- Content script avec injection
- 11 langues supportées
- Système de flashcards local

### Backend (100% complet) 🆕
- Node.js + Express
- PostgreSQL + Sequelize (optionnel en dev)
- JWT Authentication
- Stripe Payments
- Mode mock pour développement
- **API Waitlist fonctionnelle** 🆕

### Site Web (15% complet) 🆕
- **Coming Soon page** ✅
- Landing page (À faire)
- Dashboard utilisateur (À faire)
- Système de paiement (À faire)

## 🤝 Contribution

Ce projet est actuellement privé. Pour contribuer :
1. Contactez l'équipe principale
2. Suivez les conventions de code établies
3. Testez minutieusement avant chaque PR
4. Documentez vos modifications

## 🎉 Accomplissements récents (18 juin 2025)

- ✅ Backend 100% fonctionnel
- ✅ Tous les tests passent avec succès
- ✅ Mode développement sans base de données
- ✅ **Page Coming Soon déployée localement** 🆕
- ✅ **Système de liste d'attente opérationnel** 🆕
- ✅ **2 premiers inscrits Early Bird !** 🆕
- ✅ Documentation complète mise à jour

## 📊 Métriques actuelles (18 juin 2025) 🆕

- **Inscrits liste d'attente :** 2
- **Early Birds réservés :** 2/1000
- **Backend :** 100% complet
- **Site web :** 15% complet
- **Extension :** 100% (version gratuite)

## 📊 Métriques de succès visées

- **1000 utilisateurs actifs** (3 premiers mois)
- **10% de taux de conversion** Free → Premium
- **4.5+ étoiles** sur Chrome Web Store
- **Churn rate < 5%** par mois
- **1000 Early Birds** à 2.99€/mois

## 🚀 Prochaines étapes immédiates 🆕

1. **Compléter le site web** (1-2 semaines)
   - Landing page
   - Pages Features, Pricing, FAQ
   - Intégration Stripe

2. **Déployer en production** (3-4 jours)
   - Backend sur Railway/Render
   - Site sur Vercel
   - Domaine personnalisé

3. **Connecter extension ↔ backend** (1 semaine)
   - Authentification dans l'extension
   - Synchronisation des flashcards
   - Activation features Premium

## 📝 TODO List - Tâches restantes

### 🔥 Priorité HAUTE (Cette semaine)
- [ ] **Landing page** - Page d'accueil attractive
- [ ] **Page Pricing** - Avec intégration Stripe
- [ ] **Pages légales** - Privacy Policy & Terms (obligatoire)
- [ ] **Déploiement Coming Soon** - Mettre en ligne pour vrais inscrits

### 📅 Priorité MOYENNE (2 semaines)
- [ ] **Page Features** - Détailler les fonctionnalités
- [ ] **Page FAQ** - Questions fréquentes
- [ ] **Page About** - Histoire de LexiFlow
- [ ] **Page Contact** - Formulaire de support
- [ ] **Emails automatiques** - Confirmation d'inscription
- [ ] **Export CSV** - Liste des inscrits waitlist

### 🔄 Priorité BASSE (1 mois)
- [ ] **Dashboard utilisateur** - Espace membre
- [ ] **Connexion Extension ↔ Backend** - Synchronisation
- [ ] **Mode Premium** dans l'extension
- [ ] **Tests unitaires** backend
- [ ] **Documentation API** (Swagger)
- [ ] **Monitoring** (Sentry, analytics)

### ✅ FAIT Récemment
- [x] Page Coming Soon (100%)
- [x] Système liste d'attente
- [x] API Waitlist fonctionnelle
- [x] Script démarrage (start-lexiflow.bat)
- [x] Documentation à jour

## 📞 Contact

- **Email support :** support@lexiflow.com
- **Documentation backend :** [backend-instructions.md](backend/backend-instructions.md)
- **Guide extension :** [EXTENSION_GUIDE.md](extension/EXTENSION_GUIDE.md)
- **Spécifications site :** [WEBSITE-DESC.md](website/WEBSITE-DESC.md)

## 📄 Licence

© 2025 LexiFlow. Tous droits réservés. Propriétaire.

---

<div align="center">
  <sub>Fait avec ❤️ pour briser les barrières linguistiques</sub>
  <br>
  <sub>Dernière mise à jour : 18 juin 2025 - 03h15</sub>
</div>