// Script de test pour vérifier que les flashcards ne disparaissent plus
// À exécuter dans la console du popup de l'extension

console.log('🧪 Test de création de flashcard...');

// 1. Afficher l'état actuel
console.log('📚 Flashcards actuelles:', flashcards.length);
console.log('Flashcards:', flashcards);

// 2. Simuler l'ajout d'une flashcard
const testFlashcard = {
  original: 'Test ' + Date.now(),
  translated: 'Test traduit ' + Date.now(),
  language: 'fr'
};

console.log('➕ Ajout de la flashcard test:', testFlashcard);

// 3. Observer ce qui se passe
const originalLength = flashcards.length;

// Créer la flashcard
createFlashcardFromHistory(testFlashcard.original, testFlashcard.translated, testFlashcard.language)
  .then(() => {
    console.log('✅ Flashcard créée');
    
    // Vérifier après 1 seconde
    setTimeout(() => {
      console.log('📊 Vérification après 1s:');
      console.log('- Nombre de flashcards:', flashcards.length);
      console.log('- Devrait être:', originalLength + 1);
      console.log('- État correct:', flashcards.length === originalLength + 1 ? '✅' : '❌');
      
      // Vérifier le localStorage
      const localStorageCards = JSON.parse(localStorage.getItem('flashcards') || '[]');
      console.log('- localStorage:', localStorageCards.length);
      console.log('- localStorage correct:', localStorageCards.length === originalLength + 1 ? '✅' : '❌');
    }, 1000);
    
    // Vérifier après 6 secondes (après le setInterval de 5s)
    setTimeout(() => {
      console.log('\n📊 Vérification après 6s (après le refresh automatique):');
      console.log('- Nombre de flashcards:', flashcards.length);
      console.log('- Devrait être:', originalLength + 1);
      console.log('- État correct:', flashcards.length === originalLength + 1 ? '✅' : '❌');
      
      if (flashcards.length !== originalLength + 1) {
        console.error('❌ PROBLÈME: Les flashcards ont disparu après le refresh!');
      } else {
        console.log('✅ SUCCÈS: Les flashcards sont préservées!');
      }
    }, 6000);
  })
  .catch(error => {
    console.error('❌ Erreur lors de la création:', error);
  });

// 4. Monitorer les changements
console.log('👀 Surveillance des changements activée...');
let lastCount = flashcards.length;
const monitor = setInterval(() => {
  if (flashcards.length !== lastCount) {
    console.warn('⚠️ Changement détecté:', lastCount, '→', flashcards.length);
    lastCount = flashcards.length;
  }
}, 500);

// Arrêter le monitoring après 10 secondes
setTimeout(() => {
  clearInterval(monitor);
  console.log('🛑 Surveillance terminée');
}, 10000);