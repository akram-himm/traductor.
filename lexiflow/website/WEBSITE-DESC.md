
# WEBSITE_DESC.md - Plan de construction du site web LexiFlow

## 📁 Arborescence du dossier `lexiflow/website/`

Ce dossier contient le site web vitrine de LexiFlow, avec toutes les pages publiques, les ressources statiques et les fichiers de style/scripts.

```
website/
├── WEBSITE-DESC.md      # Documentation et plan du site web
├── about.html           # Page À propos
├── coming-soon.html     # Page Early Bird
├── contact.html         # Page de contact
├── css/                 # Feuilles de style CSS
├── dashboard.html       # Tableau de bord utilisateur
├── faq.html             # Foire aux questions
├── features.html        # Page des fonctionnalités
├── images/              # Images et illustrations
├── index.html           # Landing page
├── js/                  # Scripts JavaScript du site
├── login.html           # Page de connexion
├── pricing.html         # Tarifs
├── privacy.html         # Politique de confidentialité
├── register.html        # Page d'inscription
├── support.html         # Support utilisateur
├── terms.html           # Conditions générales d'utilisation
```

## 🌐 Vue d'ensemble

Le site web LexiFlow servira de vitrine pour notre extension Chrome de traduction. Ce document contient les spécifications complètes pour la construction du site.

**Nom de l'extension :** LexiFlow  
**Prix Premium :** 4.99€/mois (Early Bird : 2.99€/mois)  
**Status actuel :** ✅ 100% complété

## ✅ Pages créées (10/10) :
1. ✅ index.html - Landing page
2. ✅ features.html - Fonctionnalités (design moderne)
3. ✅ pricing.html - Tarifs
4. ✅ faq.html - FAQ complète (26 questions)
5. ✅ coming-soon.html - Early Bird
6. ✅ privacy.html - Confidentialité
7. ✅ terms.html - CGU
8. ✅ contact.html
9. ✅ about.html
10. ✅ support.html

## 💡 Notes importantes :
- Design moderne et professionnel
- Toutes les pages sont responsive
- Prêt pour lancement après corrections mineures

## 💡 Notes importantes :
- Design moderne et professionnel
- Toutes les pages sont responsive
- Prêt pour lancement après corrections mineures

## 📊 État d'avancement (18 juin 2025)

| Page | Statut | Progression | Notes |
|------|---------|-------------|--------|
| Coming Soon | ✅ Complété | 100% | Fonctionnelle avec liste d'attente |
| Landing Page | ✅ Complété | 100% | - |
| Features | ✅ Complété | 100% | - |
| Pricing | ✅ Complété | 100% | - |
| FAQ | ✅ Complété | 100% | - |
| Contact | ✅ Complété | 100% | - |
| About | ✅ Complété | 100% | - |
| Privacy/Terms | ✅ Complété | 100% | - |
| Dashboard | ✅ Complété | 100% | Pour utilisateurs connectés |

### 🎉 Ce qui est fait :

#### ✅ Page Coming Soon (100% complète)
- Design moderne avec animations
- Compte à rebours fonctionnel (1er août 2025)
- Formulaire d'inscription opérationnel
- Système de liste d'attente avec stockage JSON
- Affichage des stats en temps réel
- Animation "glow" sur l'offre Early Bird
- Responsive mobile
- **2 inscrits Early Bird** à ce jour !

#### 🚀 Infrastructure mise en place :
- Serveur Python pour développement local
- CORS configuré pour port 8000
- API Backend connectée et fonctionnelle
- Script de démarrage `start-lexiflow.bat`

## 📑 Structure complète des pages

### 1. ✅ Page Coming Soon (COMPLÉTÉE)

**Statut :** 100% fonctionnelle  
**Fichier :** `website/coming-soon.html`  
**API :** Connectée à `/api/waitlist/*`

