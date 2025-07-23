# Problème : Toutes les flashcards vont dans "en_fr"

## Cause identifiée

Le backend ne stocke pas et ne retourne pas le champ `language` (langue cible) !

### Ce qui se passe :
1. L'extension envoie : `{ front, back, sourceLanguage, language, category, difficulty }`
2. Le backend stocke : `{ front, back, sourceLanguage, category, difficulty }` (pas de `language`)
3. Le backend retourne : une flashcard SANS le champ `language`
4. popup.js utilise 'fr' par défaut si `language` est absent

### Résultat :
- Toutes les flashcards ont `targetLanguage: 'fr'` par défaut
- Combiné avec `sourceLanguage` qui est souvent 'en' (détection par défaut), on obtient "en_fr"

## Solution appliquée côté client

1. **Amélioration de la détection de langue source** :
   - Utilisation de la détection locale si Google Translate échoue
   - Le bouton Flashcard utilise maintenant la détection locale si nécessaire

2. **Debug ajouté** :
   - Log de la première flashcard retournée par le serveur pour vérifier les champs

## Solution requise côté serveur

Le backend doit être déployé avec les changements du commit `efe30fd` qui ajoute :
- Le champ `language` dans le modèle
- La migration pour ajouter la colonne
- Les routes mises à jour pour accepter/retourner `language`

## Vérification

Après le déploiement du backend, vérifier dans les logs :
```
🔍 Première flashcard du serveur: { ... language: 'es' ... }
```

Si `language` n'apparaît pas, le backend n'est pas à jour.