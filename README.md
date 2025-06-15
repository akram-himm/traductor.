# LexiFlow - Documentation Projet

## 📋 Vue d'ensemble du projet

**LexiFlow** est une extension Chrome de traduction instantanée qui combine des services gratuits et premium avec un système de flashcards pour l'apprentissage des langues.

**Version actuelle :** 0.8.0 (En développement)  
**Statut :** 🚧 En cours de développement  
**Modèle économique :** Freemium  
- **Gratuit** : Traductions de base avec services gratuits
- **Premium** : 4.99€/mois (Early Bird : 2.99€/mois)

## 🎯 Vision du projet

Créer l'extension de traduction la plus intuitive et complète du marché, combinant :
1. **Traduction instantanée** précise et contextuelle
2. **Apprentissage actif** via flashcards intelligentes
3. **IA avancée** pour une compréhension nuancée
4. **Expérience premium** sans friction

## 🏗️ Architecture actuelle

### Extension Chrome
```
├── manifest.json (v3)      # Configuration extension Chrome
├── background.js           # Service worker
├── content.js              # Script principal (injection dans les pages)
├── popup.html/js/css       # Interface utilisateur
└── [À créer] Backend API   # Système d'authentification et paiements
```

### Site Web (À développer)
```
├── Landing page            # Présentation LexiFlow
├── Dashboard utilisateur   # Gestion compte/abonnement
├── Documentation          # Guide d'utilisation
└── Backend                # API REST + Base de données
```

## ✅ Fonctionnalités implémentées

### Version Gratuite
- ✅ **Traduction instantanée** (mots et phrases courtes)
- ✅ **11 langues supportées** (FR, EN, AR, ES, DE, IT, PT, RU, JA, KO, ZH)
- ✅ **Détection automatique de langue**
- ✅ **Gestion des mots ambigus** (ex: "car" FR/EN)
- ✅ **Historique des traductions**
- ✅ **Flashcards** (création et visualisation basique)
- ✅ **Raccourci clavier** (Ctrl+Q)
- ✅ **Export/Import des données** (JSON)

### Infrastructure Premium (Partiellement implémentée)
- ✅ **DeepSeek AI** (intégré mais avec clé API utilisateur)
- ⚠️ **Mode Pratique Flashcards** (code existant mais désactivé)
- ✅ **Personnalisation visuelle** (couleur du bouton)

## 🚧 En cours de développement

### Priorité 1 - Site Web
- ❌ **Landing page** (selon cahier des charges)
- ❌ **Pages légales** (CGU, Politique de confidentialité)
- ❌ **FAQ et Support**
- ❌ **Blog/Actualités**
- ❌ **Dashboard utilisateur**

### Priorité 2 - Infrastructure Backend
- ❌ **Système d'authentification** (Google OAuth + Email)
- ❌ **Gestion des abonnements** (Stripe/PayPal)
- ❌ **Backend API** (Node.js/Express ou similaire)
- ❌ **Base de données** (PostgreSQL/MongoDB)
- ❌ **Gestion des limites** (flashcards, traductions)

### Priorité 3 - Fonctionnalités Premium Extension
- ❌ **Mode Pratique des flashcards** (à activer et finaliser)
- ❌ **Traduction longue** (paragraphes et pages entières)
- ❌ **Prononciation audio** (text-to-speech)
- ❌ **Synchronisation multi-appareils**

## 💰 Modèle économique détaillé

### LexiFlow Gratuit
- Traductions illimitées (services gratuits)
- Création de flashcards (limite : **50 flashcards**)
- Historique local
- Support communautaire

### LexiFlow Premium (4.99€/mois)
- ✨ **DeepSeek AI** pour traductions contextuelles
- 📄 **Traductions longues** (paragraphes/pages)
- 🔊 **Prononciation audio native**
- 🎮 **Mode Pratique interactif** pour flashcards
- 💾 **200 flashcards** (4x plus)
- ☁️ **Synchronisation cloud**
- 🎯 **Support prioritaire**
- 🚀 **Accès anticipé aux nouveautés**

### Offre Early Bird 🐦
- **2.99€/mois** (au lieu de 4.99€)
- Tarif garanti à vie pour les premiers utilisateurs
- Limité dans le temps

## 🔧 Stack technique

### Frontend (Extension)
- Vanilla JavaScript (pas de framework)
- Chrome Extension Manifest V3
- Chrome Storage API (sync + local)

### Frontend (Site Web) - À définir
- React/Vue/Vanilla ?
- Tailwind CSS ?
- Vite ?

### Backend - À définir
- Node.js + Express ?
- PostgreSQL/MongoDB ?
- Stripe/PayPal pour paiements
- JWT pour authentification

### Services externes
- DeepSeek AI (traduction premium)
- Google Translate (proxy gratuit)
- MyMemory, LibreTranslate, Lingva (fallback)

## 📝 TODO List

### Phase 1 - Site Web (2-3 semaines)
- [ ] Développer landing page selon cahier des charges
- [ ] Créer pages : Features, Pricing, FAQ, Support, About
- [ ] Implémenter pages légales (CGU, Politique de confidentialité)
- [ ] Optimiser SEO et performance
- [ ] Design responsive mobile/desktop

### Phase 2 - Backend & Auth (1 mois)
- [ ] Créer API REST
- [ ] Implémenter authentification (Google OAuth + Email)
- [ ] Intégrer Stripe/PayPal
- [ ] Système de gestion des abonnements
- [ ] Dashboard utilisateur
- [ ] Système de limitations (50/200 flashcards)

### Phase 3 - Compléter l'extension (1-2 mois)
- [ ] Activer et finaliser le Mode Pratique
- [ ] Implémenter la traduction longue
- [ ] Ajouter la prononciation audio
- [ ] Créer système de limitation flashcards
- [ ] Intégrer avec backend pour Premium
- [ ] Tester et débugger

### Phase 4 - Lancement (2 semaines)
- [ ] Beta testing avec early adopters
- [ ] Corrections bugs
- [ ] Campagne early bird (2.99€/mois)
- [ ] Publication Chrome Web Store
- [ ] Monitoring et support

## 🐛 Bugs connus

1. **Mode pratique** : UI existe mais fonctionnalité désactivée
2. **Sécurité** : Clé API DeepSeek stockée en clair (à améliorer)
3. **Limites** : Pas de système de limitation pour version gratuite

## 📊 Métriques de succès

- 1000 utilisateurs actifs (3 mois)
- 10% de conversion premium
- 4.5+ étoiles sur Chrome Web Store
- Churn rate < 5%/mois

## 🤝 Contribution

Ce projet est actuellement privé. Pour toute question ou suggestion :
- Email : [À définir]
- Documentation technique : [Ce fichier]

## 📄 Licence

Propriétaire - Tous droits réservés

---

**Note :** Ce document est mis à jour régulièrement. Dernière mise à jour : 15/06/2025
