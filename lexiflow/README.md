
# LexiFlow - Extension Chrome de Traduction Instantanée

## 📁 Arborescence du dossier `lexiflow/`

Ce dossier contient l'ensemble du projet LexiFlow, incluant l'extension Chrome, le backend API, le site web, et les scripts/outils associés.

```
lexiflow/
├── README.md                # Documentation générale du projet LexiFlow
├── backend/                 # Backend Node.js (API, modèles, routes, scripts, tests)
├── data/                    # Données statiques (ex: waitlist)
├── extension/               # Code source de l'extension Chrome LexiFlow
├── start-lexiflow.bat       # Script de démarrage rapide (Windows)
├── website/                 # Code source du site web vitrine LexiFlow
```

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

## 🚀 État du projet (Décembre 2024)

### Version actuelle : 0.8.5
| Phase | Statut | Progression |
|-------|---------|-------------|
| Phase 1 - Extension Base | ✅ Complété | 100% |
| Phase 2 - Backend & Auth | ✅ Complété | 85% |
| Phase 3 - Site Web | ✅ Complété | **100%** |
| Phase 4 - Extension Premium | 📅 Planifié | 0% |
| Phase 5 - Lancement | 📅 Août 2025 | 0% |

### 🏆 Ce qui est fait
- ✅ Extension Chrome 100% fonctionnelle (version gratuite)
- ✅ Système de traduction instantanée (11 langues)
- ✅ Flashcards avec limites (100/illimité)
- ✅ Limites de caractères (150/illimité)
- ✅ Architecture backend complète
- ✅ Authentification JWT sécurisée
- ✅ Intégration Stripe complète avec webhooks
- ✅ **Tous les tests passent au vert** 🎉
- ✅ Serveur de développement opérationnel
- ✅ **Mode développement sans base de données**
- ✅ **Toutes les pages web complétées**
- ✅ **Interface popup optimisée** (largeur 480px, meilleur affichage des flashcards)
- ✅ **Bouton "Effacer tout" pour les flashcards**
- ✅ **Option export/import retirée des menus contextuels**

### 🚧 État actuel du site web

#### Pages complétées (10/10) :
- ✅ `index.html` - Landing page
- ✅ `features.html` - Fonctionnalités détaillées
- ✅ `pricing.html` - Page des tarifs
- ✅ `faq.html` - Questions fréquentes (26 questions)
- ✅ `coming-soon.html` - Page Early Bird
- ✅ `privacy.html` - Politique de confidentialité
- ✅ `terms.html` - Conditions d'utilisation
- ✅ `contact.html` - Formulaire de contact
- ✅ `about.html` - À propos
- ✅ `support.html` - Base de connaissances

### 🎯 Prochaines priorités
1. **Déployer le backend** en production
2. **Lancer la campagne Early Bird** (4.99€/mois)

## 💰 Modèle économique

| Fonctionnalité | Gratuit | Premium (7.99€/mois) |
|----------------|---------|----------------------|
| Traductions instantanées | ✅ Illimitées | ✅ Illimitées |
| Limite de caractères | 150 caractères | Illimité |
| Langues disponibles | 3 langues (FR, EN, ES) | 11 langues |
| Services de traduction | Google, MyMemory | DeepSeek AI + tous |
| Flashcards | 100 cartes | Illimitées |
| Mode Pratique | ❌ | ✅ |
| Traduction longue | ❌ | ✅ |
| Prononciation audio | ❌ | ✅ |
| Synchronisation cloud | ❌ | ✅ |
| Support | Communautaire | Prioritaire |

### 🐦 Offre Early Bird
**4.99€/mois** à vie pour les 500 premiers utilisateurs (au lieu de 7.99€)

## 🎯 Stratégies de monétisation explorées

### Option A : B2B Entreprises (Recommandé)
- **199€/mois** par entreprise
- Cibles : Agences de traduction, cabinets d'avocats internationaux
- Potentiel : 5 clients = 1000€/mois

### Option B : Lifetime Deals
- **500€** accès à vie
- Plateformes : AppSumo, Gumroad
- Potentiel : 25-50k€ en 30 jours

### Option C : Vente du projet
- Valeur estimée : **15-25k€** (état actuel)
- Plateformes : Flippa, MicroAcquire
- Délai : 2-4 semaines

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

### Site Web
```bash
# 1. Aller dans le dossier website
cd lexiflow/website

# 2. Ouvrir dans un navigateur
- Ouvrir index.html directement
- Ou utiliser un serveur local (Live Server)
```

## 📂 Structure du projet

```
lexiflow/
├── README.md           # Ce fichier (mis à jour)
├── extension/          # Extension Chrome (100% fonctionnelle)
│   └── EXTENSION_GUIDE.md
├── backend/            # API Node.js (85% complété)
│   └── backend-instructions.md
└── website/            # Site web (100% complété)
    ├── WEBSITE-DESC.md # Plan détaillé du site
    ├── index.html      # ✅ Landing page
    ├── features.html   # ✅ Fonctionnalités
    ├── pricing.html    # ✅ Tarifs
    ├── faq.html        # ✅ FAQ
    ├── coming-soon.html# ✅ Early Bird
    ├── privacy.html    # ✅ Confidentialité
    ├── terms.html      # ✅ CGU
    ├── contact.html    # ✅ Contact
    ├── about.html      # ✅ À propos
    └── support.html    # ✅ Support
```

## 🏗️ Architecture technique

- **Extension** : Manifest V3, content scripts
- **Backend** : Node.js, Express, JWT, Stripe
- **Site web** : HTML/CSS/JS vanilla (simplicité)
- **Pas de build process** complexe

## 📊 Métriques de succès visées

- **1000 utilisateurs actifs** (3 premiers mois)
- **10% de taux de conversion** Free → Premium
- **4.5+ étoiles** sur Chrome Web Store
- **Churn rate < 5%** par mois
- **100 Early Birds** à 2.99€/mois

## 🎉 Accomplissements récents (Juin 2025)

- ✅ Toutes les pages du site web complétées et uniformisées
- ✅ Design cohérent sur toutes les pages
- ✅ Mobile-first responsive design

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
  <sub>Dernière mise à jour : Juin 2025</sub>
</div>