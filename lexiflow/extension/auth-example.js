// Exemple d'utilisation de l'authentification et des flashcards
// Copie ces exemples dans la console de la popup pour tester

// 1. INSCRIPTION
async function testRegister() {
  try {
    const result = await authAPI.register(
      'Test User',
      'test@example.com',
      'password123'
    );
    console.log('✅ Inscription réussie:', result);
  } catch (error) {
    console.error('❌ Erreur inscription:', error.message);
  }
}

// 2. CONNEXION
async function testLogin() {
  try {
    const result = await authAPI.login(
      'test@example.com',
      'password123'
    );
    console.log('✅ Connexion réussie:', result);
  } catch (error) {
    console.error('❌ Erreur connexion:', error.message);
  }
}

// 3. SAUVEGARDER UNE FLASHCARD
async function testSaveFlashcard() {
  try {
    const result = await flashcardSync.save({
      originalText: 'Hello',
      translatedText: 'Bonjour',
      sourceLanguage: 'en',
      targetLanguage: 'fr',
      context: 'Greeting',
      difficulty: 'easy'
    });
    
    if (result.success) {
      console.log('✅ Flashcard sauvegardée:', result.data);
    } else {
      console.log('❌ Échec:', result.reason, result.error);
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// 4. CHARGER TOUTES LES FLASHCARDS
async function testLoadFlashcards() {
  try {
    const result = await flashcardSync.load();
    
    if (result.success) {
      console.log('✅ Flashcards chargées:', result.data);
    } else {
      console.log('❌ Échec:', result.reason);
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// 5. SYNCHRONISER LES FLASHCARDS LOCALES
async function testSyncLocal() {
  try {
    const result = await flashcardSync.syncAll();
    
    if (result.success) {
      console.log(`✅ Synchronisation: ${result.synced}/${result.total} flashcards`);
    } else {
      console.log('❌ Échec:', result.reason);
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// 6. VÉRIFIER LE TOKEN
async function checkAuth() {
  const token = await authAPI.getToken();
  const user = await authAPI.getCurrentUser();
  
  console.log('Token:', token ? '✅ Présent' : '❌ Absent');
  console.log('Utilisateur:', user);
  
  if (token) {
    const isValid = await authAPI.verifyToken();
    console.log('Token valide:', isValid ? '✅ Oui' : '❌ Non');
  }
}

// 7. SE DÉCONNECTER
async function testLogout() {
  await authAPI.logout();
  console.log('✅ Déconnecté');
}

// INSTRUCTIONS
console.log(`
🧪 EXEMPLES DE TEST - LexiFlow Backend Integration

1️⃣ testRegister() - Créer un compte
2️⃣ testLogin() - Se connecter
3️⃣ testSaveFlashcard() - Sauvegarder une flashcard
4️⃣ testLoadFlashcards() - Charger les flashcards
5️⃣ testSyncLocal() - Synchroniser les flashcards locales
6️⃣ checkAuth() - Vérifier l'authentification
7️⃣ testLogout() - Se déconnecter

Commencez par testRegister() ou testLogin()
`);