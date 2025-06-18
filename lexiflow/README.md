# LexiFlow - Extension Chrome de Traduction Instantanée

<div align="center">
  <img src="assets/logo.png" alt="LexiFlow Logo" width="120" height="120" />
  <h3>Traduisez, Apprenez, Maîtrisez. Votre Monde en Toutes Langues.</h3>
  
  [![Version](https://img.shields.io/badge/version-0.8.0-blue.svg)](https://github.com/yourusername/lexiflow)
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

## 🚀 État du projet

### Version actuelle : 0.8.5
| Phase | Statut | Progression |
|-------|---------|-------------|
| Phase 1 - Extension Base | ✅ Complété | 100% |
| Phase 2 - Backend & Auth | 🚧 En cours | **85%** |
| Phase 3 - Site Web | 📅 À faire | 0% |
| Phase 4 - Extension Premium | 📅 Planifié | 0% |
| Phase 5 - Lancement | 📅 Août 2025 | 0% |

### 🏆 Ce qui est fait
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

### 🎯 Prochaines priorités
1. **🌐 Créer le site web** (PRIORITÉ #1)
   - Page Coming Soon pour collecter des emails
   - Landing page attractive
   - Dashboard utilisateur
2. **🚀 Déployer le backend** en production
3. **💰 Lancer la campagne Early Bird** (2.99€/mois)
4. **✨ Activer les features premium** dans l'extension

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

### Backend (85% complet)
```bash
# 1. Aller dans le dossier backend
cd lexiflow/backend

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env

# 4. Démarrer le serveur
npm start

# Le serveur fonctionne sans PostgreSQL en mode dev !
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
├── backend/            # API Node.js (85% complété)
│   └── backend-instructions.md
└── website/            # Site web (0% - À développer)
    └── WEBSITE-DESC.md
```

## 🏗️ Architecture technique

### Extension (Complète)
- Manifest V3
- Content script avec injection
- 11 langues supportées
- Système de flashcards local

### Backend (85% complet)
- Node.js + Express
- PostgreSQL + Sequelize (optionnel en dev)
- JWT Authentication
- Stripe Payments
- Mode mock pour développement

### Site Web (À faire)
- Landing page
- Dashboard utilisateur
- Page Coming Soon
- Système de paiement

## 🤝 Contribution

Ce projet est actuellement privé. Pour contribuer :
1. Contactez l'équipe principale
2. Suivez les conventions de code établies
3. Testez minutieusement avant chaque PR
4. Documentez vos modifications

## 🎉 Accomplissements récents (17 juin 2025)

- ✅ Backend fonctionnel à 85%
- ✅ Tous les tests passent avec succès
- ✅ Mode développement sans base de données
- ✅ Structure de projet réorganisée et optimisée
- ✅ Documentation complète mise à jour
- ✅ Intégration Stripe fonctionnelle

## 📊 Métriques de succès visées

- **1000 utilisateurs actifs** (3 premiers mois)
- **10% de taux de conversion** Free → Premium
- **4.5+ étoiles** sur Chrome Web Store
- **Churn rate < 5%** par mois
- **100 Early Birds** à 2.99€/mois

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
  <sub>Dernière mise à jour : 17 juin 2025</sub>
</div>