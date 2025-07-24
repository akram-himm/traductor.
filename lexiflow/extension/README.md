# 🌐 LexiFlow - Smart Translation & Language Learning Extension

<div align="center">

![LexiFlow Logo](https://img.shields.io/badge/LexiFlow-Translation%20%26%20Learning-blue?style=for-the-badge)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green?style=for-the-badge&logo=googlechrome)
![Language Learning](https://img.shields.io/badge/Language-Learning-orange?style=for-the-badge)

**Traduisez, Apprenez, Mémorisez - Directement dans votre navigateur**

[Installation](#-installation) • [Fonctionnalités](#-fonctionnalités) • [Documentation](#-documentation) • [Contribution](#-contribution)

</div>

## 🎯 À propos

LexiFlow est une extension Chrome innovante qui transforme votre navigation web en une expérience d'apprentissage linguistique. Traduisez instantanément n'importe quel texte, créez des flashcards intelligentes et pratiquez avec un système de révision espacée - le tout synchronisé dans le cloud.

### ✨ Points Forts

- 🔄 **Traduction instantanée** avec un simple clic ou Ctrl+Q
- 🎴 **Flashcards intelligentes** organisées automatiquement par paires de langues
- 🎮 **Mode pratique** avec révision espacée et suivi des progrès
- ☁️ **Synchronisation cloud** via compte Google
- 🌍 **11 langues supportées** (FR, EN, AR, ES, DE, IT, PT, RU, JA, KO, ZH)
- 🎨 **Interface moderne** et personnalisable
- 🔒 **Respect de la vie privée** - vos données vous appartiennent

## 🚀 Installation

### Via Chrome Web Store (Recommandé)
1. Visitez le [Chrome Web Store](https://chrome.google.com/webstore)
2. Recherchez "LexiFlow"
3. Cliquez sur "Ajouter à Chrome"

### Installation Manuelle (Développeurs)
```bash
# Cloner le dépôt
git clone https://github.com/yourusername/lexiflow.git
cd lexiflow/extension

# Charger dans Chrome
1. Ouvrir chrome://extensions/
2. Activer "Mode développeur"
3. "Charger l'extension non empaquetée"
4. Sélectionner le dossier extension/
```

## 🎮 Utilisation Rapide

1. **Traduire** : Sélectionnez du texte → Cliquez sur la bulle 🌐
2. **Sauvegarder** : Cliquez sur ⭐ dans la bulle pour créer une flashcard
3. **Pratiquer** : Ouvrez le popup → Flashcards → Pratiquer
4. **Synchroniser** : Connectez-vous avec Google pour sauvegarder vos données

## 🌟 Fonctionnalités

### Traduction Intelligente
- Détection automatique de la langue source
- Support de mots, phrases et paragraphes
- Affichage contextuel non-intrusif
- Raccourci clavier personnalisable

### Système de Flashcards
- Organisation automatique par paires de langues
- Catégorisation (Favoris, Difficiles, Maîtrisées)
- Inversion des langues d'apprentissage
- Suppression et restauration de dossiers

### Mode Pratique Avancé
- Quiz à choix multiples
- Suivi des cartes ratées
- Révision ciblée des difficultés
- Statistiques de progression

### Synchronisation & Sécurité
- Connexion sécurisée OAuth2
- Synchronisation temps réel
- Sauvegarde automatique
- Multi-appareils

## 📖 Documentation

- 📚 **[Guide Utilisateur](USER_GUIDE.md)** - Pour commencer rapidement
- 🛠️ **[Guide Développeur](DEVELOPER_GUIDE.md)** - Architecture et contribution
- 📋 **[Description Technique](EXTENSION_DESCRIPTION.md)** - Détails d'implémentation

## 🏗️ Architecture Technique

```
Extension (Manifest V3)          Backend (Node.js)
├── Content Script       ←→      ├── API REST
├── Service Worker       ←→      ├── MongoDB
├── Popup UI            ←→      └── OAuth2
└── Practice System
```

### Technologies Utilisées

- **Frontend** : Vanilla JavaScript, HTML5, CSS3
- **Backend** : Node.js, Express, MongoDB
- **APIs** : Google Translate, Chrome Extensions API
- **Authentification** : OAuth2 (Google)
- **Hébergement** : Render.com

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment participer :

1. **Fork** le projet
2. **Créez** votre branche (`git checkout -b feature/AmazingFeature`)
3. **Committez** vos changements (`git commit -m 'feat: Add AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrez** une Pull Request

### Guidelines
- Suivez les conventions de code existantes
- Ajoutez des tests pour les nouvelles fonctionnalités
- Mettez à jour la documentation
- Respectez le style de commit conventionnel

## 🐛 Signaler un Bug

Rencontré un problème ? [Ouvrez une issue](https://github.com/yourusername/lexiflow/issues) avec :
- Description du bug
- Étapes pour reproduire
- Comportement attendu
- Screenshots si applicable

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- Icônes par [Emoji](https://unicode.org/emoji/charts/full-emoji-list.html)
- Traduction par [Google Translate](https://translate.google.com)
- Hébergement backend par [Render](https://render.com)

## 📊 Statistiques

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Chrome](https://img.shields.io/badge/chrome-90%2B-orange)
![Maintenance](https://img.shields.io/badge/maintained-yes-green)

---

<div align="center">

Fait avec ❤️ pour les apprenants de langues du monde entier

[⬆ Retour en haut](#-lexiflow---smart-translation--language-learning-extension)

</div>