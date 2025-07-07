# Configuration Facebook App pour LexiFlow

## Valeurs à copier-coller dans Facebook Developer Console

```
Nom affiché : LexiFlow - Smart Language Learning

Domaines de l'app : my-backend-api-cng7.onrender.com

URL Politique de confidentialité : https://my-backend-api-cng7.onrender.com/privacy

URL Conditions de service : https://my-backend-api-cng7.onrender.com/terms

URL Suppression des données : https://my-backend-api-cng7.onrender.com/data-deletion

Catégorie : Éducation

Description de l'app : Extension Chrome intelligente pour l'apprentissage des langues avec traduction instantanée et flashcards personnalisées.
```

## Instructions pour l'icône

L'icône doit être 1024×1024 pixels. Voici les options :

### Option 1 : Utiliser un générateur d'icône
1. Allez sur https://www.canva.com/
2. Créez un design 1024×1024
3. Ajoutez le texte "LexiFlow" avec l'emoji 🌐
4. Fond dégradé violet (#667eea → #764ba2)
5. Téléchargez en PNG

### Option 2 : Icône SVG à convertir
Créez un fichier `icon.svg` avec ce contenu :

```svg
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#gradient)"/>
  <text x="512" y="400" font-family="Arial, sans-serif" font-size="280" font-weight="bold" text-anchor="middle" fill="white">🌐</text>
  <text x="512" y="650" font-family="Arial, sans-serif" font-size="120" font-weight="bold" text-anchor="middle" fill="white">LexiFlow</text>
</svg>
```

Puis convertissez en PNG sur https://cloudconvert.com/svg-to-png

## Pages à créer sur votre backend

Vous devez créer ces endpoints qui retournent du HTML simple :

### 1. Privacy Policy (`/privacy`)
### 2. Terms of Service (`/terms`)
### 3. Data Deletion (`/data-deletion`)

Ces pages peuvent être simples pour commencer, Facebook vérifie juste qu'elles existent.