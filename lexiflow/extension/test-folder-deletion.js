// Test pour vérifier le comportement après suppression de dossier
// Ce fichier peut être exécuté dans la console du popup pour tester

async function testFolderDeletion() {
  console.log('🧪 Test de suppression et recréation de dossier');
  
  // 1. Afficher l'état initial
  console.log('📊 État initial:');
  console.log('- Nombre de flashcards:', flashcards.length);
  console.log('- Dossiers existants:', Object.keys(groupFlashcardsByLanguages()));
  
  // 2. Identifier un dossier de test
  const testFolderKey = 'en_fr'; // Anglais → Français
  const cardsInFolder = flashcards.filter(card => {
    const fromLang = card.sourceLanguage || detectLanguage(card.front);
    const toLang = card.language;
    return `${fromLang}_${toLang}` === testFolderKey;
  });
  
  console.log(`\n📁 Dossier de test: ${testFolderKey}`);
  console.log(`- Cartes dans le dossier: ${cardsInFolder.length}`);
  
  if (cardsInFolder.length === 0) {
    console.log('⚠️ Aucune carte dans ce dossier. Créez d\'abord des flashcards EN→FR');
    return;
  }
  
  // 3. Simuler la suppression
  console.log('\n🗑️ Simulation de suppression du dossier...');
  const beforeCount = flashcards.length;
  
  // Supprimer les cartes localement (simulation)
  const remainingCards = flashcards.filter(card => {
    const fromLang = card.sourceLanguage || detectLanguage(card.front);
    const toLang = card.language;
    return `${fromLang}_${toLang}` !== testFolderKey;
  });
  
  console.log(`✅ Suppression simulée: ${beforeCount - remainingCards.length} cartes supprimées`);
  
  // 4. Tester l'ajout d'une nouvelle carte
  console.log('\n➕ Test d\'ajout d\'une nouvelle carte au même dossier...');
  
  const testCard = {
    originalText: 'Test word',
    translatedText: 'Mot de test',
    sourceLanguage: 'en',
    targetLanguage: 'fr'
  };
  
  console.log('- Nouvelle carte:', testCard);
  console.log('- Le dossier devrait être recréé automatiquement');
  
  // 5. Vérifier chrome.storage.sync
  chrome.storage.sync.get(['deletedFolders'], (result) => {
    console.log('\n🔍 Vérification chrome.storage.sync:');
    console.log('- deletedFolders:', result.deletedFolders || 'undefined (nettoyé)');
    
    if (result.deletedFolders) {
      console.log('⚠️ Les données de dossiers supprimés existent encore!');
    } else {
      console.log('✅ Les données de dossiers supprimés ont été nettoyées');
    }
  });
  
  console.log('\n✅ Test terminé. Vérifiez manuellement:');
  console.log('1. Supprimez un dossier de flashcards');
  console.log('2. Ajoutez une nouvelle flashcard de la même langue');
  console.log('3. Le dossier devrait être recréé avec la nouvelle carte');
}

// Fonction utilitaire pour grouper les flashcards
function groupFlashcardsByLanguages() {
  const grouped = {};
  flashcards.forEach(card => {
    const fromLang = card.sourceLanguage || detectLanguage(card.front);
    const toLang = card.language;
    const key = `${fromLang}_${toLang}`;
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(card);
  });
  return grouped;
}

// Exécuter le test
console.log('🚀 Pour lancer le test, exécutez: testFolderDeletion()');