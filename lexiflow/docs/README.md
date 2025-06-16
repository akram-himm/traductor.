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
| Phase 2 - Backend & Auth | 🚧 En cours | 85% |
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
- ✅ Intégration Stripe complète avec webhooks ✅
- ✅ Tous les tests passent au vert
- ✅ Serveur de développement opérationnel

### 🎯 Prochaines priorités
1. **🌐 Créer le site web** (PRIORITÉ #1)
   - Page Coming Soon
   - Landing page
   - Collecte d'emails
2. **🚀 Déployer le backend**
3. **💰 Lancer la campagne Early Bird**
4. **✨ Activer les features premium**

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

### Démarrage rapide du backend
```bash
# 1. Cloner le repository
git clone https://github.com/yourusername/lexiflow.git

# 2. Aller dans le dossier backend
cd lexiflow/lexiflow-backend

# 3. Installer les dépendances
npm install

# 4. Démarrer le serveur de test
node test-server.js

# 5. Dans un autre terminal, lancer Stripe CLI
stripe listen --forward-to localhost:3001/api/payment/webhook

# 6. Tester les webhooks
node scripts/test-stripe-webhooks.js
```

### Extension Chrome
- Ouvrir Chrome → Extensions → Mode développeur
- Charger l'extension non empaquetée → Dossier `extension`

## 📂 Structure du projet

```
lexiflow/
├── extension/           # Extension Chrome (✅ Fonctionnelle)
│   ├── manifest.json   # Configuration Chrome Extension v3
│   ├── background.js   # Service worker
│   ├── content.js      # Script principal
│   └── popup/          # Interface utilisateur
├── backend/            # API Node.js (🚧 40% complété)
│   ├── models/         # ✅ Modèles Sequelize
│   ├── routes/         # ⚠️ Routes Express (partielles)
│   └── middleware/     # ✅ Auth, validation
├── website/            # Site web (📅 À développer)
│   └── [Structure à définir]
└── docs/               # Documentation
    ├── README.md       # Ce fichier
    ├── BACKEND.md      # Détails techniques backend
    └── WEBSITE_DESC.md # Spécifications site web
```

## 🤝 Contribution

Ce projet est actuellement privé. Pour contribuer :
1. Contactez l'équipe principale
2. Suivez les conventions de code établies
3. Testez minutieusement avant chaque PR
4. Documentez vos modifications

## 🎉 Accomplissements du jour (16 juin 2025)

- ✅ Configuration Stripe de A à Z
- ✅ Création complète du backend (85%)
- ✅ Tous les webhooks Stripe fonctionnels
- ✅ Tests automatisés opérationnels
- ✅ Documentation professionnelle

## 📊 Métriques de succès visées

- **1000 utilisateurs actifs** (3 premiers mois)
- **10% de taux de conversion** Free → Premium
- **4.5+ étoiles** sur Chrome Web Store
- **Churn rate < 5%** par mois
- **100 Early Birds** à 2.99€/mois

## 📞 Contact

- **Email support :** support@lexiflow.com
- **Documentation technique :** Voir [BACKEND.md](BACKEND.md)
- **Description du site :** Voir [WEBSITE_DESC.md](WEBSITE_DESC.md)

## 📄 Licence

© 2025 LexiFlow. Tous droits réservés. Propriétaire.

---

<div align="center">
  <sub>Fait avec ❤️ pour briser les barrières linguistiques</sub>
</div>