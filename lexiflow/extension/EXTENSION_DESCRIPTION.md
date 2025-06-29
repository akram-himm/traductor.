# 🚀 LexiFlow - Extension Chrome de Traduction et d'Apprentissage

## 📋 Vue d'ensemble

**LexiFlow** est une extension Chrome innovante conçue pour révolutionner la manière dont les utilisateurs interagissent avec les langues sur le web. Elle offre une traduction instantanée de texte sélectionné, un système intelligent de flashcards pour la mémorisation de vocabulaire, et des fonctionnalités avancées propulsées par l'IA DeepSeek pour les utilisateurs Premium.

Notre mission est de briser les barrières linguistiques en offrant une expérience fluide et un outil d'apprentissage puissant, directement intégré à votre navigateur.

## ✨ Fonctionnalités Clés

LexiFlow propose un modèle freemium avec des capacités étendues pour les abonnés Premium :

| Fonctionnalité                      | Gratuit       | Premium (avec DeepSeek AI) |
|-------------------------------------|---------------|----------------------------|
| Traduction instantanée (clic/sélection) | ✅ Illimitée  | ✅ Illimitée               |
| Services de traduction              | Google, MyMemory, LibreTranslate | DeepSeek AI + tous les autres |
| Historique des traductions          | 50 par jour   | Illimité                   |
| Flashcards intelligentes            | 50 cartes max | 200 cartes max             |
| Mode Pratique (révision espacée)    | ❌            | ✅                         |
| Traduction longue (paragraphes)     | ❌            | ✅                         |
| Prononciation audio native          | ❌            | ✅                         |
| Synchronisation cloud               | ❌            | ✅                         |
| Support                             | Communautaire | Prioritaire                |
| Personnalisation (couleur bouton)   | ✅            | ✅                         |
| Raccourci clavier (Ctrl+Q)          | ✅            | ✅                         |
| Détection intelligente des mots ambigus | ✅            | ✅                         |
| Animations et effets visuels        | ✅            | ✅                         |

## 🏗️ Architecture Technique

L'extension LexiFlow est construite sur les technologies web modernes et suit les meilleures pratiques de Chrome Extension (Manifest V3) :

*   **Manifest V3 (`manifest.json`)** : Le fichier de configuration principal de l'extension, définissant les permissions, les scripts et les actions.
*   **Service Worker (`background.js`)** : Gère les événements en arrière-plan, les alarmes (pour maintenir l'activité), les commandes clavier et la logique d'installation/mise à jour. Il est responsable de la persistance des données et de la communication avec les scripts de contenu.
*   **Content Script (`content.js`)** : Injecté dans les pages web, il détecte la sélection de texte, affiche l'icône de traduction, gère la bulle de traduction interactive et communique avec le service worker pour les requêtes de traduction.
*   **Popup (`popup.html`, `popup.js`, `popup.css`)** : Une mini-application web qui fournit l'interface utilisateur principale de l'extension. Elle permet aux utilisateurs de consulter l'historique, gérer les flashcards, accéder au mode pratique et configurer les paramètres.

## 📦 Installation (pour développeurs)

Pour installer et tester l'extension localement :

1.  **Cloner le dépôt** :
    ```bash
    git clone https://github.com/yourusername/lexiflow.git
    ```
2.  **Charger l'extension dans Chrome** :
    *   Ouvrez Chrome et naviguez vers `chrome://extensions`.
    *   Activez le **Mode développeur** (en haut à droite).
    *   Cliquez sur **Charger l'extension non empaquetée** et sélectionnez le dossier `lexiflow/extension`.
3.  Une icône 🌐 apparaîtra dans votre barre d'outils Chrome, indiquant que l'extension est prête.

## 🚀 Utilisation Rapide

*   **Traduire un texte** : Sélectionnez n'importe quel texte sur une page web. Une petite icône de traduction apparaîtra. Cliquez dessus ou utilisez le raccourci `Ctrl+Q` (Windows) / `⌘+Q` (Mac) pour afficher la traduction dans une bulle.
*   **Changer la langue cible** : Dans la bulle de traduction, utilisez le sélecteur de langue pour modifier la langue de traduction.
*   **Copier la traduction** : Cliquez sur l'icône "Copier" dans la bulle de traduction.
*   **Sauvegarder en flashcard** : Cliquez sur l'icône "Flashcard" dans la bulle pour ajouter la traduction à vos flashcards.

## 📊 Interface du Popup

Le popup de LexiFlow est une application complète avec plusieurs sections :

1.  **Tableau de bord** : Vue d'ensemble des statistiques d'utilisation (nombre total de traductions, flashcards créées) et accès rapide aux fonctionnalités Premium.
2.  **Historique** : Liste chronologique de toutes vos traductions, organisées par paires de langues. Vous pouvez copier, créer des flashcards ou supprimer des entrées.
3.  **Flashcards** : Gérez vos flashcards, organisées par dossiers (Non classées, Favoris, Difficiles, Maîtrisées). Accédez au mode pratique pour réviser votre vocabulaire.
4.  **Paramètres** : Personnalisez l'extension (langue cible, couleur du bouton), activez/désactivez des fonctionnalités (raccourcis, animations), configurez l'intégration DeepSeek AI et gérez vos données (export/import/réinitialisation).

## 💾 Gestion des Données

LexiFlow utilise `chrome.storage.local` et `chrome.storage.sync` pour stocker les données de l'utilisateur directement dans le navigateur, garantissant la confidentialité et la rapidité. Les utilisateurs peuvent exporter et importer leurs données pour la sauvegarde ou la migration.

## 💰 Modèle de Monétisation

LexiFlow fonctionne sur un modèle freemium. Les fonctionnalités de base sont gratuites, tandis que les capacités avancées, notamment l'intégration de l'IA DeepSeek, les traductions illimitées et le mode pratique, sont réservées aux utilisateurs Premium.

## 🌐 Langues Supportées

LexiFlow supporte la traduction vers et depuis les langues suivantes :
Français (FR), Anglais (EN), Arabe (AR), Espagnol (ES), Allemand (DE), Italien (IT), Portugais (PT), Russe (RU), Japonais (JA), Coréen (KO), Chinois (ZH).

---

**Dernière mise à jour :** Juin 2025
