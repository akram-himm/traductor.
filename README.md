# Quick Translator Pro - Documentation Projet

## 📋 Vue d'ensemble du projet

**Quick Translator Pro** est une extension Chrome de traduction instantanée qui combine des services gratuits et premium (DeepSeek AI) avec un système de flashcards pour l'apprentissage des langues.

**Version actuelle :** 3.0 (Demo)  
**Statut :** En développement - Préparation pour publication  
**Objectif :** Extension freemium à commercialiser  

## 🎯 Objectifs du projet

1. **Court terme** : Publier une version démo gratuite sur Chrome Web Store
2. **Moyen terme** : Implémenter le système de paiement pour DeepSeek AI
3. **Long terme** : Monétisation complète avec système de compte utilisateur

## 🏗️ Architecture actuelle

### Fichiers principaux
```
├── manifest.json (v3)      # Configuration extension Chrome
├── background.js           # Service worker
├── content.js              # Script principal (injection dans les pages)
├── popup.html/js/css       # Interface utilisateur
└── [À créer] landing page  # Site de présentation
```

### Technologies utilisées
- Chrome Extension Manifest V3
- Vanilla JavaScript (pas de framework)
- Chrome Storage API (sync + local)
- Services de traduction multiples (fallback system)

## ✅ Fonctionnalités implémentées

### 1. **Traduction instantanée**
- ✅ Sélection texte → bouton flottant → traduction
- ✅ 11 langues supportées (FR, EN, AR, ES, DE, IT, PT, RU, JA, KO, ZH)
- ✅ Détection automatique de langue
- ✅ Gestion des mots ambigus (ex: "car" FR/EN)
- ✅ Cache des traductions
- ✅ Raccourci clavier (Ctrl+Q)

### 2. **Services de traduction**
- ✅ DeepSeek AI (Premium - avec clé API utilisateur)
- ✅ Google Translate (via proxy gratuit)
- ✅ MyMemory API
- ✅ LibreTranslate
- ✅ Lingva
- ✅ Dictionnaire local (mots courants)
- ✅ Système de fallback intelligent

### 3. **Système de flashcards**
- ✅ Création depuis traductions
- ✅ Organisation par paires de langues
- ✅ Dossiers (défaut, favoris, difficiles, maîtrisées)
- ✅ Swap de direction linguistique
- ⚠️ Mode pratique (UI créée mais désactivée)

### 4. **Gestion des données**
- ✅ Historique complet des traductions
- ✅ Export/Import JSON
- ✅ Nettoyage automatique (limite 1000 traductions)
- ✅ Statistiques d'utilisation

### 5. **Paramètres utilisateur**
- ✅ Langue cible par défaut
- ✅ Couleur du bouton personnalisable
- ✅ Activation/désactivation extension
- ✅ Détection intelligente on/off
- ✅ Animations on/off
- ✅ Configuration DeepSeek API

## 🚧 En cours / À faire

### Priorité 1 - Pour la démo
- ✅ ~~Système de base fonctionnel~~ **FAIT**
- ✅ ~~Interface utilisateur complète~~ **FAIT**
- 🔄 Icônes pour Chrome Store (16x16, 48x48, 128x128)
- 🔄 Screenshots pour la publication
- 🔄 Description pour Chrome Store

### Priorité 2 - Monétisation
- ❌ Système d'authentification (Google/Apple Sign-in)
- ❌ Dashboard utilisateur
- ❌ Intégration paiement pour DeepSeek
- ❌ Système de crédit/limite
- 🔄 Landing page (brief créé pour Manus)

### Priorité 3 - Features avancées
- ❌ Mode pratique des flashcards (activation)
- ❌ Statistiques d'apprentissage
- ❌ Synchronisation cloud
- ❌ Mode hors-ligne étendu

## 💰 Stratégie de monétisation

### Phase 1 (Actuelle) - Démo
- Version gratuite avec limites (50 traductions/jour)
- DeepSeek AI avec clé API personnelle de l'utilisateur
- Pas de système de compte requis

### Phase 2 (Prochaine étape)
- Système de compte (OAuth Google/Apple)
- Dashboard pour gérer l'utilisation
- Paiement direct à DeepSeek par l'utilisateur

### Phase 3 (Future)
- Abonnement Premium complet
- Notre propre proxy pour DeepSeek
- Features exclusives Premium

## 🐛 Bugs connus / Limitations

1. **Mode pratique** : UI existe mais fonctionnalité désactivée
2. **Limite utilisateurs gratuits** : 
   - 50 traductions/jour
   - 100 flashcards max
3. **Sécurité** : Clé API stockée en clair (à améliorer)

## 📝 Notes pour le développement

### Points d'attention
1. **Contexte d'extension** : Toujours vérifier `isExtensionContextValid()`
2. **Permissions** : Respecter les politiques Chrome Store
3. **Performance** : Cache agressif pour limiter les appels API
4. **UX** : Animations désactivables pour accessibilité

### Conventions de code
- Pas de frameworks (vanilla JS)
- Commentaires en français
- Console.log avec emojis pour debug
- Gestion d'erreur systématique

## 🚀 Prochaines étapes immédiates

1. **Créer les assets visuels**
   - Logo et icônes
   - Screenshots de démo
   - Vidéo promotionnelle (optionnel)

2. **Finaliser pour Chrome Store**
   - Description multilingue
   - Privacy Policy
   - Terms of Service

3. **Landing page**
   - Brief déjà créé pour Manus
   - Domaine à acheter
   - Hébergement simple (GitHub Pages?)

4. **Beta testing**
   - 10-20 testeurs minimum
   - Feedback form
   - Itération rapide

## 📞 Contacts et ressources

- **Documentation DeepSeek** : https://platform.deepseek.com
- **Chrome Extension Docs** : https://developer.chrome.com/docs/extensions/
- **Support prévu** : email (à créer)

## 🔄 Historique des versions

- **v3.0** (actuelle) : Refonte complète avec DeepSeek AI
- **v2.x** : [Non documenté]
- **v1.x** : [Non documenté]

---

**Note pour Claude.ai** : Ce document représente l'état actuel du projet au 13/06/2025. Toujours vérifier les fichiers sources pour les dernières modifications. Le projet suit une approche freemium avec une version démo gratuite en préparation pour publication sur Chrome Web Store.