**Fonctionnalités implémentées :**
- Compte à rebours dynamique
- Inscription avec validation email
- Sauvegarde dans `data/waitlist.json`
- Affichage position et statut Early Bird
- Stats en temps réel (nombre d'inscrits)
- Messages de succès/erreur
- Design responsive

**Statistiques actuelles :**
- Total inscrits : 2
- Places Early Bird restantes : 998/1000
- Dernière inscription : 18/06/2025

### 2. Page d'accueil (Landing Page) - À FAIRE

**Objectif :** Captiver l'attention, expliquer la proposition de valeur et inciter à l'installation  
**Ton :** Amical, clair, direct, axé sur les bénéfices
**Priorité :** HAUTE 🔥

#### Contenu textuel :

- **Titre Principal (H1) :** "LexiFlow : Traduisez, Apprenez, Maîtrisez. Votre Monde en Toutes Langues."
- **Sous-titre (H2) :** "Traduisez instantanément n'importe quel mot sur le web, mémorisez avec des flashcards intelligentes et explorez la puissance de l'IA contextuelle."
- **Slogan Court :** "La traduction sans effort, l'apprentissage sans limite."

#### Arguments clés (avec icônes) :
1. **Traduction Instantanée :** "Un clic, une traduction. Accédez à la signification de n'importe quel mot sur le web, dans presque toutes les langues."
2. **Apprentissage Ludique :** "Mémorisez votre nouveau vocabulaire avec des flashcards interactives et des pratiques amusantes."
3. **IA Contextuelle (Premium) :** "Passez au niveau supérieur avec la traduction DeepSeek AI, pour des nuances et un contexte inégalés."
4. **Expérience Fluide :** "Conçue pour la rapidité et la simplicité, LexiFlow s'intègre parfaitement à votre navigation."

#### Section "Comment ça marche" :
1. **Installez LexiFlow :** "Ajoutez l'extension à votre navigateur en un instant."
2. **Sélectionnez un Mot :** "Sur n'importe quelle page web, survolez ou cliquez sur un mot."
3. **Obtenez la Traduction :** "La traduction apparaît instantanément, prête à être mémorisée."

#### Éléments visuels :
- Hero Section avec vidéo/GIF de démonstration
- Icônes pour chaque argument clé
- Captures d'écran de l'extension en action
- CTA principal : "Ajouter LexiFlow à Chrome Gratuitement"

### 3. Page Fonctionnalités (/features) - À FAIRE

**Objectif :** Détailler toutes les capacités de LexiFlow  
**Ton :** Informatif, enthousiaste

#### Sections principales :

##### Traduction Instantanée
- Support de 11 langues (FR, EN, AR, ES, DE, IT, PT, RU, JA, KO, ZH)
- Détection automatique de la langue source
- Traduction en un clic ou survol
- Limite : 100 caractères (gratuit) / 350 caractères (premium)

##### Système de Flashcards Intelligent
- Création automatique depuis les traductions
- Limite : 50 flashcards (gratuit) / 200 flashcards (premium)
- Organisation par tags et langues
- Statistiques de progression

##### Mode Pratique (Premium uniquement)
- Révision espacée intelligente
- Quiz interactifs
- Suivi des performances
- Rappels de révision

##### Fonctionnalités Premium Exclusives
- **DeepSeek AI** pour traductions contextuelles avancées
- **Traduction longue** (paragraphes et pages entières)
- **Prononciation audio native** (text-to-speech)
- **Synchronisation cloud** multi-appareils
- **Support prioritaire**

### 4. Page Tarifs (/pricing) - À FAIRE

**Objectif :** Présenter clairement l'offre freemium et convertir  
**Ton :** Transparent, incitatif

#### Structure :

##### Tableau comparatif

| Fonctionnalité | LexiFlow Gratuit | LexiFlow Premium |
|----------------|------------------|-------------------|
| **Prix** | 0€ | 4.99€/mois |
| **Traductions instantanées** | ✅ Illimitées | ✅ Illimitées |
| **Limite de caractères** | 100 caractères | 350 caractères |
| **Services de traduction** | Google, MyMemory | DeepSeek AI + tous |
| **Flashcards** | 50 cartes max | 200 cartes max |
| **Mode Pratique** | ❌ | ✅ |
| **Traduction longue** | ❌ | ✅ |
| **Prononciation audio** | ❌ | ✅ |
| **Synchronisation cloud** | ❌ | ✅ |
| **Support** | Communautaire | Prioritaire |

##### Offre Early Bird 🐦
- **2.99€/mois** à vie (au lieu de 4.99€)
- Tarif garanti pour les 1000 premiers utilisateurs
- **Places restantes : 998** (mise à jour : 18/06/2025)
- Bannière compte à rebours
- CTA : "Profiter de l'offre Early Bird"

### 5. Page FAQ (/faq) - À FAIRE

**Objectif :** Répondre aux questions courantes et lever les objections  
**Ton :** Clair, rassurant

#### Catégories de questions :

##### Utilisation Générale
- Comment installer LexiFlow ?
- Quelles langues sont supportées ?
- Comment utiliser les flashcards ?
- Quelle est la différence entre les limites de caractères ?

##### LexiFlow Premium
- Quelle est la différence entre gratuit et Premium ?
- Comment fonctionne DeepSeek AI ?
- Comment m'abonner à Premium ?
- Puis-je annuler à tout moment ?

##### Problèmes Techniques
- Que faire si l'extension ne fonctionne pas ?
- Comment signaler un bug ?
- L'extension ralentit-elle mon navigateur ?

##### Confidentialité et Données
- Mes traductions sont-elles stockées ?
- LexiFlow collecte-t-il mes données ?
- Où sont stockées mes flashcards ?

### 6. Page Support/Contact (/contact) - À FAIRE

**Objectif :** Offrir une assistance rapide et efficace  
**Ton :** Professionnel, serviable

#### Éléments :
- **Titre :** "Besoin d'aide ? Contactez-nous !"
- **Formulaire de contact :**
  - Nom
  - Email
  - Sujet
  - Message
  - Bouton "Envoyer"
- **Email direct :** support@lexiflow.com
- **Temps de réponse :** Sous 24-48h

### 7. Page À Propos (/about) - À FAIRE

**Objectif :** Créer une connexion émotionnelle avec les utilisateurs  
**Ton :** Inspirant, authentique

#### Contenu :
- **Notre Mission :** "Faciliter la lecture, l'apprentissage et la communication à travers les langues"
- **Notre Vision :** "Devenir le compagnon linguistique incontournable pour des millions d'utilisateurs"
- **Pourquoi LexiFlow ?** Histoire de la création et valeurs
- **L'Équipe** (optionnel)

### 8. Pages Légales - À FAIRE (OBLIGATOIRE)

#### Politique de Confidentialité (/privacy)
- Données collectées (minimales)
- Stockage local vs cloud
- Utilisation de DeepSeek AI
- Droits des utilisateurs (RGPD)

#### Conditions d'Utilisation (/terms)
- Acceptation des conditions
- Utilisation de l'extension
- Abonnement Premium
- Propriété intellectuelle
- Limitations de responsabilité

### 9. Dashboard Utilisateur (/dashboard) - À FAIRE

**Pour utilisateurs connectés uniquement**

#### Sections :
- Vue d'ensemble (stats personnelles)
- Mes flashcards
- Mon abonnement
- Paramètres du compte
- Historique de traduction

## 🎨 Guide de style et design

### Palette de couleurs
- **Primaire :** #0A2C4D (Bleu Marine profond)
- **Secondaire :** #FFFFFF (Blanc pur)
- **Accent :** #FFD700 (Jaune vif) ou #00C896 (Vert menthe)
- **Texte principal :** #333333 (Gris foncé)
- **Arrière-plan :** #F8F9FA (Gris très clair)

### Typographie
- **Titres (H1, H2) :** Montserrat, Bold, 700
- **Sous-titres (H3, H4) :** Montserrat, Semi-Bold, 600
- **Corps de texte :** Open Sans, Regular, 400
- **Tailles responsive :** Mobile-first approach

### Composants UI récurrents
- **Boutons CTA principaux :** Jaune vif avec hover effect
- **Cards de fonctionnalités :** Blanc avec ombre légère
- **Icônes :** Style line icons moderne
- **Animations :** Subtiles, au scroll et hover

## 🏗️ Structure technique actuelle

### Frontend
- **Actuel :** HTML/CSS/JS vanilla (coming-soon.html)
- **Prévu :** Continuer en vanilla ou migrer vers React/Vue

### Backend
- **API :** Express.js (100% fonctionnel)
- **Routes disponibles :**
  - `/api/waitlist/subscribe` ✅
  - `/api/waitlist/stats` ✅
  - `/api/auth/*` ✅
  - `/api/subscription/*` ✅

### Hébergement prévu
- **Frontend :** Vercel ou Netlify
- **Backend :** Railway ou Render
- **Base de données :** PostgreSQL (Supabase)

## 📱 Responsive Design

### Breakpoints
- **Mobile :** < 768px (priorité absolue)
- **Tablet :** 768px - 1024px
- **Desktop :** > 1024px

### Adaptations mobile
- ✅ Coming Soon : 100% responsive
- Menu hamburger (à implémenter)
- Boutons pleine largeur
- Sections empilées
- Textes redimensionnés

## 🔍 SEO et Performance

### Métadonnées essentielles
```html
<title>LexiFlow - Extension Chrome de Traduction avec Flashcards</title>
<meta name="description" content="Traduisez instantanément n'importe quel mot sur le web. Créez des flashcards intelligentes. Version Premium avec DeepSeek AI.">
<meta name="keywords" content="traduction, chrome extension, flashcards, apprentissage langues, deepseek ai">
```

### Optimisations requises
- Images optimisées (WebP + fallback JPG)
- Lazy loading
- Minification CSS/JS
- CDN pour assets
- HTTPS obligatoire

## 📊 Analytics et Conversion

### Événements à tracker
1. ✅ Soumissions email (coming soon) - FAIT
2. Clics "Ajouter à Chrome"
3. Clics "Profiter Early Bird"
4. Temps sur /pricing
5. Taux de rebond par page

### Outils recommandés
- Google Analytics 4
- Hotjar (heatmaps)
- Google Tag Manager

## ✅ Checklist de développement

### Phase 1 - Coming Soon (COMPLÉTÉ) ✅
- [x] Page Coming Soon
- [x] Formulaire d'inscription
- [x] Connexion API backend
- [x] Système de liste d'attente
- [x] Design responsive
- [x] Animations CSS

### Phase 2 - Site principal (COMPLÉTÉ) ✅
- [x] Landing page
- [x] Page Features
- [x] Page Pricing avec Stripe
- [x] Page FAQ
- [x] Page Contact
- [x] Page About
- [x] Pages légales (Privacy, Terms)

### Phase 3 - Espace membre (COMPLÉTÉ) ✅
- [x] Système d'authentification
- [x] Dashboard utilisateur
- [x] Gestion abonnement
- [x] Synchronisation flashcards

### Phase 4 - Optimisation (COMPLÉTÉ) ✅
- [x] SEO on-page
- [x] Performance (< 3s)
- [x] Tests cross-browser
- [x] Accessibilité WCAG AA
- [x] Analytics

## 🚀 Commandes utiles

### Développement local
```bash
# Démarrer tout LexiFlow (Windows)
double-clic sur start-lexiflow.bat

# Ou manuellement :
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Site web
cd website
python -m http.server 8000
```

### URLs de développement
- Site web : http://localhost:8000/coming-soon.html
- API Backend : http://localhost:3001/api/health
- Stats waitlist : http://localhost:3001/api/waitlist/stats

---

**Note :** Ce document est la référence principale pour le développement du site web.  
**Dernière mise à jour :** 18 juin 2025 - 03h30