// Variables globales
let userSettings = {};
let translations = [];
let flashcards = [];
let isAddingFlashcard = false; // Flag pour éviter les conflits lors de l'ajout
let flashcardsBackup = []; // Backup pour éviter la perte de données
let lastAuthCheck = 0; // Pour éviter de vérifier l'auth trop souvent
let oauthTimeoutId = null; // Pour stocker le timeout OAuth
let isFlippingCard = false; // Pour éviter le rafraîchissement lors du flip
let updateHistoryDebounce = null; // Pour éviter les rafraîchissements multiples
let updateFlashcardsDebounce = null; // Pour éviter les rafraîchissements multiples

// Générateur d'UUID simple pour les flashcards
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Charger les flashcards uniquement depuis le serveur
async function loadFlashcardsFromServer() {
  try {
    const token = await authAPI.getToken();
    if (!token) {
      console.log('Utilisateur non connecté, pas de chargement des flashcards');
      // Ne pas vider les flashcards, l'utilisateur pourrait se connecter plus tard
      return;
    }

    console.log('🔄 Chargement des flashcards depuis le serveur...');
    const response = await flashcardsAPI.getAll();
    
    if (response && response.flashcards && Array.isArray(response.flashcards)) {
      console.log(`☁️ ${response.flashcards.length} flashcards du serveur`);
      // Debug: voir ce que le serveur retourne
      if (response.flashcards.length > 0) {
        console.log('🔍 Première flashcard du serveur:', response.flashcards[0]);
      }
      
      // Convertir les flashcards du serveur au format attendu par l'UI
      flashcards = response.flashcards.map(card => {
        // Utiliser detectLanguage si sourceLanguage est manquant
        const sourceLang = card.sourceLanguage || detectLanguage(card.front);
        const targetLang = card.language || userSettings?.targetLanguage || 'fr';
        
        console.log(`📝 Flashcard: "${card.front}" - source: ${sourceLang}, target: ${targetLang}`);
        
        return {
          id: card.id,
          front: card.front,
          back: card.back,
          text: card.front, // Pour compatibilité
          translation: card.back, // Pour compatibilité
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          language: targetLang,
          category: card.category || 'General',
          difficulty: card.difficulty || 0,
          created: card.createdAt,
          lastModified: card.updatedAt,
          reviewCount: card.reviewCount || 0,
          lastReviewed: card.lastReviewed,
          nextReview: card.nextReview,
          successRate: card.successRate || 0,
          folder: card.category || 'default',
          synced: true,
          syncedWithServer: true
        };
      });
      
      console.log(`✅ ${flashcards.length} flashcards chargées`);
    } else {
      console.log('ℹ️ Aucune flashcard sur le serveur');
      flashcards = [];
    }
    
    updateFlashcards();
    updateStats();
    
  } catch (error) {
    console.error('❌ Erreur lors du chargement des flashcards:', error);
    showNotification('Erreur de chargement des flashcards', 'error');
    flashcards = [];
    updateFlashcards();
    updateStats();
  }
}
let flashcardFolders = {
  default: { name: 'Uncategorized', icon: '📁' },
  favorites: { name: 'Favorites', icon: '⭐' },
  difficult: { name: 'Difficult', icon: '🔥' },
  learned: { name: 'Mastered', icon: '✅' }
};
let practiceMode = {
  active: false,
  cards: [],
  currentIndex: 0,
  score: { correct: 0, incorrect: 0 },
  startTime: null
};

// Fonction pour basculer un dossier
function toggleFolder(key) {
  console.log('toggleFolder appelé avec key:', key);
  const folder = document.querySelector(`.language-folder[data-key="${key}"]`);
  if (!folder) {
    console.error('Dossier non trouvé:', key);
    return;
  }
  
  const content = document.getElementById(`folder-content-${key}`);
  const arrow = folder.querySelector('.folder-arrow');
  
  if (!content) {
    console.error('Contenu non trouvé:', `folder-content-${key}`);
    return;
  }
  
  const isExpanded = folder.classList.contains('expanded');
  
  if (isExpanded) {
    folder.classList.remove('expanded');
    content.style.maxHeight = '0';
    content.style.overflow = 'hidden';
    if (arrow) arrow.style.transform = 'rotate(0deg)';
  } else {
    folder.classList.add('expanded');
    content.style.display = 'block';
    // Forcer le reflow pour que maxHeight fonctionne
    content.offsetHeight;
    const height = content.scrollHeight;
    content.style.maxHeight = height + 'px';
    content.style.overflow = 'visible';
    if (arrow) arrow.style.transform = 'rotate(90deg)';
  }
}

// Fonction pour échanger les langues
function swapLanguages(key, currentDirection) {
  console.log('swapLanguages appelé:', key, currentDirection);
  const [fromLang, toLang] = currentDirection.split('_');
  const newDirection = `${toLang}_${fromLang}`;
  
  // Sauvegarder la nouvelle direction
  const savedDirections = JSON.parse(localStorage.getItem('folderDirections') || '{}');
  savedDirections[key] = newDirection;
  localStorage.setItem('folderDirections', JSON.stringify(savedDirections));
  
  // Mettre à jour l'affichage
  const folderLangs = document.getElementById(`folder-langs-${key}`);
  if (folderLangs) {
    folderLangs.innerHTML = `
      <span>${getFlagEmoji(toLang)} ${getLanguageName(toLang)}</span>
      <span>→</span>
      <span>${getFlagEmoji(fromLang)} ${getLanguageName(fromLang)}</span>
      <button class="folder-swap js-swap-btn" data-key="${key}" data-direction="${newDirection}" style="background: #3b82f6; color: white;">
        ↔️
      </button>
    `;
  }
  
  // Mettre à jour le data-direction du dossier
  const folder = document.querySelector(`.language-folder[data-key="${key}"]`);
  if (folder) {
    folder.dataset.direction = newDirection;
  }
  
  // Recharger le contenu
  const folderItems = document.getElementById(`folder-items-${key}`);
  if (folderItems) {
    const group = translations.filter(t => {
      const langs = [t.fromLang, t.toLang].sort();
      return `${langs[0]}_${langs[1]}` === key;
    });
    
    folderItems.innerHTML = renderFolderTranslations(group, toLang, fromLang);
  }
}

// Menu contextuel pour les dossiers
function showFolderMenu(event, key, type) {
  event.stopPropagation();
  
  // Supprimer les menus existants
  document.querySelectorAll('.folder-menu').forEach(m => m.remove());
  
  const menu = document.createElement('div');
  menu.className = 'folder-menu';
  menu.style.cssText = `
    position: absolute;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    padding: 8px 0;
    z-index: 1000;
    min-width: 150px;
  `;
  
  // Positionner le menu
  const rect = event.target.getBoundingClientRect();
  menu.style.left = `${rect.left}px`;
  menu.style.top = `${rect.bottom + 5}px`;
  
  // Options du menu
  if (type === 'history') {
    menu.innerHTML = `
      <div class="menu-item js-delete-folder" data-key="${key}" style="padding: 8px 16px; cursor: pointer; transition: background 0.2s;">
        <span style="margin-right: 8px;">🗑️</span>
        Delete this folder
      </div>
    `;
  } else if (type === 'flashcards') {
    menu.innerHTML = `
      <div class="menu-item js-delete-flashcard-folder" data-key="${key}" style="padding: 8px 16px; cursor: pointer; transition: background 0.2s;">
        <span style="margin-right: 8px;">🗑️</span>
        Delete this folder
      </div>
      <div class="menu-item js-practice-folder" data-key="${key}" style="padding: 8px 16px; cursor: pointer; transition: background 0.2s;">
        <span style="margin-right: 8px;">🎮</span>
        Practice this folder
      </div>
    `;
  }
  
  document.body.appendChild(menu);
  
  // Attacher les event listeners
  menu.addEventListener('click', (e) => {
    const item = e.target.closest('.menu-item');
    if (!item) return;
    
    if (item.classList.contains('js-delete-folder')) {
      deleteHistoryFolder(item.dataset.key);
    } else if (item.classList.contains('js-delete-flashcard-folder')) {
      deleteFlashcardFolder(item.dataset.key);
    } else if (item.classList.contains('js-practice-folder')) {
      practiceFolder(item.dataset.key);
    }
    
    menu.remove();
  });
  
  // Fermer le menu en cliquant ailleurs
  setTimeout(() => {
    document.addEventListener('click', function closeMenu() {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }, { once: true });
  }, 100);
}

// Fonctions pour gérer les actions du menu
function deleteHistoryFolder(key) {
  const count = translations.filter(t => {
    const langs = [t.fromLang, t.toLang].sort();
    return `${langs[0]}_${langs[1]}` === key;
  }).length;
  
  if (!confirm(`Delete ${count} translations from this folder?`)) return;
  
  translations = translations.filter(t => {
    const langs = [t.fromLang, t.toLang].sort();
    return `${langs[0]}_${langs[1]}` !== key;
  });
  
  chrome.storage.local.set({ translations }, () => {
    updateHistory();
    updateStats();
    showNotification('Folder deleted', 'info');
  });
}

async function deleteFlashcardFolder(key) {
  const cards = flashcards.filter(card => {
    const fromLang = card.sourceLanguage && card.sourceLanguage !== 'auto' ? card.sourceLanguage : detectLanguage(card.front);
    const toLang = card.language;
    // Pas de tri - utiliser l'ordre source->cible
    return `${fromLang}_${toLang}` === key;
  });
  
  if (!confirm(`Delete ${cards.length} flashcards from this folder?`)) return;
  
  // Supprimer sur le serveur si connecté
  const token = await authAPI.getToken();
  if (token) {
    try {
      // Supprimer toutes les cartes du dossier qui ont un serverId
      const deletePromises = cards
        .filter(card => card.serverId)
        .map(card => 
          fetch(`${API_BASE_URL}/flashcards/${card.serverId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        );
      
      await Promise.allSettled(deletePromises);
    } catch (error) {
      console.error('Erreur lors de la suppression sur le serveur:', error);
      // Continuer même si l'erreur serveur
    }
  }
  
  // Supprimer localement
  flashcards = flashcards.filter(card => {
    const fromLang = card.sourceLanguage && card.sourceLanguage !== 'auto' ? card.sourceLanguage : detectLanguage(card.front);
    const toLang = card.language;
    // Pas de tri - utiliser l'ordre source->cible
    return `${fromLang}_${toLang}` !== key;
  });
  
  await saveFlashcards();
  updateFlashcards();
  updateStats();
  showNotification('Flashcards folder deleted', 'info');
}

function practiceFolder(key) {
  const cards = flashcards.filter(card => {
    const fromLang = card.sourceLanguage && card.sourceLanguage !== 'auto' ? card.sourceLanguage : detectLanguage(card.front);
    const toLang = card.language;
    // Pas de tri - utiliser l'ordre source->cible
    return `${fromLang}_${toLang}` === key;
  });
  
  if (cards.length === 0) {
    showNotification('No flashcards in this folder!', 'warning');
    return;
  }
  
  practiceMode = {
    active: true,
    cards: cards.sort(() => Math.random() - 0.5),
    currentIndex: 0,
    score: { correct: 0, incorrect: 0 },
    startTime: Date.now()
  };
  
  switchTab('flashcards');
  displayPracticeMode();
}

function exportFolderData(key, type) {
  let data = {};
  
  if (type === 'history') {
    data.translations = translations.filter(t => {
      const langs = [t.fromLang, t.toLang].sort();
      return `${langs[0]}_${langs[1]}` === key;
    });
  } else if (type === 'flashcards') {
    data.flashcards = flashcards.filter(card => {
      const fromLang = card.sourceLanguage && card.sourceLanguage !== 'auto' ? card.sourceLanguage : detectLanguage(card.front);
      const toLang = card.language;
      // Pas de tri - utiliser l'ordre source->cible
      return `${fromLang}_${toLang}` === key;
    });
  }
  
  data.exportDate = new Date().toISOString();
  data.folderKey = key;
  data.type = type;
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `quick-translator-${type}-${key}-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  showNotification('Folder exported successfully!', 'success');
}

function toggleFlashcardFolder(key) {
  console.log('toggleFlashcardFolder appelé avec key:', key);
  const folder = document.querySelector(`.flashcard-language-folder[data-key="${key}"]`);
  if (!folder) {
    console.error('Flashcard folder not found:', key);
    return;
  }
  
  const content = document.getElementById(`flashcard-folder-content-${key}`);
  const arrow = folder.querySelector('.folder-arrow');
  
  if (!content) {
    console.error('Flashcard content not found:', `flashcard-folder-content-${key}`);
    return;
  }
  
  const isExpanded = folder.classList.contains('expanded');
  
  if (isExpanded) {
    folder.classList.remove('expanded');
    content.style.maxHeight = '0';
    content.style.overflow = 'hidden';
    if (arrow) arrow.style.transform = 'rotate(0deg)';
  } else {
    folder.classList.add('expanded');
    content.style.display = 'block';
    // Forcer le reflow
    content.offsetHeight;
    const height = content.scrollHeight;
    content.style.maxHeight = height + 'px';
    content.style.overflow = 'visible';
    if (arrow) arrow.style.transform = 'rotate(90deg)';
  }
}

function swapFlashcardLanguages(key, currentDirection) {
  console.log('swapFlashcardLanguages appelé:', key, currentDirection);
  const [fromLang, toLang] = currentDirection.split('_');
  const newDirection = `${toLang}_${fromLang}`;
  
  // Sauvegarder la nouvelle direction
  const savedDirections = JSON.parse(localStorage.getItem('flashcardDirections') || '{}');
  savedDirections[key] = newDirection;
  localStorage.setItem('flashcardDirections', JSON.stringify(savedDirections));
  
  // Mettre à jour l'affichage
  const folderLangs = document.getElementById(`flashcard-folder-langs-${key}`);
  if (folderLangs) {
    folderLangs.innerHTML = `
      <span>${getFlagEmoji(toLang)} ${getLanguageName(toLang)}</span>
      <span>→</span>
      <span>${getFlagEmoji(fromLang)} ${getLanguageName(fromLang)}</span>
      <button class="folder-swap flashcard-swap js-flashcard-swap" data-key="${key}" data-direction="${newDirection}" style="background: #3b82f6; color: white;">
        ↔️
      </button>
    `;
  }
  
  // Mettre à jour le data-direction du dossier
  const folder = document.querySelector(`.flashcard-language-folder[data-key="${key}"]`);
  if (folder) {
    folder.dataset.direction = newDirection;
  }
  
  // Recharger le contenu
  const grid = document.getElementById(`flashcard-grid-${key}`);
  if (grid) {
    const cards = flashcards.map(card => ({
      ...card,
      fromLang: card.sourceLanguage && card.sourceLanguage !== 'auto' ? card.sourceLanguage : detectLanguage(card.front),
      toLang: card.language
    })).filter(card => {
      // Pas de tri - utiliser l'ordre source->cible
      return `${card.fromLang}_${card.toLang}` === key;
    });
    
    grid.innerHTML = renderFlashcards(cards, toLang, fromLang);
  }
}

function flipCard(cardId) {
  console.log('flipCard appelé avec cardId:', cardId);
  
  // Ne pas parser en int car les IDs sont maintenant des UUIDs
  const card = flashcards.find(c => c.id === cardId || c.id === parseInt(cardId));
  if (!card) {
    console.error('Carte non trouvée:', cardId);
    return;
  }
  
  const front = document.getElementById(`front-${cardId}`);
  const back = document.getElementById(`back-${cardId}`);
  const cardEl = document.querySelector(`[data-id="${cardId}"]`);
  
  if (!front || !back) {
    console.error('Éléments front/back non trouvés:', { front, back });
    return;
  }
  
  if (front.style.display === 'none') {
    // Retourner vers l'avant
    front.style.display = 'block';
    back.style.display = 'none';
    if (cardEl) cardEl.classList.remove('flipped');
  } else {
    // Retourner vers l'arrière
    front.style.display = 'none';
    back.style.display = 'block';
    if (cardEl) cardEl.classList.add('flipped');
    
    // Mettre à jour les statistiques de révision
    card.reviews = (card.reviews || 0) + 1;
    card.lastReview = new Date().toISOString();
    
    // Marquer qu'on est en train de flip une carte
    isFlippingCard = true;
    saveFlashcards();
    // Réinitialiser le flag après un court délai
    setTimeout(() => { isFlippingCard = false; }, 100);
  }
}

function moveToFolder(cardId, folderId) {
  const card = flashcards.find(c => c.id === parseInt(cardId));
  if (!card) return;
  
  card.folder = folderId;
  
  // Mettre à jour la difficulté selon le dossier
  if (folderId === 'difficult') {
    card.difficulty = 'hard';
  } else if (folderId === 'learned') {
    card.difficulty = 'easy';
  }
  
  saveFlashcards();
  updateFlashcards();
  
  // Feedback visuel
  showNotification(`Carte déplacée vers ${flashcardFolders[folderId].name}`, 'success');
}

async function deleteFlashcard(cardId) {
  if (!confirm('Delete this flashcard?')) return;
  
  const cardIdInt = parseInt(cardId);
  const cardToDelete = flashcards.find(c => c.id === cardIdInt);
  
  // Supprimer sur le serveur si connecté et si la carte a un serverId
  const token = await authAPI.getToken();
  if (token && cardToDelete && cardToDelete.serverId) {
    try {
      await fetch(`${API_BASE_URL}/flashcards/${cardToDelete.serverId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Erreur lors de la suppression sur le serveur:', error);
      // Continuer même si l'erreur serveur
    }
  }
  
  // Supprimer localement
  flashcards = flashcards.filter(c => c.id !== cardIdInt);
  
  // Les flashcards sont maintenant uniquement sur le serveur, pas besoin de nettoyer le localStorage
  
  await saveFlashcards();
  updateFlashcards();
  updateStats();
  
  showNotification('Flashcard deleted', 'info');
}

function showFlashcardTips() {
  alert(`💡 Tips for using flashcards:

1. 📝 Create flashcards after each important translation
2. 🎯 Practice regularly with Practice Mode
3. ⭐ Mark your favorite cards to review them more often
4. 🔥 Difficult cards will be prioritized in practice
5. ✅ Mastered cards will appear less often

Tip: Use folders to organize your cards by theme!`);
}

function startPracticeMode() {
  if (flashcards.length === 0) {
    showNotification('No flashcards available for practice!', 'warning');
    return;
  }
  
  // Afficher la sélection de langue
  const container = document.getElementById('flashcardsList');
  if (!container) return;
  
  // Obtenir toutes les langues disponibles
  const languages = new Set();
  flashcards.forEach(card => {
    languages.add(card.language);
    const sourceLang = card.sourceLanguage && card.sourceLanguage !== 'auto' 
      ? card.sourceLanguage 
      : detectLanguage(card.front);
    languages.add(sourceLang);
  });
  
  container.innerHTML = `
    <div class="practice-setup">
      <h2 style="text-align: center; margin-bottom: 24px;">🎮 Configuration du Mode Pratique</h2>
      
      <div style="background: var(--gray-50); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
        <h3 style="font-size: 16px; margin-bottom: 16px;">Sélectionnez les langues à pratiquer:</h3>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
          ${Array.from(languages).map(lang => `
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 12px; background: white; border: 2px solid var(--gray-200); border-radius: 8px; transition: all 0.2s;">
              <input type="checkbox" value="${lang}" checked style="cursor: pointer;">
              <span>${getFlagEmoji(lang)} ${getLanguageName(lang)}</span>
            </label>
          `).join('')}
        </div>
      </div>
      
      <div style="background: var(--gray-50); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
        <h3 style="font-size: 16px; margin-bottom: 16px;">Options de pratique:</h3>
        
        <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <input type="checkbox" id="practiceRandom" checked>
          <span>Ordre aléatoire des cartes</span>
        </label>
        
        <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <input type="checkbox" id="practiceDifficult" checked>
          <span>Priorité aux cartes difficiles</span>
        </label>
        
        <label style="display: flex; align-items: center; gap: 8px;">
          <input type="number" id="practiceLimit" value="20" min="5" max="50" style="width: 60px; padding: 4px 8px; border: 1px solid var(--gray-300); border-radius: 4px;">
          <span>Nombre de cartes (max)</span>
        </label>
      </div>
      
      <div style="text-align: center;">
        <button class="btn btn-primary btn-lg js-launch-practice" style="min-width: 200px;">
          🚀 Commencer la pratique
        </button>
        <button class="btn btn-secondary js-cancel-practice" style="margin-left: 12px;">
          Annuler
        </button>
      </div>
    </div>
  `;
  
  // Attacher les event listeners
  container.querySelector('.js-launch-practice').addEventListener('click', launchPractice);
  container.querySelector('.js-cancel-practice').addEventListener('click', updateFlashcards);
}

function launchPractice() {
  const selectedLangs = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
    .filter(cb => cb.value && cb.value !== 'on')
    .map(cb => cb.value);
  
  if (selectedLangs.length === 0) {
    showNotification('Sélectionnez au moins une langue!', 'warning');
    return;
  }
  
  const randomOrder = document.getElementById('practiceRandom')?.checked ?? true;
  const prioritizeDifficult = document.getElementById('practiceDifficult')?.checked ?? true;
  const limit = parseInt(document.getElementById('practiceLimit')?.value || '20');
  
  // Filtrer les cartes par langue
  let practiceCards = flashcards.filter(card => {
    const sourceLang = card.sourceLanguage && card.sourceLanguage !== 'auto' 
      ? card.sourceLanguage 
      : detectLanguage(card.front);
    return selectedLangs.includes(card.language) || selectedLangs.includes(sourceLang);
  });
  
  if (practiceCards.length === 0) {
    showNotification('Aucune carte pour les langues sélectionnées!', 'warning');
    return;
  }
  
  // Trier par priorité si demandé
  if (prioritizeDifficult) {
    practiceCards.sort((a, b) => {
      if (a.difficulty === 'hard' && b.difficulty !== 'hard') return -1;
      if (b.difficulty === 'hard' && a.difficulty !== 'hard') return 1;
      if (!a.lastReview && b.lastReview) return -1;
      if (!b.lastReview && a.lastReview) return 1;
      if (a.lastReview && b.lastReview) {
        return new Date(a.lastReview) - new Date(b.lastReview);
      }
      return 0;
    });
  }
  
  // Limiter le nombre et mélanger si demandé
  practiceCards = practiceCards.slice(0, limit);
  if (randomOrder) {
    practiceCards = practiceCards.sort(() => Math.random() - 0.5);
  }
  
  practiceMode = {
    active: true,
    cards: practiceCards,
    currentIndex: 0,
    score: { correct: 0, incorrect: 0 },
    startTime: Date.now()
  };
  
  displayPracticeMode();
}

function checkAnswer() {
  const input = document.getElementById('practiceAnswer');
  const resultDiv = document.getElementById('practiceResult');
  const checkBtn = document.getElementById('checkBtn');
  
  if (!input || !resultDiv || !checkBtn) return;
  
  const userAnswer = normalizeAnswer(input.value.trim());
  const currentCard = practiceMode.cards[practiceMode.currentIndex];
  const correctAnswer = normalizeAnswer(currentCard.back);
  
  // Vérification plus flexible
  const isCorrect = checkAnswerSimilarity(userAnswer, correctAnswer);
  
  if (isCorrect) {
    practiceMode.score.correct++;
    resultDiv.className = 'practice-result correct';
    resultDiv.innerHTML = `
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 4px;">✅ Correct!</div>
      <div>Excellente réponse!</div>
    `;
    
    // Mettre à jour la difficulté de la carte
    if (currentCard.difficulty === 'hard') {
      currentCard.difficulty = 'normal';
    } else if (currentCard.difficulty === 'normal') {
      currentCard.difficulty = 'easy';
    }
  } else {
    practiceMode.score.incorrect++;
    resultDiv.className = 'practice-result incorrect';
    resultDiv.innerHTML = `
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 4px;">❌ Incorrect</div>
      <div>Réponse correcte: <strong>"${currentCard.back}"</strong></div>
      ${userAnswer ? `<div style="margin-top: 4px;">Votre réponse: "${input.value}"</div>` : ''}
    `;
    
    // Augmenter la difficulté si nécessaire
    if (currentCard.difficulty !== 'hard') {
      currentCard.difficulty = currentCard.difficulty === 'easy' ? 'normal' : 'hard';
    }
  }
  
  resultDiv.style.display = 'block';
  input.disabled = true;
  checkBtn.textContent = 'Suivant →';
  checkBtn.onclick = nextQuestion;
  
  // Mettre à jour les statistiques de la carte
  currentCard.lastReview = new Date().toISOString();
  currentCard.reviews = (currentCard.reviews || 0) + 1;
  saveFlashcards();
}

function showHint() {
  const currentCard = practiceMode.cards[practiceMode.currentIndex];
  const hint = currentCard.back.substring(0, Math.ceil(currentCard.back.length / 3)) + '...';
  
  showNotification(`Indice: "${hint}"`, 'info');
}

function skipQuestion() {
  practiceMode.score.incorrect++;
  nextQuestion();
}

function nextQuestion() {
  practiceMode.currentIndex++;
  
  if (practiceMode.currentIndex >= practiceMode.cards.length) {
    showPracticeResults();
  } else {
    displayPracticeMode();
  }
}

function quitPractice() {
  practiceMode.active = false;
  updateFlashcards();
}

function copyTranslation(text) {
  navigator.clipboard.writeText(text).then(() => {
    showNotification('Translation copied!', 'success');
  }).catch(() => {
    showNotification('Erreur lors de la copie', 'error');
  });
}

async function createFlashcardFromHistory(original, translated, language, sourceLanguage = null) {
  // Vérifier si l'utilisateur est connecté
  const token = await authAPI.getToken();
  if (!token) {
    showNotification('Veuillez vous connecter pour créer des flashcards', 'warning');
    return;
  }
  
  // Vérifier les limites pour les utilisateurs gratuits
  if (!checkLimits('flashcard')) return;
  
  // Définir le flag pour éviter les conflits
  isAddingFlashcard = true;
  
  // Vérifier si elle existe déjà côté client
  const exists = flashcards.some(f => 
    (f.front?.toLowerCase() === original.toLowerCase() || f.text?.toLowerCase() === original.toLowerCase()) && 
    (f.back?.toLowerCase() === translated.toLowerCase() || f.translation?.toLowerCase() === translated.toLowerCase())
  );
  
  if (exists) {
    showNotification('Cette flashcard existe déjà!', 'warning');
    isAddingFlashcard = false;
    return;
  }
  
  try {
    // Envoyer directement au serveur
    const detectedSourceLang = sourceLanguage || detectLanguage(original);
    console.log('📤 Envoi de la flashcard au serveur:', {
      original,
      translated,
      sourceLanguage: detectedSourceLang,
      targetLanguage: language
    });
    const response = await flashcardsAPI.create({
      originalText: original,
      translatedText: translated,
      sourceLanguage: detectedSourceLang,
      targetLanguage: language,
      language: language, // Le backend n'accepte qu'une langue simple
      folder: 'default',
      difficulty: 'normal'
    });
    
    if (response && response.flashcard) {
      console.log('✅ Flashcard créée sur le serveur');
      
      // Recharger toutes les flashcards depuis le serveur pour éviter les duplications
      await loadFlashcardsFromServer();
      
      // Marquer qu'on est en train d'ajouter pour éviter le rafraîchissement
      isAddingFlashcard = true;
      setTimeout(() => { isAddingFlashcard = false; }, 100);
      
      updateStats();
      
      showNotification('Flashcard créée avec succès!', 'success');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
    showNotification('Erreur lors de la création de la flashcard', 'error');
    // Réinitialiser le flag en cas d'erreur
    isAddingFlashcard = false;
  }
}

function deleteTranslation(id) {
  if (!confirm('Supprimer cette traduction ?')) return;
  
  translations = translations.filter(t => t.id !== parseInt(id));
  chrome.storage.local.set({ translations }, () => {
    updateHistory();
    updateStats();
    showNotification('Translation deleted', 'info');
  });
}

// Vérifier le statut Premium
async function checkPremiumStatus() {
  // Vérifier si l'utilisateur a une clé DeepSeek valide
  if (userSettings.deepSeekEnabled && userSettings.deepSeekApiKey) {
    const isValid = await validateDeepSeekKey(userSettings.deepSeekApiKey);
    userSettings.isPro = isValid;
    
    // Mettre à jour les badges
    const proBadge = document.getElementById('proBadge');
    const deepSeekBadge = document.getElementById('deepSeekBadge');
    
    if (proBadge) proBadge.style.display = isValid ? 'flex' : 'none';
    if (deepSeekBadge) deepSeekBadge.style.display = isValid ? 'flex' : 'none';
    
    return isValid;
  }
  
  userSettings.isPro = false;
  return false;
}

// Vérifier les limites pour les utilisateurs gratuits
async function checkLimits(type = 'translation') {
  // Récupérer l'utilisateur actuel depuis le storage
  const user = await new Promise(resolve => {
    chrome.storage.local.get(['user'], result => resolve(result.user));
  });
  
  // Si pas d'utilisateur connecté, appliquer les limites gratuites
  const isPremium = user && user.subscriptionStatus === 'premium';
  
  if (isPremium) return true; // Pas de limites pour Premium
  
  if (type === 'flashcard') {
    // Limite de flashcards selon le backend
    const limit = isPremium ? 200 : 50;
    const currentCount = user ? (user.flashcardsCount || 0) : flashcards.length;
    
    if (currentCount >= limit) {
      showNotification(`Limite atteinte! ${isPremium ? '200' : '50'} flashcards max. ${!user ? 'Connectez-vous ou ' : ''}Passez à Premium pour plus!`, 'warning');
      if (!user) {
        showLoginWindow();
      } else {
        showPremiumPrompt();
      }
      return false;
    }
  } else if (type === 'translation') {
    // Limite de traductions par jour (seulement en local pour les non-connectés)
    if (!user) {
      const today = new Date().toDateString();
      const todayTranslations = translations.filter(t => 
        new Date(t.timestamp).toDateString() === today
      ).length;
      
      if (todayTranslations >= 20) {
        showNotification('Limite quotidienne atteinte! Connectez-vous pour continuer', 'warning');
        showLoginWindow();
        return false;
      }
    }
  }
  
  return true;
}

// Afficher la promotion Premium
function showPremiumPrompt() {
  const container = document.getElementById('dashboard');
  if (!container) return;
  
  const prompt = document.createElement('div');
  prompt.className = 'premium-prompt';
  prompt.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 32px;
    border-radius: 16px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.2);
    z-index: 10000;
    max-width: 400px;
    text-align: center;
  `;
  
  prompt.innerHTML = `
    <div style="font-size: 48px; margin-bottom: 16px;">🚀</div>
    <h2 style="font-size: 24px; margin-bottom: 16px;">Passez à Premium!</h2>
    <p style="margin-bottom: 24px; color: #6b7280;">
      Débloquez toutes les fonctionnalités avec DeepSeek AI
    </p>
    
    <div style="text-align: left; margin-bottom: 24px;">
      <div style="margin-bottom: 12px;">✅ Traductions illimitées</div>
      <div style="margin-bottom: 12px;">✅ Flashcards illimitées</div>
      <div style="margin-bottom: 12px;">✅ IA DeepSeek ultra-précise</div>
      <div style="margin-bottom: 12px;">✅ Statistiques avancées</div>
      <div style="margin-bottom: 12px;">✅ Support prioritaire</div>
    </div>
    
    <div style="display: flex; gap: 12px;">
      <button class="btn btn-primary btn-block js-go-to-settings">
        Activer Premium →
      </button>
      <button class="btn btn-secondary js-close-prompt">
        Plus tard
      </button>
    </div>
  `;
  
  document.body.appendChild(prompt);
  
  // Event listeners
  prompt.querySelector('.js-go-to-settings').addEventListener('click', () => {
    switchTab('settings');
    prompt.remove();
  });
  
  prompt.querySelector('.js-close-prompt').addEventListener('click', () => {
    prompt.remove();
  });
}

// Charger les données
async function loadData() {
  // Ne pas recharger si on est en train d'ajouter une flashcard
  if (isAddingFlashcard) {
    console.log('⏸️ LoadData ignoré: ajout de flashcard en cours');
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    chrome.storage.sync.get({
      targetLanguage: 'fr',
      isEnabled: true,
      buttonColor: '#3b82f6',
      isPro: false,
      enableShortcut: true,
      deepSeekEnabled: false,
      deepSeekApiKey: '',
      autoDetectSameLanguage: true,
      showConfidence: true,
      animationsEnabled: true,
      hoverTranslation: true,
      immersionMode: false,
      autoSaveToFlashcards: false
    }, async (settings) => {
      userSettings = settings;
      console.log('⚙️ Paramètres chargés:', userSettings);
      
      chrome.storage.local.get({
        translations: [],
        flashcardFolders: flashcardFolders,
        totalTranslations: 0
      }, async (data) => {
        translations = data.translations || [];
        flashcardFolders = data.flashcardFolders || flashcardFolders;
        
        // NE PLUS UTILISER LE STOCKAGE LOCAL POUR LES FLASHCARDS
        // Charger uniquement depuis le serveur
        await loadFlashcardsFromServer();
        
        console.log('📊 Données chargées:', {
          translations: translations.length,
          flashcards: flashcards.length
        });
        
        updateHistory();
        updateStats();
        resolve();
      });
    });
  });
}

// Sauvegarder les paramètres
function saveSettings() {
  chrome.storage.sync.set(userSettings, () => {
    console.log('💾 Paramètres sauvegardés');
    // Notifier le content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'updateSettings', 
          settings: userSettings 
        }).catch(() => {
          // Ignorer les erreurs si le content script n'est pas disponible
        });
      }
    });
  });
}

// Vérifier le statut DeepSeek
async function validateDeepSeekKey(apiKey) {
  if (!apiKey || apiKey.length < 20) return false;
  
  const statusEl = document.getElementById('deepSeekStatus');
  if (statusEl) {
    statusEl.className = 'deepseek-status checking';
    statusEl.innerHTML = '<span>⏳</span><span>Vérification en cours...</span>';
  }
  
  try {
    const response = await fetch('https://api.deepseek.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    const isValid = response.ok;
    
    if (statusEl) {
      if (isValid) {
        statusEl.className = 'deepseek-status active';
        statusEl.innerHTML = '<span>✅</span><span>DeepSeek AI activé et fonctionnel</span>';
      } else {
        statusEl.className = 'deepseek-status inactive';
        statusEl.innerHTML = '<span>❌</span><span>Clé API invalide ou expirée</span>';
      }
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ Erreur validation DeepSeek:', error);
    if (statusEl) {
      statusEl.className = 'deepseek-status inactive';
      statusEl.innerHTML = '<span>❌</span><span>Erreur de connexion à DeepSeek</span>';
    }
    return false;
  }
}

// Initialiser l'interface
async function initUI() {
  // Vérifier le statut Premium
  await checkPremiumStatus();
  
  // Badges
  const proBadge = document.getElementById('proBadge');
  const deepSeekBadge = document.getElementById('deepSeekBadge');
  const premiumBanner = document.getElementById('premiumBanner');
  
  if (proBadge) {
    proBadge.style.display = userSettings.isPro ? 'flex' : 'none';
  }
  
  if (deepSeekBadge) {
    deepSeekBadge.style.display = userSettings.isPro ? 'flex' : 'none';
  }
  
  if (premiumBanner) {
    premiumBanner.style.display = userSettings.isPro ? 'none' : 'block';
  }
  
  // Statistiques
  updateStats();
  
  // Paramètres
  initSettings();
  
  // Charger les contenus
  updateRecentTranslations();
  updateHistory();
  updateFlashcards();
  
  // S'assurer que l'interface est interactive même sans connexion
  enableUIInteractions();
}

// Fonction pour s'assurer que l'interface reste interactive
function enableUIInteractions() {
  // S'assurer que le bouton de connexion est TOUJOURS cliquable
  const loginButton = document.getElementById('loginButton');
  if (loginButton) {
    loginButton.classList.remove('disabled');
    loginButton.disabled = false;
    loginButton.style.pointerEvents = 'auto';
    loginButton.style.opacity = '1';
    loginButton.style.cursor = 'pointer';
    
    // Vérifier si l'utilisateur est connecté avant de définir le gestionnaire
    if (!loginButton.onclick) {
      // Si window.currentUser existe, afficher le menu utilisateur
      if (window.currentUser) {
        loginButton.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          showUserMenu(window.currentUser);
        };
      } else {
        loginButton.onclick = () => showLoginWindow();
      }
    }
  }
  
  // S'assurer que les boutons principaux sont cliquables
  const elementsToEnable = [
    'addFlashcardBtn',
    'clearHistoryBtn',
    'clearFlashcardsBtn',
    'importDataBtn',
    'exportDataBtn',
    'resetAppBtn'
  ];
  
  elementsToEnable.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.disabled = false;
      el.style.pointerEvents = 'auto';
      el.style.opacity = '1';
    }
  });
  
  // S'assurer que les onglets sont cliquables
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.style.pointerEvents = 'auto';
    tab.style.cursor = 'pointer';
  });
  
  console.log('✅ Interface activée pour utilisation hors ligne');
}

// Mettre à jour les statistiques
function updateStats() {
  const totalTranslationsEl = document.getElementById('totalTranslations');
  const totalFlashcardsEl = document.getElementById('totalFlashcards');
  
  if (totalTranslationsEl) {
    // Filtrer les traductions valides (pas même langue)
    const validTranslations = translations.filter(t => t.fromLang !== t.toLang);
    totalTranslationsEl.textContent = validTranslations.length;
  }
  
  if (totalFlashcardsEl) {
    totalFlashcardsEl.textContent = flashcards.length;
  }
}

// Initialiser les paramètres
function initSettings() {
  const targetLanguage = document.getElementById('targetLanguage');
  const buttonColor = document.getElementById('buttonColor');
  const enabledToggle = document.getElementById('enabledToggle');
  const shortcutToggle = document.getElementById('shortcutToggle');
  const smartDetectionToggle = document.getElementById('smartDetectionToggle');
  const animationsToggle = document.getElementById('animationsToggle');
  const autoSaveToggle = document.getElementById('autoSaveToggle');
  const deepSeekToggle = document.getElementById('deepSeekToggle');
  const deepSeekApiKey = document.getElementById('deepSeekApiKey');
  const deepSeekApiGroup = document.getElementById('deepSeekApiGroup');
  
  if (targetLanguage) targetLanguage.value = userSettings.targetLanguage;
  if (buttonColor) buttonColor.value = userSettings.buttonColor;
  if (enabledToggle) enabledToggle.classList.toggle('active', userSettings.isEnabled);
  if (shortcutToggle) shortcutToggle.classList.toggle('active', userSettings.enableShortcut);
  if (smartDetectionToggle) smartDetectionToggle.classList.toggle('active', userSettings.autoDetectSameLanguage);
  if (animationsToggle) animationsToggle.classList.toggle('active', userSettings.animationsEnabled);
  if (autoSaveToggle) autoSaveToggle.classList.toggle('active', userSettings.autoSaveToFlashcards);
  
  if (deepSeekToggle) {
    // Toujours désactiver DeepSeek par défaut si l'utilisateur n'est pas connecté
    deepSeekToggle.classList.remove('active');
    userSettings.deepSeekEnabled = false;
  }
  
  if (deepSeekApiKey && userSettings.deepSeekApiKey) {
    deepSeekApiKey.value = userSettings.deepSeekApiKey;
  }
  
  if (deepSeekApiGroup) {
    deepSeekApiGroup.style.display = userSettings.deepSeekEnabled ? 'block' : 'none';
  }
  
  // Vérifier le statut DeepSeek si activé
  if (userSettings.deepSeekEnabled && userSettings.deepSeekApiKey) {
    validateDeepSeekKey(userSettings.deepSeekApiKey);
  }
}

// Mettre à jour les traductions récentes
function updateRecentTranslations() {
  const container = document.getElementById('recentTranslationsList');
  if (!container) return;
  
  // Filtrer les traductions valides
  const validTranslations = translations.filter(t => t.fromLang !== t.toLang);
  const recent = validTranslations.slice(0, 5);
  
  if (recent.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-title">Aucune traduction récente</div>
        <div class="empty-state-text">
          Sélectionnez du texte sur n'importe quelle page web pour commencer
        </div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = recent.map(t => {
    const timeAgo = getTimeAgo(new Date(t.timestamp));
    
    return `
      <div class="translation-item" data-id="${t.id}">
        <div class="translation-header">
          <div class="translation-langs">
            <span>${getFlagEmoji(t.fromLang)}</span>
            <span class="lang-arrow">→</span>
            <span>${getFlagEmoji(t.toLang)}</span>
          </div>
          <div class="translation-time">${timeAgo}</div>
        </div>
        <div class="translation-content">
          <div class="translation-text translation-original">"${truncateText(t.original, 60)}"</div>
          <div class="translation-text translation-result">${truncateText(t.translated, 60)}</div>
        </div>
        <div class="translation-meta">
          <div class="translation-domain">
            <span>🌐</span>
            <span>${t.domain}</span>
          </div>
          <div class="translation-actions">
            <span class="translation-action" data-action="copyTranslation" data-text="${escapeHtml(t.translated)}">📋 Copier</span>
            <span class="translation-action" data-action="createFlashcard" data-original="${escapeHtml(t.original)}" data-translated="${escapeHtml(t.translated)}" data-lang="${t.toLang}" data-source-lang="${t.fromLang}">💾 Flashcard</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Mettre à jour l'historique avec organisation par dossiers
function updateHistory() {
  const container = document.getElementById('historyList');
  if (!container) return;
  
  // Filtrer les traductions valides
  const validTranslations = translations.filter(t => t.fromLang !== t.toLang);
  
  if (validTranslations.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📖</div>
        <div class="empty-state-title">Aucun historique disponible</div>
        <div class="empty-state-text">
          Vos traductions apparaîtront ici
        </div>
      </div>
    `;
    return;
  }
  
  // Grouper par paire de langues unique (bidirectionnel)
  const grouped = {};
  validTranslations.forEach(t => {
    const langs = [t.fromLang, t.toLang].sort();
    const key = `${langs[0]}_${langs[1]}`;
    
    if (!grouped[key]) {
      grouped[key] = {
        langs: langs,
        translations: [],
        primaryDirection: null,
        currentDirection: null
      };
    }
    
    grouped[key].translations.push(t);
    
    if (!grouped[key].primaryDirection) {
      grouped[key].primaryDirection = `${t.fromLang}_${t.toLang}`;
      grouped[key].currentDirection = `${t.fromLang}_${t.toLang}`;
    }
  });
  
  // Récupérer les directions sauvegardées
  const savedDirections = JSON.parse(localStorage.getItem('folderDirections') || '{}');
  
  let html = '';
  Object.entries(grouped).forEach(([key, group]) => {
    // Utiliser la direction sauvegardée si elle existe
    if (savedDirections[key]) {
      group.currentDirection = savedDirections[key];
    }
    
    const currentDirection = group.currentDirection || group.primaryDirection;
    const [fromLang, toLang] = currentDirection.split('_');
    const totalCount = group.translations.length;
    
    html += `
      <div class="language-folder" data-key="${key}" data-direction="${currentDirection}">
        <div class="folder-header" style="position: relative;">
          <div class="folder-info">
            <div class="folder-langs" id="folder-langs-${key}">
              <span>${getFlagEmoji(fromLang)} ${getLanguageName(fromLang)}</span>
              <span>→</span>
              <span>${getFlagEmoji(toLang)} ${getLanguageName(toLang)}</span>
              <button class="folder-swap js-swap-btn" data-key="${key}" data-direction="${currentDirection}" style="background: #3b82f6; color: white;">
                ↔️
              </button>
            </div>
            <div class="folder-count">
              ${totalCount} traductions
            </div>
          </div>
          <div class="folder-toggle">
            <button class="folder-menu-btn js-menu-btn" data-key="${key}" data-type="history" style="background: none; border: none; cursor: pointer; padding: 4px 8px; margin-right: 8px; border-radius: 4px; transition: background 0.2s;">
              ⋮
            </button>
            <span class="folder-arrow">▶</span>
          </div>
        </div>
        <div class="folder-content" id="folder-content-${key}" style="display: none; max-height: 0;">
          <div class="folder-items" id="folder-items-${key}">
            ${renderFolderTranslations(group.translations, fromLang, toLang)}
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  // Attacher les event listeners après avoir créé le HTML
  setTimeout(() => {
    // Event listeners pour ouvrir/fermer les dossiers
    container.querySelectorAll('.folder-header').forEach(header => {
      header.addEventListener('click', (e) => {
        // Ne pas déclencher si on clique sur un bouton
        if (e.target.closest('button')) return;
        
        const folder = header.closest('.language-folder');
        const key = folder.dataset.key;
        toggleFolder(key);
      });
    });
    
    // Utiliser la délégation d'événements pour les boutons
    container.addEventListener('click', (e) => {
      // Gérer les boutons swap
      if (e.target.closest('.js-swap-btn')) {
        e.stopPropagation();
        const btn = e.target.closest('.js-swap-btn');
        const key = btn.dataset.key;
        const direction = btn.dataset.direction;
        swapLanguages(key, direction);
      }
      
      // Gérer les boutons menu
      if (e.target.closest('.js-menu-btn')) {
        e.stopPropagation();
        const btn = e.target.closest('.js-menu-btn');
        const key = btn.dataset.key;
        const type = btn.dataset.type;
        showFolderMenu(e, key, type);
      }
    });
  }, 100);
}

// Rendre les traductions d'un dossier
function renderFolderTranslations(translations, fromLang, toLang) {
  // Afficher toutes les traductions, peu importe la direction
  const sorted = translations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return sorted.slice(0, 50).map(t => {
    // Déterminer si c'est une traduction inversée
    const isReversed = t.fromLang !== fromLang;
    const displayFromLang = isReversed ? t.toLang : t.fromLang;
    const displayToLang = isReversed ? t.fromLang : t.toLang;
    const displayOriginal = isReversed ? t.translated : t.original;
    const displayTranslated = isReversed ? t.original : t.translated;
    
    return `
      <div class="translation-item" data-id="${t.id}">
        <div class="translation-header">
          <div class="translation-langs">
            <span>${getFlagEmoji(displayFromLang)}</span>
            <span class="lang-arrow">→</span>
            <span>${getFlagEmoji(displayToLang)}</span>
          </div>
          <div class="translation-time">${getTimeAgo(new Date(t.timestamp))}</div>
        </div>
        <div class="translation-content">
          <div class="translation-text translation-original">"${truncateText(displayOriginal, 80)}"</div>
          <div class="translation-text translation-result">${truncateText(displayTranslated, 80)}</div>
        </div>
        <div class="translation-meta">
          <div class="translation-domain">
            <span>🌐</span>
            <span>${t.domain}</span>
          </div>
          <div class="translation-actions">
            <span class="translation-action" data-action="copyTranslation" data-text="${escapeHtml(displayTranslated)}">📋</span>
            <span class="translation-action" data-action="createFlashcard" data-original="${escapeHtml(displayOriginal)}" data-translated="${escapeHtml(displayTranslated)}" data-lang="${displayToLang}" data-source-lang="${displayFromLang}">💾</span>
            <span class="translation-action" data-action="deleteTranslation" data-id="${t.id}">🗑️</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Mettre à jour les flashcards
function updateFlashcards() {
  const container = document.getElementById('flashcardsList');
  if (!container) return;
  
  // Détecter si les flashcards ont disparu de manière inattendue
  if (flashcards.length === 0 && flashcardsBackup.length > 0) {
    console.error('⚠️ ALERTE: Les flashcards ont disparu! Backup:', flashcardsBackup.length);
    console.trace('Stack trace');
    
    // Essayer de restaurer depuis le backup
    flashcards = [...flashcardsBackup];
    console.log('🔄 Flashcards restaurées depuis le backup');
  }
  
  if (practiceMode.active) {
    displayPracticeMode();
    return;
  }
  
  if (flashcards.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎴</div>
        <div class="empty-state-title">Aucune flashcard créée</div>
        <div class="empty-state-text">
          Cliquez sur "Flashcard" après une traduction pour l'ajouter
        </div>
        <button class="btn btn-primary js-tips-btn" style="margin-top: 16px;">
          💡 Comment utiliser les flashcards
        </button>
      </div>
    `;
    
    // Attacher l'event listener
    const tipsBtn = container.querySelector('.js-tips-btn');
    if (tipsBtn) {
      tipsBtn.addEventListener('click', showFlashcardTips);
    }
    return;
  }
  
  // Grouper par paires de langues
  const grouped = {};
  flashcards.forEach(card => {
    // Support des deux formats (ancien et nouveau)
    const frontText = card.front || card.text || card.originalText;
    const backText = card.back || card.translation || card.translatedText;
    const targetLang = card.language || card.targetLanguage || 'fr';
    
    if (!frontText || !backText) return;
    
    // Utiliser sourceLanguage si disponible, sinon détecter
    const fromLang = card.sourceLanguage && card.sourceLanguage !== 'auto' 
      ? card.sourceLanguage 
      : detectLanguage(frontText);
    const toLang = targetLang;
    
    if (fromLang === toLang) return;
    
    // Ne pas trier les langues - garder l'ordre source->cible
    const key = `${fromLang}_${toLang}`;
    
    if (!grouped[key]) {
      grouped[key] = {
        langs: [fromLang, toLang],
        cards: [],
        primaryDirection: `${fromLang}_${toLang}`,
        currentDirection: `${fromLang}_${toLang}`
      };
    }
    
    // Normaliser le format de la carte
    const normalizedCard = {
      ...card,
      front: frontText,
      back: backText,
      language: targetLang,
      fromLang,
      toLang
    };
    
    grouped[key].cards.push(normalizedCard);
  });
  
  // Récupérer les directions sauvegardées
  const savedDirections = JSON.parse(localStorage.getItem('flashcardDirections') || '{}');
  
  let html = '';
  Object.entries(grouped).forEach(([key, group]) => {
    // Utiliser la direction sauvegardée si elle existe
    if (savedDirections[key]) {
      group.currentDirection = savedDirections[key];
    }
    
    const currentDirection = group.currentDirection || group.primaryDirection;
    const [fromLang, toLang] = currentDirection.split('_');
    const totalCount = group.cards.length;
    
    html += `
      <div class="language-folder flashcard-language-folder" data-key="${key}" data-direction="${currentDirection}">
        <div class="folder-header" style="position: relative;">
          <div class="folder-info">
            <div class="folder-langs" id="flashcard-folder-langs-${key}">
              <span>${getFlagEmoji(fromLang)} ${getLanguageName(fromLang)}</span>
              <span>→</span>
              <span>${getFlagEmoji(toLang)} ${getLanguageName(toLang)}</span>
              <button class="folder-swap flashcard-swap js-flashcard-swap" data-key="${key}" data-direction="${currentDirection}" style="background: #3b82f6; color: white;">
                ↔️
              </button>
            </div>
            <div class="folder-count">
              ${totalCount} flashcards
            </div>
          </div>
          <div class="folder-toggle">
            <button class="folder-menu-btn flashcard-menu-btn js-flashcard-menu" data-key="${key}" data-type="flashcards" style="background: none; border: none; cursor: pointer; padding: 4px 8px; margin-right: 8px; border-radius: 4px; transition: background 0.2s;">
              ⋮
            </button>
            <span class="folder-arrow">▶</span>
          </div>
        </div>
        <div class="folder-content" id="flashcard-folder-content-${key}" style="display: none; max-height: 0;">
          <div class="flashcard-grid" id="flashcard-grid-${key}">
            ${renderFlashcards(group.cards, fromLang, toLang)}
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html || '<div class="empty-state"><div class="empty-state-icon">🎴</div><div>Aucune flashcard valide</div></div>';
  
  // Attacher les event listeners après avoir créé le HTML
  setTimeout(() => {
    // Event listeners pour ouvrir/fermer les dossiers
    container.querySelectorAll('.flashcard-language-folder .folder-header').forEach(header => {
      header.addEventListener('click', (e) => {
        // Ne pas déclencher si on clique sur un bouton ou une flashcard
        if (e.target.closest('button') || e.target.closest('.flashcard')) return;
        
        const folder = header.closest('.flashcard-language-folder');
        const key = folder.dataset.key;
        toggleFlashcardFolder(key);
      });
    });
    
    // Attacher un seul event listener sur le container principal
    if (!container.dataset.listenersAttached) {
      container.dataset.listenersAttached = 'true';
      
      container.addEventListener('click', (e) => {
        // Gérer les clics sur les flashcards - IMPORTANT: vérifier qu'on n'a pas cliqué sur un bouton
        const flashcard = e.target.closest('.flashcard');
        if (flashcard && !e.target.closest('button')) {
          e.stopPropagation();
          e.preventDefault();
          const cardId = flashcard.dataset.id;
          console.log('Clic sur flashcard détecté, id:', cardId);
          flipCard(cardId);
          return;
        }
        
        // Gérer les boutons swap flashcard
        if (e.target.closest('.js-flashcard-swap')) {
          e.stopPropagation();
          const btn = e.target.closest('.js-flashcard-swap');
          const key = btn.dataset.key;
          const direction = btn.dataset.direction;
          swapFlashcardLanguages(key, direction);
        }
        
        // Gérer les boutons menu flashcard
        if (e.target.closest('.js-flashcard-menu')) {
          e.stopPropagation();
          const btn = e.target.closest('.js-flashcard-menu');
          const key = btn.dataset.key;
          const type = btn.dataset.type;
          showFolderMenu(e, key, type);
        }
        
        // Gérer les boutons d'action des flashcards
        if (e.target.closest('.js-card-action')) {
          e.stopPropagation();
          const btn = e.target.closest('.js-card-action');
          const action = btn.dataset.action;
          const cardId = parseInt(btn.dataset.cardId);
          
          console.log('Action flashcard:', { action, cardId });
          
          switch(action) {
            case 'favorite':
              moveToFolder(cardId, 'favorites');
              break;
            case 'difficult':
              moveToFolder(cardId, 'difficult');
              break;
            case 'learned':
              moveToFolder(cardId, 'learned');
              break;
            case 'delete':
              console.log('Suppression de la flashcard:', cardId);
              deleteFlashcard(cardId);
              break;
          }
        }
      });
    }
  }, 100);
}

// Rendre les flashcards pour un groupe de langues
function renderFlashcards(cards, fromLang, toLang) {
  // Vérifier que cards existe et est un tableau
  if (!cards || !Array.isArray(cards)) {
    console.warn('renderFlashcards: cards is undefined or not an array');
    return '';
  }
  
  // Afficher toutes les cartes du groupe, peu importe la direction
  return cards.slice(0, 20).map(card => {
    // Déterminer si c'est une carte inversée
    const isReversed = card.fromLang !== fromLang;
    const displayFront = isReversed ? card.back : card.front;
    const displayBack = isReversed ? card.front : card.back;
    const displayFromLang = isReversed ? card.toLang : card.fromLang;
    const displayToLang = isReversed ? card.fromLang : card.toLang;
    
    return `
      <div class="flashcard" data-id="${card.id}" style="cursor: pointer;">
        <div class="flashcard-difficulty difficulty-${card.difficulty || 'normal'}"></div>
        <div class="flashcard-content" id="card-content-${card.id}">
          <div class="flashcard-front" id="front-${card.id}">
            <div class="flashcard-text">${escapeHtml(displayFront)}</div>
            <div class="flashcard-hint">
              <span>${getFlagEmoji(displayFromLang)}</span>
              <span>Cliquez pour révéler</span>
            </div>
          </div>
          <div class="flashcard-back" id="back-${card.id}" style="display: none;">
            <div class="flashcard-text">${escapeHtml(displayBack)}</div>
            <div class="flashcard-lang">
              <span>${getFlagEmoji(displayToLang)}</span>
              <span>${getLanguageName(displayToLang)}</span>
            </div>
            <div class="flashcard-actions" style="margin-top: 12px; padding: 8px 0; display: flex; justify-content: center; gap: 6px; flex-wrap: wrap;">
              <button class="btn btn-sm js-card-action" data-action="favorite" data-card-id="${card.id}" title="Favori" style="min-width: 36px;">⭐</button>
              <button class="btn btn-sm js-card-action" data-action="difficult" data-card-id="${card.id}" title="Difficile" style="min-width: 36px;">🔥</button>
              <button class="btn btn-sm js-card-action" data-action="learned" data-card-id="${card.id}" title="Maîtrisée" style="min-width: 36px;">✅</button>
              <button class="btn btn-sm btn-danger js-card-action" data-action="delete" data-card-id="${card.id}" title="Supprimer" style="min-width: 36px;">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Sauvegarder les flashcards
async function saveFlashcards() {
  console.log('📝 saveFlashcards appelée avec', flashcards.length, 'flashcards');
  
  // Ne plus sauvegarder localement - les flashcards sont uniquement sur le serveur
  console.log('☁️ Les flashcards sont maintenant uniquement sur le serveur');
  
  // Si l'utilisateur est connecté, synchroniser avec le backend
  const token = await authAPI.getToken();
  if (token) {
    // Synchroniser TOUTES les flashcards non synchronisées
    const unsyncedCards = flashcards.filter(card => !card.synced && !card.syncedWithServer);
    
    console.log(`📤 ${unsyncedCards.length} flashcards à synchroniser`);
    
    // Vérifier que flashcardsAPI est disponible
    if (typeof flashcardsAPI !== 'undefined' && flashcardsAPI.create) {
      for (const card of unsyncedCards) {
        try {
          // Vérifier que les données sont valides avant d'envoyer
          const originalText = card.front || card.text || '';
          const translatedText = card.back || card.translation || '';
          
          if (!originalText || !translatedText) {
            console.warn('Flashcard invalide, skip:', card);
            continue;
          }
          
          const sourceLang = card.sourceLanguage || detectLanguage(originalText);
          const targetLang = card.targetLanguage || card.language || 'fr';
          const response = await flashcardsAPI.create({
            originalText: originalText.trim(),
            translatedText: translatedText.trim(),
            sourceLanguage: sourceLang,
            targetLanguage: targetLang,
            language: targetLang, // Le backend n'accepte qu'une langue simple
            folder: card.folder || 'default',
            difficulty: card.difficulty || 'normal'
          });
          
          if (response && response.id) {
            console.log('✅ Flashcard synchronisée:', card.front || card.text);
            // Marquer comme synchronisée
            card.synced = true;
            card.syncedWithServer = true;
            card.serverId = response.id;
          }
        } catch (error) {
          console.error('Erreur lors de la synchronisation:', error);
          // Garder la flashcard locale même si la sync échoue
        }
      }
    } else {
      console.warn('⚠️ flashcardsAPI non disponible, synchronisation ignorée');
    }
    
    // Ne plus sauvegarder localement - les flashcards sont uniquement sur le serveur
    console.log('✅ Flashcards marquées comme synchronisées (pas de sauvegarde locale)');
  }
}

// Afficher le mode pratique
function displayPracticeMode() {
  const container = document.getElementById('flashcardsList');
  if (!container || !practiceMode.active) return;
  
  const currentCard = practiceMode.cards[practiceMode.currentIndex];
  const progress = ((practiceMode.currentIndex) / practiceMode.cards.length) * 100;
  
  container.innerHTML = `
    <div class="practice-mode">
      <div class="practice-header">
        <h2 class="practice-title">🎮 Mode Pratique</h2>
        <div class="practice-progress">
          <div class="progress-bar" style="width: ${progress}%"></div>
        </div>
        <div class="practice-stats">
          <div class="practice-stat" style="color: var(--secondary-color);">
            <span>✅</span>
            <span>${practiceMode.score.correct}</span>
          </div>
          <div class="practice-stat" style="color: var(--danger-color);">
            <span>❌</span>
            <span>${practiceMode.score.incorrect}</span>
          </div>
          <div class="practice-stat" style="color: var(--gray-600);">
            <span>📝</span>
            <span>${practiceMode.currentIndex + 1}/${practiceMode.cards.length}</span>
          </div>
        </div>
      </div>
      
      <div class="practice-card">
        <div class="practice-question">
          <div class="practice-prompt">Traduisez ce mot/phrase:</div>
          <div class="practice-word">"${escapeHtml(currentCard.front)}"</div>
          <div class="flashcard-lang">
            <span>${getFlagEmoji(currentCard.sourceLanguage && currentCard.sourceLanguage !== 'auto' ? currentCard.sourceLanguage : detectLanguage(currentCard.front))}</span>
            <span>→</span>
            <span>${getFlagEmoji(currentCard.language)}</span>
          </div>
        </div>
        
        <input type="text" 
               id="practiceAnswer" 
               class="practice-input"
               placeholder="Votre réponse..." 
               autocomplete="off"
               autocorrect="off"
               spellcheck="false">
        
        <div id="practiceResult" style="display: none;"></div>
        
        <div class="practice-actions">
          <button class="btn btn-primary js-check-answer" id="checkBtn">
            Vérifier
          </button>
          <button class="btn btn-secondary js-show-hint">
            💡 Indice
          </button>
          <button class="btn btn-secondary js-skip-question">
            Passer →
          </button>
          <button class="btn btn-danger js-quit-practice">
            Quitter
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Focus sur l'input et gérer Enter
  setTimeout(() => {
    const input = document.getElementById('practiceAnswer');
    if (input) {
      input.focus();
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const checkBtn = document.getElementById('checkBtn');
          if (checkBtn.textContent === 'Vérifier') {
            checkAnswer();
          } else {
            nextQuestion();
          }
        }
      });
    }
    
    // Event listeners pour les boutons
    container.querySelector('.js-check-answer')?.addEventListener('click', checkAnswer);
    container.querySelector('.js-show-hint')?.addEventListener('click', showHint);
    container.querySelector('.js-skip-question')?.addEventListener('click', skipQuestion);
    container.querySelector('.js-quit-practice')?.addEventListener('click', quitPractice);
  }, 100);
}

// Normaliser une réponse pour la comparaison
function normalizeAnswer(answer) {
  return answer
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:'"]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^(le |la |les |l'|un |une |des |the |a |an )/i, '');
}

// Vérifier la similarité entre deux réponses
function checkAnswerSimilarity(userAnswer, correctAnswer) {
  // Correspondance exacte
  if (userAnswer === correctAnswer) return true;
  
  // Correspondance sans articles
  const userWords = userAnswer.split(' ');
  const correctWords = correctAnswer.split(' ');
  
  // Si l'utilisateur a donné tous les mots importants
  const importantWords = correctWords.filter(w => w.length > 2);
  const matchedWords = importantWords.filter(w => userAnswer.includes(w));
  
  if (matchedWords.length >= importantWords.length * 0.8) return true;
  
  // Distance de Levenshtein pour les mots courts
  if (correctAnswer.length < 10) {
    const distance = levenshteinDistance(userAnswer, correctAnswer);
    return distance <= Math.ceil(correctAnswer.length * 0.2);
  }
  
  return false;
}

// Calculer la distance de Levenshtein
function levenshteinDistance(a, b) {
  const matrix = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

// Afficher les résultats de la pratique
function showPracticeResults() {
  const container = document.getElementById('flashcardsList');
  if (!container) return;
  
  const total = practiceMode.score.correct + practiceMode.score.incorrect;
  const percentage = total > 0 ? Math.round((practiceMode.score.correct / total) * 100) : 0;
  const duration = Math.round((Date.now() - practiceMode.startTime) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  
  let message, emoji;
  if (percentage >= 90) {
    message = 'Excellent! Maîtrise parfaite!';
    emoji = '🏆';
  } else if (percentage >= 70) {
    message = 'Très bien! Continuez comme ça!';
    emoji = '🎉';
  } else if (percentage >= 50) {
    message = 'Pas mal! Encore un peu de pratique!';
    emoji = '💪';
  } else {
    message = 'Continuez à pratiquer!';
    emoji = '📚';
  }
  
  container.innerHTML = `
    <div class="practice-results" style="text-align: center; padding: 40px 20px;">
      <div style="font-size: 64px; margin-bottom: 16px;">${emoji}</div>
      <h2 style="font-size: 24px; margin-bottom: 8px;">Pratique terminée!</h2>
      <p style="font-size: 16px; color: var(--gray-600); margin-bottom: 24px;">${message}</p>
      
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; max-width: 400px; margin: 0 auto 24px;">
        <div class="stat-card">
          <div class="stat-number" style="color: var(--secondary-color);">${practiceMode.score.correct}</div>
          <div class="stat-label">Correctes</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" style="color: var(--danger-color);">${practiceMode.score.incorrect}</div>
          <div class="stat-label">Incorrectes</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" style="color: var(--primary-color);">${percentage}%</div>
          <div class="stat-label">Score</div>
        </div>
      </div>
      
      <p style="font-size: 14px; color: var(--gray-600); margin-bottom: 24px;">
        Temps: ${minutes}m ${seconds}s
      </p>
      
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button class="btn btn-primary js-restart-practice">
          🔄 Recommencer
        </button>
        <button class="btn btn-secondary js-quit-results">
          📚 Retour aux flashcards
        </button>
      </div>
    </div>
  `;
  
  // Event listeners
  container.querySelector('.js-restart-practice')?.addEventListener('click', startPracticeMode);
  container.querySelector('.js-quit-results')?.addEventListener('click', quitPractice);
}

// Utilitaires
function detectLanguage(text) {
  if (!text) return 'fr';
  
  // Détection par caractères spéciaux
  const patterns = {
    'fr': /[àâäéêëèîïôùûüÿç]/i,
    'es': /[áéíóúñ¿¡]/i,
    'de': /[äöüß]/i,
    'it': /[àèéìíîòóù]/i,
    'pt': /[àáâãçéêíõôú]/i,
    'ru': /[а-яё]/i,
    'ja': /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/,
    'ko': /[\uac00-\ud7af\u1100-\u11ff]/,
    'zh': /[\u4e00-\u9fff]/,
    'ar': /[\u0600-\u06ff]/
  };
  
  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) return lang;
  }
  
  // Détection par mots courants
  const words = text.toLowerCase().split(/\s+/);
  const langWords = {
    'fr': ['le', 'la', 'les', 'de', 'un', 'une', 'et', 'est', 'dans'],
    'en': ['the', 'a', 'an', 'is', 'and', 'in', 'on', 'at', 'to'],
    'es': ['el', 'la', 'los', 'las', 'y', 'es', 'en', 'de', 'un'],
    'de': ['der', 'die', 'das', 'und', 'ist', 'in', 'ein', 'eine'],
    'it': ['il', 'la', 'lo', 'le', 'e', 'è', 'in', 'un', 'una'],
    'pt': ['o', 'a', 'os', 'as', 'e', 'é', 'em', 'um', 'uma']
  };
  
  let maxScore = 0;
  let detectedLang = 'en';
  
  for (const [lang, keywords] of Object.entries(langWords)) {
    const score = words.filter(w => keywords.includes(w)).length;
    if (score > maxScore) {
      maxScore = score;
      detectedLang = lang;
    }
  }
  
  return detectedLang;
}

function getFlagEmoji(langCode) {
  const flags = {
    'fr': '🇫🇷',
    'en': '🇺🇸',
    'ar': '🇸🇦',
    'es': '🇪🇸',
    'de': '🇩🇪',
    'it': '🇮🇹',
    'pt': '🇵🇹',
    'ru': '🇷🇺',
    'ja': '🇯🇵',
    'ko': '🇰🇷',
    'zh': '🇨🇳',
    'auto': '🌐'
  };
  
  return flags[langCode] || '🌐';
}

function getLanguageName(langCode) {
  const names = {
    'fr': 'Français',
    'en': 'English',
    'ar': 'العربية',
    'es': 'Español',
    'de': 'Deutsch',
    'it': 'Italiano',
    'pt': 'Português',
    'ru': 'Русский',
    'ja': '日本語',
    'ko': '한국어',
    'zh': '中文',
    'auto': 'Auto'
  };
  
  return names[langCode] || langCode.toUpperCase();
}

function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'à l\'instant';
  if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `il y a ${Math.floor(seconds / 3600)} h`;
  if (seconds < 604800) return `il y a ${Math.floor(seconds / 86400)} j`;
  
  return date.toLocaleDateString('fr-FR');
}

// Afficher une notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Afficher la fenêtre de login
function showLoginWindow() {
  const loginModal = document.createElement('div');
  loginModal.className = 'login-modal';
  loginModal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
  
  loginModal.innerHTML = `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2px; border-radius: 18px; max-width: 380px; width: 90%; box-shadow: 0 25px 60px rgba(0,0,0,0.3);">
      <div style="background: white; padding: 28px; border-radius: 16px; position: relative;">
        <button style="position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 18px; color: #9ca3af; cursor: pointer; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.2s;" class="js-login-cancel">×</button>
        
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">🌐</div>
          <h2 style="font-size: 22px; margin-bottom: 6px; color: #1f2937; font-weight: 700;">Connexion à LexiFlow</h2>
          <p style="color: #6b7280; font-size: 14px;">Débloquez toutes les fonctionnalités Premium</p>
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #374151; font-size: 13px;">Adresse email</label>
          <input type="email" id="loginEmail" style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 14px; transition: all 0.2s; background: #f9fafb;" placeholder="votre@email.com">
        </div>
        
        <div style="margin-bottom: 24px;">
          <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #374151; font-size: 13px;">Mot de passe</label>
          <input type="password" id="loginPassword" style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 14px; transition: all 0.2s; background: #f9fafb;" placeholder="••••••••">
        </div>
        
        <button class="js-login-submit" style="width: 100%; padding: 14px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
          Se connecter
        </button>
        
        <div style="position: relative; text-align: center; margin-bottom: 16px;">
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;">
          <span style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: white; padding: 0 12px; color: #9ca3af; font-size: 12px;">ou continuer avec</span>
        </div>
        
        <button class="js-oauth-google" style="width: 100%; padding: 12px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 16px;">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continuer avec Google
        </button>
        
        <div style="text-align: center;">
          <a href="#" style="color: #667eea; font-size: 13px; text-decoration: none; margin-right: 12px;">Mot de passe oublié ?</a>
          <span style="color: #d1d5db;">•</span>
          <a href="#" class="js-register-link" style="color: #667eea; font-size: 13px; text-decoration: none; margin-left: 12px;">Créer un compte</a>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(loginModal);
  
  // Event listeners
  loginModal.querySelector('.js-login-cancel').addEventListener('click', () => {
    loginModal.remove();
  });
  
  loginModal.querySelector('.js-login-submit').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
      showNotification('Veuillez remplir tous les champs', 'warning');
      return;
    }
    
    // Désactiver le bouton pendant la connexion
    const submitButton = loginModal.querySelector('.js-login-submit');
    submitButton.disabled = true;
    submitButton.textContent = 'Connexion en cours...';
    
    try {
      // Appel API réel pour la connexion
      const response = await authAPI.login(email, password);
      
      // Fermer le modal d'abord
      loginModal.remove();
      
      // Ensuite afficher la notification et mettre à jour l'UI
      showNotification('Connexion réussie!', 'success');
      updateUIAfterLogin(response.user);
      
      // Vérifier si c'est le même utilisateur ou un nouveau
      const previousUserId = localStorage.getItem('lastUserId') || localStorage.getItem('lastDisconnectedUserId');
      const currentUserId = response.user.id || response.user._id;
      
      if (previousUserId && previousUserId !== currentUserId) {
        // C'est un utilisateur différent, nettoyer les données
        console.log('🔄 Changement d\'utilisateur détecté, nettoyage des données...');
        flashcards = [];
        translations = [];
        localStorage.removeItem('translations');
        chrome.storage.local.remove(['translations']);
      } else {
        console.log('✅ Même utilisateur, conservation des données locales');
      }
      
      // Sauvegarder l'ID de l'utilisateur actuel
      localStorage.setItem('lastUserId', currentUserId);
      
      // NE PAS appeler syncFlashcardsAfterLogin ici - updateUIAfterLogin s'en charge
      
    } catch (error) {
      showNotification(error.message || 'Erreur de connexion', 'error');
      submitButton.disabled = false;
      submitButton.textContent = 'Se connecter';
    }
  });
  
  // Fermer en cliquant à l'extérieur
  loginModal.addEventListener('click', (e) => {
    if (e.target === loginModal) {
      loginModal.remove();
    }
  });
  
  // Focus sur l'email et ajouter les effets
  setTimeout(() => {
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const submitButton = loginModal.querySelector('.js-login-submit');
    
    // Focus sur l'email
    emailInput.focus();
    
    // Effets de focus pour les inputs
    [emailInput, passwordInput].forEach(input => {
      input.addEventListener('focus', () => {
        input.style.borderColor = '#667eea';
        input.style.background = 'white';
        input.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
      });
      
      input.addEventListener('blur', () => {
        input.style.borderColor = '#e5e7eb';
        input.style.background = '#f9fafb';
        input.style.boxShadow = 'none';
      });
    });
    
    // Effet hover pour le bouton
    submitButton.addEventListener('mouseenter', () => {
      submitButton.style.transform = 'translateY(-1px)';
      submitButton.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
    });
    
    submitButton.addEventListener('mouseleave', () => {
      submitButton.style.transform = 'translateY(0)';
      submitButton.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
    });
  }, 100);
  
  // Event listener pour le lien "Créer un compte"
  loginModal.querySelector('.js-register-link').addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.remove();
    showRegisterWindow();
  });
  
  // Event listener pour OAuth Google
  loginModal.querySelector('.js-oauth-google').addEventListener('click', () => {
    handleOAuthLogin('google');
  });
  
}

// Fonction handleOAuthLogin mise à jour
function handleOAuthLogin(provider) {
  // Récupérer le modal de connexion actuel
  const loginModal = document.querySelector('.login-modal');
  
  // Désactiver le bouton Google et afficher un feedback
  const googleButton = loginModal?.querySelector('.js-oauth-google');
  if (googleButton) {
    googleButton.disabled = true;
    googleButton.innerHTML = `
      <div class="spinner" style="width: 16px; height: 16px; border: 2px solid #e5e7eb; border-top: 2px solid #4285F4; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <span>Connexion...</span>
    `;
  }
  
  // Timeout pour réactiver le bouton en cas d'échec
  oauthTimeoutId = setTimeout(() => {
    console.error('Timeout OAuth - La connexion prend trop de temps');
    if (googleButton) {
      googleButton.disabled = false;
      googleButton.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continuer avec Google
      `;
    }
    showNotification('La connexion a échoué. Veuillez réessayer.', 'error');
  }, 30000); // 30 secondes de timeout
  
  // Construire l'URL OAuth avec les paramètres appropriés
  const timestamp = Date.now();
  const authUrl = `${API_CONFIG.BASE_URL}/api/auth/${provider}?prompt=select_account&max_age=0&t=${timestamp}`;
  
  // Afficher un message de chargement
  if (googleButton) {
    googleButton.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 16px; height: 16px; border: 2px solid #f3f3f3; border-top: 2px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <span>Connexion en cours...</span>
      </div>
    `;
  }
  
  // Ouvrir dans une fenêtre popup
  chrome.windows.create({
    url: authUrl,
    type: 'popup',
    width: 500,
    height: 700,
    left: Math.round((screen.width - 500) / 2),
    top: Math.round((screen.height - 700) / 2)
  }, (window) => {
    if (chrome.runtime.lastError) {
      if (oauthTimeoutId) {
        clearTimeout(oauthTimeoutId);
        oauthTimeoutId = null;
      }
      console.error('Erreur chrome.windows.create:', chrome.runtime.lastError);
      showNotification('Impossible d\'ouvrir la page de connexion', 'error');
      
      // Réactiver le bouton
      if (googleButton) {
        googleButton.disabled = false;
        googleButton.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continuer avec Google
        `;
      }
      return;
    }
    
    console.log('Fenêtre OAuth ouverte:', window.id);
    
    // Fermer le modal si tout va bien
    if (loginModal) {
      loginModal.remove();
    }
  });
  
  // Fonction pour gérer la connexion réussie
  const handleSuccessfulAuth = async (token) => {
    // Annuler le timeout
    if (oauthTimeoutId) {
      clearTimeout(oauthTimeoutId);
      oauthTimeoutId = null;
    }
    
    if (!token) {
      showNotification('Erreur: Token manquant', 'error');
      return;
    }
    
    // Fermer le modal immédiatement
    if (loginModal) {
      loginModal.remove();
    }
    
    // Afficher un message de chargement
    showNotification('Connexion en cours...', 'info');
    
    // Sauvegarder le token
    chrome.storage.local.set({ authToken: token }, async () => {
      try {
        // Récupérer le profil utilisateur
        const response = await apiRequest('/api/user/profile');
        if (response && response.user) {
          // Sauvegarder immédiatement les infos utilisateur
          chrome.storage.local.set({ user: response.user });
          
          // Mettre à jour l'interface immédiatement pour feedback rapide
          updateUIAfterLogin(response.user);
          showNotification('Connexion réussie!', 'success');
          
          // Gérer les flashcards en arrière-plan après l'UI
          setTimeout(async () => {
            const currentUserId = response.user.id || response.user._id;
            
            // Sauvegarder l'ID de l'utilisateur actuel
            localStorage.setItem('lastUserId', currentUserId);
            
            // NE PAS nettoyer les données locales - on veut les préserver !
            console.log('📌 Préservation des données locales...');
            // flashcards = [];  // COMMENTÉ pour préserver les flashcards
            // translations = []; // COMMENTÉ pour préserver l'historique
            // localStorage.removeItem('flashcards');
            // localStorage.removeItem('translations');
            localStorage.removeItem('lastDisconnectedUserId'); // OK de nettoyer ça
            // chrome.storage.local.remove(['flashcards', 'translations']); // COMMENTÉ
            
            // NE PAS appeler syncFlashcardsAfterLogin ici - updateUIAfterLogin s'en charge
            console.log(`👤 updateUIAfterLogin va gérer la synchronisation`);
            
            // Réinitialiser le currentUser avec les nouvelles infos
            window.currentUser = response.user;
          }, 100);
        }
      } catch (error) {
        console.error('Erreur profil:', error);
        showNotification('Erreur lors de la récupération du profil', 'error');
        // Ne PAS appeler resetUIAfterLogout() ici car cela efface les flashcards
        // Juste déconnecter l'utilisateur sans toucher aux données locales
        await authAPI.logout();
        // Réinitialiser seulement le bouton de connexion
        const loginButton = document.getElementById('loginButton');
        if (loginButton) {
          loginButton.innerHTML = '<span style="font-size: 14px;">🔒</span><span>Se connecter</span>';
          loginButton.onclick = () => showLoginWindow();
        }
      }
    });
  };
  
  // Fonction pour gérer les erreurs
  const handleAuthError = (error) => {
    // Annuler le timeout
    if (oauthTimeoutId) {
      clearTimeout(oauthTimeoutId);
      oauthTimeoutId = null;
    }
    
    console.error('Erreur OAuth:', error);
    showNotification(`Erreur de connexion: ${error}`, 'error');
    
    // Réactiver le bouton
    if (googleButton) {
      googleButton.disabled = false;
      googleButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continuer avec Google
      `;
    }
  };
  
}

// Afficher la fenêtre d'inscription
function showRegisterWindow() {
  const registerModal = document.createElement('div');
  registerModal.className = 'register-modal';
  registerModal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
  
  registerModal.innerHTML = `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2px; border-radius: 18px; max-width: 380px; width: 90%; box-shadow: 0 25px 60px rgba(0,0,0,0.3);">
      <div style="background: white; padding: 28px; border-radius: 16px; position: relative;">
        <button style="position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 18px; color: #9ca3af; cursor: pointer; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.2s;" class="js-register-cancel">×</button>
        
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">🚀</div>
          <h2 style="font-size: 22px; margin-bottom: 6px; color: #1f2937; font-weight: 700;">Créer un compte LexiFlow</h2>
          <p style="color: #6b7280; font-size: 14px;">Commencez avec 50 flashcards gratuites</p>
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #374151; font-size: 13px;">Nom complet</label>
          <input type="text" id="registerName" style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 14px; transition: all 0.2s; background: #f9fafb;" placeholder="Jean Dupont">
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #374151; font-size: 13px;">Adresse email</label>
          <input type="email" id="registerEmail" style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 14px; transition: all 0.2s; background: #f9fafb;" placeholder="votre@email.com">
        </div>
        
        <div style="margin-bottom: 24px;">
          <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #374151; font-size: 13px;">Mot de passe</label>
          <input type="password" id="registerPassword" style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 14px; transition: all 0.2s; background: #f9fafb;" placeholder="••••••••">
          <p style="font-size: 11px; color: #6b7280; margin-top: 4px;">Au moins 8 caractères</p>
        </div>
        
        <button class="js-register-submit" style="width: 100%; padding: 14px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
          Créer mon compte
        </button>
        
        <div style="text-align: center;">
          <span style="color: #6b7280; font-size: 13px;">Déjà un compte ?</span>
          <a href="#" class="js-login-link" style="color: #667eea; font-size: 13px; text-decoration: none; margin-left: 8px;">Se connecter</a>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(registerModal);
  
  // Event listeners
  registerModal.querySelector('.js-register-cancel').addEventListener('click', () => {
    registerModal.remove();
  });
  
  registerModal.querySelector('.js-register-submit').addEventListener('click', async () => {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    if (!name || !email || !password) {
      showNotification('Veuillez remplir tous les champs', 'warning');
      return;
    }
    
    if (password.length < 8) {
      showNotification('Le mot de passe doit contenir au moins 8 caractères', 'warning');
      return;
    }
    
    // Désactiver le bouton pendant l'inscription
    const submitButton = registerModal.querySelector('.js-register-submit');
    submitButton.disabled = true;
    submitButton.textContent = 'Création en cours...';
    
    try {
      // Appel API pour créer le compte
      const response = await authAPI.register(name, email, password);
      
      registerModal.remove();
      showNotification('Compte créé avec succès!', 'success');
      
      // Mettre à jour l'interface utilisateur
      updateUIAfterLogin(response.user);
      
      // NE PAS appeler syncFlashcardsAfterLogin ici - updateUIAfterLogin s'en charge
      
    } catch (error) {
      showNotification(error.message || 'Erreur lors de la création du compte', 'error');
      submitButton.disabled = false;
      submitButton.textContent = 'Créer mon compte';
    }
  });
  
  // Lien pour revenir à la connexion
  registerModal.querySelector('.js-login-link').addEventListener('click', (e) => {
    e.preventDefault();
    registerModal.remove();
    showLoginWindow();
  });
  
  // Fermer en cliquant à l'extérieur
  registerModal.addEventListener('click', (e) => {
    if (e.target === registerModal) {
      registerModal.remove();
    }
  });
  
  // Focus sur le nom et ajouter les effets
  setTimeout(() => {
    const nameInput = document.getElementById('registerName');
    if (nameInput) nameInput.focus();
  }, 100);
}

// Fonction pour mettre à jour l'UI après connexion
function updateUIAfterLogin(user) {
  if (!user) return;
  
  // Sauvegarder l'utilisateur courant
  window.currentUser = user;
  
  // Restaurer les données de l'utilisateur s'il revient
  const userId = user.id || user._id;
  const userDataKey = `userData_${userId}`;
  
  chrome.storage.local.get([userDataKey], async (result) => {
    if (result[userDataKey]) {
      console.log(`Restauration des données pour l'utilisateur ${userId}`);
      const userData = result[userDataKey];
      
      // Restaurer les flashcards
      if (userData.flashcards && userData.flashcards.length > 0) {
        flashcards = userData.flashcards;
        console.log(`${flashcards.length} flashcards restaurées`);
        updateFlashcards();
      }
      
      // Restaurer les traductions
      if (userData.translations && userData.translations.length > 0) {
        translations = userData.translations;
        console.log(`${translations.length} traductions restaurées`);
        updateHistory();
      }
      
      // Restaurer la langue cible
      if (userData.targetLanguage) {
        targetLanguage = userData.targetLanguage;
        const langSelect = document.getElementById('targetLanguage');
        if (langSelect) {
          langSelect.value = targetLanguage;
        }
        chrome.storage.sync.set({ targetLanguage });
      }
      
      // IMPORTANT: Synchroniser APRÈS la restauration
      console.log('Lancement de la synchronisation avec fusion...');
      await syncFlashcardsAfterLogin(true); // true = mode fusion
      
    } else {
      console.log('Aucune donnée locale trouvée pour cet utilisateur');
      // Vérifier s'il y a des flashcards locales actuelles
      chrome.storage.local.get(['flashcards'], async (data) => {
        const localFlashcards = data.flashcards || [];
        if (localFlashcards.length > 0) {
          console.log(`${localFlashcards.length} flashcards locales trouvées, mode fusion`);
          flashcards = localFlashcards;
          await syncFlashcardsAfterLogin(true); // Mode fusion pour préserver les données locales
        } else {
          console.log('Aucune flashcard locale, chargement depuis le serveur');
          await syncFlashcardsAfterLogin(false); // Charger depuis serveur
        }
      });
    }
  });
  
  // Mettre à jour le bouton de connexion
  const loginButton = document.getElementById('loginButton');
  if (loginButton) {
    const isPremium = user.subscriptionStatus === 'premium';
    loginButton.innerHTML = `
      <span style="font-size: 14px;">${isPremium ? '⭐' : '✅'}</span>
      <span>${user.name || user.email}</span>
    `;
    loginButton.style.background = isPremium ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 'rgba(16, 185, 129, 0.3)';
    loginButton.style.borderColor = isPremium ? 'transparent' : 'rgba(16, 185, 129, 0.5)';
    loginButton.style.cursor = 'pointer';
    
    // Changer le comportement du bouton pour afficher le menu utilisateur
    loginButton.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Bouton cliqué, utilisateur:', user);
      showUserMenu(user);
    };
    loginButton.onmouseenter = null;
    loginButton.onmouseleave = null;
  }
  
  // Mettre à jour le quota
  updateUserQuota(user);
  
  // Rafraîchir l'interface
  updateStats();
}

// Fonction pour afficher le menu utilisateur
function showUserMenu(user) {
  console.log('showUserMenu appelé avec:', user);
  
  // Utiliser le menu existant dans le HTML
  const menu = document.getElementById('userMenu');
  if (!menu) {
    console.error('Menu utilisateur non trouvé dans le HTML');
    return;
  }
  
  // Mettre à jour les informations de l'utilisateur
  const userEmail = document.getElementById('userEmail');
  const userPlan = document.getElementById('userPlan');
  
  if (userEmail) {
    userEmail.textContent = user.email || user.name || 'Utilisateur';
  }
  
  if (userPlan) {
    const isPremium = user.subscriptionStatus === 'premium';
    userPlan.textContent = isPremium ? '⭐ Compte Premium' : '📦 Compte Gratuit';
    userPlan.style.color = isPremium ? '#f5576c' : '#6b7280';
  }
  
  // Afficher le menu
  menu.style.display = 'block';
  
  // Mettre à jour le bouton de connexion
  const loginButton = document.getElementById('loginButton');
  if (loginButton) {
    loginButton.innerHTML = `
      <span style="font-size: 12px;">👤</span>
      <span>${user.name || user.email || 'Mon compte'}</span>
    `;
    
    // Ajouter l'événement pour basculer le menu
    loginButton.onclick = (e) => {
      e.stopPropagation();
      const isVisible = menu.style.display === 'block';
      menu.style.display = isVisible ? 'none' : 'block';
    };
  }
  
  // Fermer le menu en cliquant ailleurs
  const closeMenu = (e) => {
    if (!menu.contains(e.target) && !loginButton.contains(e.target)) {
      menu.style.display = 'none';
    }
  };
  
  // Ajouter l'événement pour fermer le menu
  setTimeout(() => document.addEventListener('click', closeMenu), 100);
  
  // Gérer les boutons du menu
  const switchAccountBtn = document.getElementById('switchAccountBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  
  // Ajouter les effets hover aux boutons
  if (switchAccountBtn) {
    switchAccountBtn.addEventListener('mouseenter', () => {
      switchAccountBtn.style.background = '#f3f4f6';
    });
    switchAccountBtn.addEventListener('mouseleave', () => {
      switchAccountBtn.style.background = 'none';
    });
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('mouseenter', () => {
      logoutBtn.style.background = '#fee2e2';
    });
    logoutBtn.addEventListener('mouseleave', () => {
      logoutBtn.style.background = 'none';
    });
  }
  
  // Gérer le changement de compte
  if (switchAccountBtn) {
    switchAccountBtn.onclick = async () => {
      // Sauvegarder les données de l'utilisateur actuel avant de se déconnecter
      if (window.currentUser && window.currentUser.id) {
        const userId = window.currentUser.id || window.currentUser._id;
        
        // Sauvegarder les flashcards et traductions par utilisateur
        const userDataKey = `userData_${userId}`;
        const userData = {
          flashcards: flashcards,
          translations: translations,
          targetLanguage: targetLanguage,
          lastSaved: new Date().toISOString()
        };
        
        // Sauvegarder dans chrome.storage.local
        chrome.storage.local.set({ [userDataKey]: userData }, () => {
          console.log(`Données sauvegardées pour l'utilisateur ${userId}`);
        });
      }
      
      // Se déconnecter
      await authAPI.logout();
      menu.style.display = 'none';
      
      // NE PAS nettoyer toutes les données, juste réinitialiser les variables actuelles
      flashcards = [];
      translations = [];
      
      // Réinitialiser l'UI
      resetUIAfterLogout();
      
      // Ouvrir directement la fenêtre de connexion Google
      setTimeout(() => {
        handleOAuthLogin('google');
      }, 500);
    };
  }
  
  // Gérer la déconnexion
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      menu.style.display = 'none';
      await authAPI.logout();
      showNotification('Déconnexion réussie', 'success');
      resetUIAfterLogout();
    };
  }
}

// Fonction pour réinitialiser l'UI après déconnexion
function resetUIAfterLogout() {
  console.log('🚪 Resetting UI after logout...');
  
  // IMPORTANT: Sauvegarder les données de l'utilisateur avant de déconnecter
  const currentUserId = localStorage.getItem('lastUserId');
  if (currentUserId && (flashcards.length > 0 || translations.length > 0)) {
    const userDataKey = `userData_${currentUserId}`;
    const userData = {
      flashcards: [...flashcards], // Copie des flashcards
      translations: [...translations], // Copie des traductions
      targetLanguage: targetLanguage,
      lastSaved: new Date().toISOString()
    };
    
    // Sauvegarder dans chrome.storage.local
    chrome.storage.local.set({ [userDataKey]: userData }, () => {
      console.log(`💾 Données sauvegardées pour l'utilisateur ${currentUserId}`);
      console.log(`   - ${flashcards.length} flashcards`);
      console.log(`   - ${translations.length} traductions`);
    });
  }
  
  // Maintenant on peut nettoyer les variables globales
  translations = [];
  localStorage.removeItem('translations');
  chrome.storage.local.remove(['translations']);
  
  // Nettoyer les flashcards de la mémoire active seulement
  flashcards = [];
  // Ne plus supprimer localement - les flashcards sont uniquement sur le serveur
  console.log('🧹 Variables globales nettoyées (données sauvegardées)');
  
  // Clear folder directions
  localStorage.removeItem('folderDirections');
  
  // NE PAS supprimer lastUserId pour pouvoir reconnaître l'utilisateur lors de la reconnexion
  // localStorage.removeItem('lastUserId');
  
  // Clear user settings
  userSettings = {};
  chrome.storage.local.remove(['userSettings']);
  
  // Clear practice mode data
  practiceMode = {
    active: false,
    cards: [],
    currentIndex: 0,
    score: { correct: 0, incorrect: 0 },
    startTime: null
  };
  
  // 2. Reset login button UI
  const loginButton = document.getElementById('loginButton');
  if (loginButton) {
    loginButton.innerHTML = '<span style="font-size: 14px;">🔒</span><span>Se connecter</span>';
    loginButton.style.background = 'rgba(255,255,255,0.15)';
    loginButton.style.borderColor = 'rgba(255,255,255,0.25)';
    loginButton.style.cursor = 'pointer';
    loginButton.style.pointerEvents = 'auto'; // S'assurer qu'il est cliquable
    loginButton.disabled = false; // S'assurer qu'il n'est pas désactivé
    loginButton.classList.remove('disabled'); // Retirer toute classe disabled
    
    // Restaurer le comportement original
    loginButton.onclick = () => showLoginWindow();
    
    // Restaurer les effets hover
    loginButton.addEventListener('mouseenter', () => {
      loginButton.style.background = 'rgba(255,255,255,0.25)';
      loginButton.style.transform = 'translateY(-1px)';
      loginButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });
    
    loginButton.addEventListener('mouseleave', () => {
      loginButton.style.background = 'rgba(255,255,255,0.15)';
      loginButton.style.transform = 'translateY(0)';
      loginButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    });
  }
  
  // 3. Hide quota indicator
  const quotaIndicator = document.getElementById('quotaIndicator');
  if (quotaIndicator) quotaIndicator.style.display = 'none';
  
  // 4. Refresh all UI components to show empty state
  updateHistory();
  updateFlashcards();
  updateStats();
  
  // 5. If practice mode is active, exit it
  if (practiceMode.active) {
    const practiceSection = document.getElementById('practiceSection');
    if (practiceSection) practiceSection.style.display = 'none';
    
    const historySection = document.getElementById('historySection');
    const flashcardsSection = document.getElementById('flashcardsSection');
    if (historySection) historySection.style.display = 'block';
    if (flashcardsSection) flashcardsSection.style.display = 'block';
  }
  
  console.log('✅ UI reset completed after logout');
}

// Fonction pour mettre à jour le quota affiché
function updateUserQuota(user) {
  const quotaIndicator = document.getElementById('quotaIndicator');
  const quotaText = document.getElementById('quotaText');
  
  if (!quotaIndicator || !quotaText) return;
  
  const isPremium = user.subscriptionStatus === 'premium';
  const flashcardsLimit = isPremium ? 200 : 50;
  const flashcardsCount = user.flashcardsCount || 0;
  
  // Afficher l'indicateur
  quotaIndicator.style.display = 'block';
  
  // Mettre à jour le texte
  quotaText.textContent = `${flashcardsCount}/${flashcardsLimit}`;
  
  // Changer la couleur selon le pourcentage d'utilisation
  const percentage = (flashcardsCount / flashcardsLimit) * 100;
  if (percentage >= 90) {
    quotaIndicator.style.background = 'rgba(239, 68, 68, 0.2)'; // Rouge
    quotaIndicator.style.borderColor = 'rgba(239, 68, 68, 0.4)';
  } else if (percentage >= 70) {
    quotaIndicator.style.background = 'rgba(245, 158, 11, 0.2)'; // Orange
    quotaIndicator.style.borderColor = 'rgba(245, 158, 11, 0.4)';
  } else {
    quotaIndicator.style.background = 'rgba(16, 185, 129, 0.2)'; // Vert
    quotaIndicator.style.borderColor = 'rgba(16, 185, 129, 0.4)';
  }
  
  // Ajouter une icône premium si applicable
  if (isPremium) {
    quotaText.innerHTML = `⭐ ${flashcardsCount}/${flashcardsLimit}`;
  }
}

// Fonction pour synchroniser les flashcards après connexion
async function syncFlashcardsAfterLogin(mergeMode = false) {
  console.log('🔄 Synchronisation des flashcards...', mergeMode ? 'Mode fusion' : 'Mode chargement');
  
  // Si on est en mode fusion, on garde les flashcards locales
  let localFlashcards = mergeMode ? [...flashcards] : [];
  
  // Si on n'est pas en mode fusion, on nettoie SEULEMENT les flashcards (pas les traductions!)
  if (!mergeMode) {
    flashcards = [];
    // Ne plus supprimer localement - les flashcards sont uniquement sur le serveur
    // NE PAS toucher aux traductions - elles restent locales
  }
  
  // Vérifier que flashcardsAPI est disponible
  if (typeof flashcardsAPI === 'undefined' || !flashcardsAPI.getAll) {
    console.error('❌ flashcardsAPI non disponible');
    updateFlashcards();
    updateStats();
    return;
  }
  
  // Charger les flashcards UNIQUEMENT depuis le backend
  try {
    const response = await flashcardsAPI.getAll();
    
    if (response && response.flashcards && Array.isArray(response.flashcards)) {
      console.log(`☁️ ${response.flashcards.length} flashcards du serveur`);
      // Debug: voir ce que le serveur retourne vraiment
      if (response.flashcards.length > 0) {
        console.log('🔍 Exemple de flashcard du serveur:', response.flashcards[0]);
      }
      
      // Convertir les flashcards du serveur au bon format
      const serverFlashcards = response.flashcards.map(card => {
        // Utiliser sourceLanguage du serveur ou détecter pour les anciennes flashcards
        const frontText = card.front || card.originalText || card.text;
        const sourceLang = card.sourceLanguage && card.sourceLanguage !== 'auto' 
          ? card.sourceLanguage 
          : detectLanguage(frontText);
        const targetLang = card.language || card.targetLanguage || 'fr';
        
        return {
          id: card.id || generateUUID(), // Utiliser l'ID existant ou générer un nouveau
          front: card.front || card.originalText,
          back: card.back || card.translatedText,
          text: card.front || card.originalText || card.text,
          translation: card.back || card.translatedText || card.translation,
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          language: targetLang,
          context: card.context || '',
          difficulty: card.difficulty || 'medium',
          tags: card.tags || [],
          folder: card.folder || 'default',
          created: card.createdAt || card.created || new Date().toISOString(),
          lastModified: card.lastModified || card.updatedAt || new Date().toISOString(),
          createdAt: card.createdAt || card.created || new Date().toISOString(),
          isFavorite: card.tags?.includes('favorite') || false,
          reviewCount: card.reviewCount || 0,
          lastReviewed: card.lastReviewed || null,
          synced: true,
          syncedWithServer: true,
          serverId: card._id || card.id
        };
      });
      
      if (mergeMode) {
        // FUSION : Utiliser un Map pour éviter les doublons par ID
        const flashcardMap = new Map();
        
        // Ajouter d'abord les flashcards locales
        localFlashcards.forEach(card => {
          flashcardMap.set(card.id, card);
        });
        
        // Ajouter/Mettre à jour avec les flashcards du serveur
        serverFlashcards.forEach(card => {
          const existingCard = flashcardMap.get(card.id);
          if (!existingCard || new Date(card.lastModified) > new Date(existingCard.lastModified)) {
            // Nouvelle carte ou carte serveur plus récente
            flashcardMap.set(card.id, card);
          }
        });
        
        flashcards = Array.from(flashcardMap.values());
        console.log(`✅ Fusion terminée: ${flashcards.length} flashcards au total`);
        
      } else {
        // Mode chargement simple
        flashcards = serverFlashcards;
        console.log(`✅ ${flashcards.length} flashcards chargées du serveur`);
      }
      
      // Ne plus sauvegarder localement - les flashcards sont uniquement sur le serveur
      console.log('☁️ Flashcards chargées depuis le serveur uniquement');
      
    } else {
      console.log('ℹ️ Aucune flashcard sur le serveur');
      
      if (mergeMode) {
        // Garder les flashcards locales
        flashcards = localFlashcards;
        console.log(`📱 Conservation de ${flashcards.length} flashcards locales`);
      } else {
        // Compte vide
        flashcards = [];
        console.log('🔄 Compte vide, pas de flashcards');
      }
    }
    
    // Mettre à jour l'interface
    updateFlashcards();
    updateStats();
    
  } catch (error) {
    console.error('❌ Erreur lors du chargement des flashcards:', error);
    showNotification('Erreur de chargement des flashcards', 'error');
    
    // En cas d'erreur, tableau vide
    flashcards = [];
    updateFlashcards();
    updateStats();
  }
}

// Effacer tout l'historique
async function clearHistory() {
  if (!confirm('Effacer tout l\'historique des traductions ?')) return;
  
  // Supprimer sur le serveur si connecté
  const token = await authAPI.getToken();
  if (token) {
    try {
      // Note: Le backend n'a pas de route pour supprimer les traductions
      // On supprime seulement localement pour l'instant
      console.log('⚠️ Suppression côté serveur non implémentée');
    } catch (error) {
      console.error('Erreur lors de la suppression sur le serveur:', error);
      // Continuer même si l'erreur serveur
    }
  }
  
  // Supprimer localement
  translations = [];
  chrome.storage.local.set({ translations }, () => {
    updateHistory();
    updateStats();
    showNotification('Historique effacé', 'info');
  });
}

// Fonction pour créer un backup des flashcards
function backupFlashcards() {
  const backup = {
    flashcards: [...flashcards],
    timestamp: new Date().toISOString(),
    version: '1.0'
  };
  
  // Stocker le backup dans chrome.storage.local avec une clé différente
  chrome.storage.local.set({ flashcardsBackup: backup }, () => {
    console.log(`💾 Backup créé: ${flashcards.length} flashcards sauvegardées`);
  });
  
  return backup;
}

// Fonction pour restaurer les flashcards depuis le backup
function restoreFlashcardsFromBackup() {
  chrome.storage.local.get(['flashcardsBackup'], (result) => {
    if (result.flashcardsBackup && result.flashcardsBackup.flashcards) {
      const backup = result.flashcardsBackup;
      flashcards = backup.flashcards;
      
      // Ne plus sauvegarder localement - les flashcards sont uniquement sur le serveur
      console.log('🔄 Flashcards restaurées depuis le backup');
      
      // Mettre à jour l'interface
      updateFlashcards();
      updateStats();
      
      showNotification(`${flashcards.length} flashcards restaurées depuis le backup`, 'success');
    } else {
      showNotification('Aucun backup trouvé', 'warning');
    }
  });
}

// Effacer toutes les flashcards
async function clearFlashcards() {
  if (!confirm('Effacer toutes les flashcards ?')) return;
  
  // Créer un backup avant de supprimer
  backupFlashcards();
  
  // Supprimer aussi sur le serveur si connecté
  const token = await authAPI.getToken();
  if (token) {
    try {
      showNotification('Suppression en cours...', 'info');
      
      // Supprimer toutes les flashcards sur le serveur une par une
      const deletePromises = flashcards
        .filter(card => card.id && !card.id.startsWith('local_'))
        .map(card => flashcardsAPI.delete(card.id).catch(err => {
          console.error(`Erreur suppression ${card.id}:`, err);
        }));
      
      await Promise.all(deletePromises);
      console.log('✅ Toutes les flashcards supprimées du serveur');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression serveur:', error);
      showNotification('Erreur de suppression sur le serveur', 'error');
    }
  }
  
  // Supprimer localement
  flashcards = [];
  updateFlashcards();
  updateStats();
  showNotification('Flashcards effacées (backup créé)', 'success');
}

// Importer des données
function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.translations || !data.flashcards) {
        throw new Error('Format de fichier invalide');
      }
      
      if (confirm('Remplacer toutes les données actuelles par celles du fichier ?')) {
        translations = data.translations || [];
        flashcards = data.flashcards || [];
        flashcardFolders = data.flashcardFolders || flashcardFolders;
        
        // Importer aussi les paramètres si disponibles
        if (data.settings) {
          Object.assign(userSettings, data.settings);
          saveSettings();
        }
        
        // Sauvegarder les traductions et dossiers localement
        chrome.storage.local.set({ 
          translations, 
          flashcardFolders 
        }, async () => {
          // Si connecté, synchroniser les flashcards importées avec le serveur
          const token = await authAPI.getToken();
          if (token && flashcards.length > 0) {
            showNotification('Synchronisation des flashcards importées...', 'info');
            
            // Envoyer toutes les flashcards importées au serveur
            for (const card of flashcards) {
              try {
                await flashcardsAPI.create({
                  originalText: card.front || card.text,
                  translatedText: card.back || card.translation,
                  sourceLanguage: card.sourceLanguage || detectLanguage(card.front || card.text),
                  targetLanguage: card.targetLanguage || card.language || 'fr',
                  difficulty: card.difficulty || 0,
                  category: card.category || 'General'
                });
              } catch (error) {
                console.error('Erreur lors de la synchronisation:', error);
              }
            }
            
            // Recharger depuis le serveur pour avoir les IDs corrects
            await loadFlashcardsFromServer();
          }
          
          initUI();
          showNotification('Data imported successfully!', 'success');
        });
      }
    } catch (error) {
      showNotification('Erreur lors de l\'import: ' + error.message, 'error');
    }
  };
  
  input.click();
}

// Exporter toutes les données
function exportData() {
  const data = {
    translations: [...translations],
    flashcards: [...flashcards],
    flashcardFolders: {...flashcardFolders},
    settings: {...userSettings},
    exportDate: new Date().toISOString(),
    version: '1.0'
  };
  
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `lexiflow-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
  showNotification('Données exportées avec succès!', 'success');
}

// Réinitialiser l'application
function resetApp() {
  if (!confirm('⚠️ Attention! Ceci supprimera toutes vos données (traductions, flashcards, paramètres). Continuer ?')) {
    return;
  }
  
  if (!confirm('Are you really sure? This action is irreversible!')) {
    return;
  }
  
  // Créer un backup complet avant de réinitialiser
  const fullBackup = {
    flashcards: [...flashcards],
    translations: [...translations],
    flashcardFolders: {...flashcardFolders},
    userSettings: {...userSettings},
    timestamp: new Date().toISOString(),
    version: '1.0'
  };
  
  chrome.storage.local.set({ fullBackup }, () => {
    console.log('💾 Backup complet créé avant reset');
  });
  
  // Sauvegarder les flashcards actuelles pour pouvoir les supprimer du serveur
  const flashcardsToDelete = [...flashcards];
  
  // Réinitialiser toutes les données
  translations = [];
  flashcards = [];
  flashcardFolders = {
    default: { name: 'Non classées', icon: '📁' },
    favorites: { name: 'Favoris', icon: '⭐' },
    difficult: { name: 'Difficiles', icon: '🔥' },
    learned: { name: 'Maîtrisées', icon: '✅' }
  };
  
  // Réinitialiser les paramètres
  userSettings = {
    targetLanguage: 'fr',
    isEnabled: true,
    buttonColor: '#3b82f6',
    isPro: false,
    enableShortcut: true,
    deepSeekEnabled: false,
    deepSeekApiKey: '',
    autoDetectSameLanguage: true,
    showConfidence: true,
    animationsEnabled: true,
    hoverTranslation: true,
    immersionMode: false,
    autoSaveToFlashcards: false
  };
  
  // Sauvegarder
  chrome.storage.local.clear(() => {
    chrome.storage.sync.clear(async () => {
      saveSettings();
      
      // Supprimer aussi les flashcards du serveur si connecté
      const token = await authAPI.getToken();
      if (token) {
        try {
          // Supprimer toutes les flashcards sur le serveur
          const deletePromises = flashcardsToDelete
            .filter(card => card.id && !card.id.toString().startsWith('local_'))
            .map(card => flashcardsAPI.delete(card.id).catch(err => {
              console.error(`Erreur suppression ${card.id}:`, err);
            }));
          
          await Promise.all(deletePromises);
          console.log('✅ Toutes les flashcards supprimées du serveur lors du reset');
        } catch (error) {
          console.error('❌ Erreur lors de la suppression serveur:', error);
        }
      }
      
      // Ne sauvegarder que les traductions et les dossiers (pas les flashcards)
      chrome.storage.local.set({ 
        translations, 
        flashcardFolders 
      }, () => {
        initUI();
        showNotification('Application réinitialisée', 'info');
      });
    });
  });
}

// Gestion des onglets
function switchTab(tabName) {
  document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
  const selectedContent = document.getElementById(tabName);
  
  if (selectedTab) selectedTab.classList.add('active');
  if (selectedContent) selectedContent.classList.add('active');
  
  // Rafraîchir le contenu si nécessaire
  if (tabName === 'history') updateHistory();
  if (tabName === 'flashcards') updateFlashcards();
}

// Gestionnaire d'erreurs global
window.addEventListener('error', (e) => {
  console.error('❌ Global error:', e.message, e.filename, e.lineno, e.colno);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('❌ Unhandled promise rejection:', e.reason);
});

// Fonction pour vérifier si les éléments sont cliquables
function debugClickability() {
  console.log('🔍 Vérification de la cliquabilité des éléments...');
  
  // Vérifier le bouton de connexion
  const loginButton = document.getElementById('loginButton');
  if (loginButton) {
    console.log('Login button:', {
      exists: true,
      onclick: loginButton.onclick ? 'defined' : 'undefined',
      disabled: loginButton.disabled,
      style: loginButton.style.cssText
    });
  }
  
  // Vérifier tous les boutons
  const allButtons = document.querySelectorAll('button');
  console.log(`Total buttons found: ${allButtons.length}`);
  
  // Vérifier les onglets
  const navTabs = document.querySelectorAll('.nav-tab');
  console.log(`Nav tabs found: ${navTabs.length}`);
  navTabs.forEach(tab => {
    console.log('Tab:', tab.textContent.trim(), 'has onclick:', !!tab.onclick);
  });
  
  // Vérifier s'il y a des éléments qui bloquent
  const allElements = document.querySelectorAll('*');
  allElements.forEach(el => {
    const zIndex = window.getComputedStyle(el).zIndex;
    if (zIndex && zIndex !== 'auto' && parseInt(zIndex) > 1000) {
      console.warn('Element with high z-index:', el, zIndex);
    }
  });
}

// Event listeners principaux
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 DOMContentLoaded fired');
  
  // Réveiller le serveur dès le chargement
  if (API_CONFIG && API_CONFIG.wakeUpServer) {
    API_CONFIG.wakeUpServer().catch(() => {
      console.log('⏰ Tentative de réveil du serveur...');
    });
  }
  
  try {
    await loadData();
    await initUI();
    
    // Déboguer après un court délai
    setTimeout(debugClickability, 1000);
    
    // Debug: Vérifier les flashcards au démarrage
    console.log('🚀 Démarrage - Flashcards chargées:', flashcards.length);
    // Ne plus vérifier localStorage pour les flashcards
    console.log('📦 Flashcards uniquement sur le serveur maintenant');
    
    // Vérifier l'authentification au démarrage (en arrière-plan pour ne pas bloquer)
    // Mais pas trop souvent pour éviter les erreurs répétées
    const now = Date.now();
    if (now - lastAuthCheck > 30000) { // Vérifier max toutes les 30 secondes
      lastAuthCheck = now;
      
      setTimeout(async () => {
        const token = await authAPI.getToken();
        if (token) {
          try {
            // Vérifier la validité du token et récupérer les infos utilisateur
            const response = await apiRequest('/api/user/profile');
            if (response && response.user) {
              console.log('Utilisateur connecté:', response.user);
              updateUIAfterLogin(response.user);
              
              // Vérifier si c'est le même utilisateur
              const previousUserId = localStorage.getItem('lastUserId') || localStorage.getItem('lastDisconnectedUserId');
              const currentUserId = response.user.id || response.user._id;
              
              if (!previousUserId || previousUserId === currentUserId) {
                // Même utilisateur ou première connexion, garder les données locales
                console.log('✅ Même utilisateur, conservation des flashcards locales');
                localStorage.setItem('lastUserId', currentUserId);
              } else {
                // Utilisateur différent, charger ses flashcards depuis le serveur
                console.log('🔄 Utilisateur différent détecté au démarrage');
                flashcards = [];
                translations = [];
                localStorage.removeItem('translations');
                chrome.storage.local.remove(['translations']);
                localStorage.setItem('lastUserId', currentUserId);
                
                // NE PAS appeler syncFlashcardsAfterLogin ici - updateUIAfterLogin s'en charge
              }
            }
          } catch (error) {
            // Token invalide, mais c'est normal si l'utilisateur n'est pas connecté
            // Ne pas afficher d'erreur, juste mettre à jour l'UI silencieusement
            console.log('Pas d\'utilisateur connecté');
            window.currentUser = null;
            const loginButton = document.getElementById('loginButton');
            if (loginButton) {
              loginButton.innerHTML = '<span style="font-size: 14px;">🔒</span><span>Se connecter</span>';
              loginButton.onclick = () => showLoginWindow();
            }
          }
        }
      }, 0); // Exécuter après l'initialisation de l'UI
    }
    
    // Navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    // Event listener pour les traductions récentes
    const recentContainer = document.getElementById('recentTranslationsList');
    if (recentContainer) {
      recentContainer.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        
        const action = target.dataset.action;
        
        switch(action) {
          case 'copyTranslation':
            copyTranslation(target.dataset.text);
            break;
          case 'createFlashcard':
            createFlashcardFromHistory(
              target.dataset.original,
              target.dataset.translated,
              target.dataset.lang,
              target.dataset.sourceLang
            );
            break;
        }
      });
    }
    
    // Event listener pour l'historique
    const historyContainer = document.getElementById('historyList');
    if (historyContainer) {
      historyContainer.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        
        const action = target.dataset.action;
        
        switch(action) {
          case 'copyTranslation':
            copyTranslation(target.dataset.text);
            break;
          case 'createFlashcard':
            createFlashcardFromHistory(
              target.dataset.original,
              target.dataset.translated,
              target.dataset.lang,
              target.dataset.sourceLang
            );
            break;
          case 'deleteTranslation':
            deleteTranslation(parseInt(target.dataset.id));
            break;
        }
      });
    }
    
    // Bouton de connexion - configuration initiale
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
      // Vérifier si l'utilisateur est déjà connecté
      const isLoggedIn = !!window.currentUser;
      // Ne configurer les événements que si l'utilisateur n'est pas connecté
      if (!isLoggedIn) {
        // Effets hover
        loginButton.addEventListener('mouseenter', () => {
          loginButton.style.background = 'rgba(255,255,255,0.25)';
          loginButton.style.transform = 'translateY(-1px)';
          loginButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        });
        
        loginButton.addEventListener('mouseleave', () => {
          loginButton.style.background = 'rgba(255,255,255,0.15)';
          loginButton.style.transform = 'translateY(0)';
          loginButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        });
        
        // Ne pas ajouter un nouveau listener si onclick est déjà défini
        if (!loginButton.onclick) {
          loginButton.addEventListener('click', () => {
            // Ouvrir la fenêtre de login
            showLoginWindow();
          });
        }
      }
    }
    
    
    // Actions globales
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      
      const action = target.dataset.action;
      
      switch(action) {
        case 'clearHistory':
          clearHistory();
          break;
        case 'clearFlashcards':
          clearFlashcards(); // Async mais pas besoin d'await ici car gère ses propres erreurs
          break;
        case 'viewAllHistory':
          switchTab('history');
          break;
        case 'goToSettings':
          switchTab('settings');
          break;
        case 'importData':
          importData();
          break;
        case 'exportData':
          exportData();
          break;
        case 'resetApp':
          resetApp();
          break;
        case 'startPracticeMode':
          // Fonctionnalité temporairement désactivée
          showNotification('This feature is coming soon! 🚀', 'info');
          break;
      }
    });
    
    // Paramètres - Langue cible
    const targetLanguage = document.getElementById('targetLanguage');
    if (targetLanguage) {
      targetLanguage.addEventListener('change', (e) => {
        userSettings.targetLanguage = e.target.value;
        saveSettings();
        showNotification(`Langue cible: ${getLanguageName(e.target.value)}`, 'info');
      });
    }
    
    // Paramètres - Couleur du bouton
    const buttonColor = document.getElementById('buttonColor');
    if (buttonColor) {
      buttonColor.addEventListener('change', (e) => {
        userSettings.buttonColor = e.target.value;
        saveSettings();
        
        // Mettre à jour immédiatement l'icône
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
              action: 'updateButtonColor',
              color: e.target.value
            }).catch(() => {});
          });
        });
        
        showNotification('Couleur mise à jour!', 'success');
      });
    }
    
    // Paramètres - Toggles avec gestion des fonctionnalités manquantes
    const toggles = [
      { 
        id: 'enabledToggle', 
        setting: 'isEnabled', 
        label: 'Extension',
        action: (enabled) => {
          chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, {
                action: 'toggleExtension',
                enabled: enabled
              }).catch(() => {});
            }
          });
        }
      },
      { 
        id: 'shortcutToggle', 
        setting: 'enableShortcut', 
        label: 'Raccourci' 
      },
      { 
        id: 'smartDetectionToggle', 
        setting: 'autoDetectSameLanguage', 
        label: 'Détection intelligente' 
      },
      { 
        id: 'animationsToggle', 
        setting: 'animationsEnabled', 
        label: 'Animations',
        action: (enabled) => {
          if (!enabled) {
            document.body.classList.add('no-animations');
          } else {
            document.body.classList.remove('no-animations');
          }
        }
      },
      {
        id: 'autoSaveToggle',
        setting: 'autoSaveToFlashcards',
        label: 'Sauvegarde automatique',
        action: (enabled) => {
          // Notifier les content scripts du changement
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
              chrome.tabs.sendMessage(tab.id, {
                action: 'updateSettings',
                settings: { autoSaveToFlashcards: enabled }
              }).catch(() => {});
            });
          });
        }
      }
    ];
    
    // IMPORTANT: Créer les toggles manquants dynamiquement
    setTimeout(() => {
      const settingsSection = document.querySelector('.settings-section:nth-of-type(2)');
      if (settingsSection) {
        // Ajouter les toggles manquants
        const missingToggles = [
          { 
            id: 'hoverToggle',
            setting: 'hoverTranslation', 
            label: 'Translation on hover',
            description: 'Traduit automatiquement après 1 seconde de sélection'
          },
          { 
            id: 'immersionToggle',
            setting: 'immersionMode', 
            label: 'Mode immersion',
            description: 'Ajoute des indicateurs de traduction sur les éléments de la page'
          },
          { 
            id: 'autoSaveToggle',
            setting: 'autoSaveToFlashcards', 
            label: 'Sauvegarde automatique',
            description: 'Crée automatiquement une flashcard après chaque traduction'
          }
        ];
        
        missingToggles.forEach(toggle => {
          // Vérifier si le toggle n'existe pas déjà
          if (!document.getElementById(toggle.id)) {
            const settingRow = document.createElement('div');
            settingRow.className = 'setting-row';
            settingRow.innerHTML = `
              <div class="setting-info">
                <div class="setting-label">${toggle.label}</div>
                <div class="setting-description">${toggle.description}</div>
              </div>
              <div class="toggle-switch ${userSettings[toggle.setting] ? 'active' : ''}" id="${toggle.id}"></div>
            `;
            settingsSection.appendChild(settingRow);
            
            // Ajouter l'event listener
            const toggleElement = document.getElementById(toggle.id);
            if (toggleElement) {
              toggleElement.addEventListener('click', () => {
                userSettings[toggle.setting] = !userSettings[toggle.setting];
                toggleElement.classList.toggle('active', userSettings[toggle.setting]);
                saveSettings();
                showNotification(`${toggle.label} ${userSettings[toggle.setting] ? 'activé' : 'désactivé'}`, 'info');
              });
            }
          }
        });
      }
    }, 100);
    
    toggles.forEach(({ id, setting, label, action }) => {
      const toggle = document.getElementById(id);
      if (toggle) {
        toggle.addEventListener('click', () => {
          userSettings[setting] = !userSettings[setting];
          toggle.classList.toggle('active', userSettings[setting]);
          saveSettings();
          
          if (action) {
            action(userSettings[setting]);
          }
          
          showNotification(`${label} ${userSettings[setting] ? 'activé' : 'désactivé'}`, 'info');
        });
      }
    });
    
    // DeepSeek settings - Nouveau comportement
    const deepSeekToggle = document.getElementById('deepSeekToggle');
    const deepSeekStatus = document.getElementById('deepSeekStatus');
    
    if (deepSeekToggle) {
      // Initialiser l'état du toggle selon le statut de connexion/premium
      const isLoggedIn = !!window.currentUser; // Vérifier le statut de connexion réel
      const isPremium = window.currentUser?.isPremium || false;  // Vérifier le statut premium réel
      
      // Désactiver le toggle si non connecté ou non premium
      if (!isLoggedIn) {
        deepSeekToggle.classList.add('disabled');
        deepSeekToggle.style.opacity = '0.5';
        deepSeekToggle.style.cursor = 'not-allowed';
        deepSeekToggle.title = 'Vous devez vous connecter';
        
        if (deepSeekStatus) {
          deepSeekStatus.innerHTML = '<span>ℹ️</span><span>Connectez-vous pour accéder à DeepSeek AI</span>';
        }
      } else if (!isPremium) {
        deepSeekToggle.classList.add('disabled');
        deepSeekToggle.style.opacity = '0.5';
        deepSeekToggle.style.cursor = 'not-allowed';
        deepSeekToggle.title = 'Vous devez souscrire à Premium';
        
        if (deepSeekStatus) {
          deepSeekStatus.innerHTML = '<span>ℹ️</span><span>Vous devez souscrire à Premium</span>';
        }
      }
      
      deepSeekToggle.addEventListener('click', async (e) => {
        // Récupérer l'état actuel de connexion
        const currentIsLoggedIn = !!window.currentUser;
        const currentIsPremium = window.currentUser?.isPremium || false;
        
        // Empêcher l'action si désactivé
        if (deepSeekToggle.classList.contains('disabled')) {
          e.preventDefault();
          e.stopPropagation();
          
          if (!currentIsLoggedIn) {
            showNotification('Vous devez vous connecter pour activer DeepSeek AI', 'warning');
          } else if (!currentIsPremium) {
            showNotification('Vous devez souscrire à Premium pour activer DeepSeek AI', 'warning');
          }
          return;
        }
        
        // Logique normale si connecté et premium
        userSettings.deepSeekEnabled = !userSettings.deepSeekEnabled;
        deepSeekToggle.classList.toggle('active', userSettings.deepSeekEnabled);
        
        saveSettings();
        await checkPremiumStatus();
        
        if (userSettings.deepSeekEnabled) {
          showNotification('DeepSeek AI activé!', 'success');
          if (deepSeekStatus) {
            deepSeekStatus.innerHTML = '<span>✅</span><span>DeepSeek AI activé</span>';
            deepSeekStatus.className = 'deepseek-status active';
          }
        } else {
          showNotification('DeepSeek AI désactivé', 'info');
          if (deepSeekStatus) {
            deepSeekStatus.innerHTML = '<span>❌</span><span>DeepSeek AI désactivé</span>';
            deepSeekStatus.className = 'deepseek-status inactive';
          }
        }
      });
    }
    
    // Rafraîchir périodiquement les stats uniquement
    // Ne pas recharger loadData() car cela peut écraser les flashcards en cours d'ajout
    setInterval(async () => {
      // await loadData(); // Commenté pour éviter l'écrasement des flashcards
      updateStats();
    }, 5000);
    
  } catch (error) {
    console.error('❌ Erreur initialisation:', error);
    // Ne pas afficher de notification d'erreur sauf si c'est vraiment critique
    // Car cela peut être juste un problème temporaire de connexion
    if (error.message && !error.message.includes('token')) {
      console.log('Erreur non critique, continuons sans notification');
    }
  }
});

// Écouter les changements dans chrome.storage pour mettre à jour l'UI
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    // Les flashcards ne sont plus stockées localement, uniquement sur le serveur
    // Ce code est gardé au cas où on voudrait réactiver le stockage local plus tard
    /*
    if (changes.flashcards) {
      console.log('📌 Flashcards mises à jour dans storage');
      if (changes.flashcards.newValue) {
        flashcards = changes.flashcards.newValue;
        console.log(`🔄 Mise à jour: ${flashcards.length} flashcards`);
        
        // Ne pas rafraîchir si on est en train de flip une carte ou d'ajouter une flashcard depuis le popup
        if (!isFlippingCard && !isAddingFlashcard) {
          // Rafraîchir l'affichage si on est sur l'onglet flashcards
          const activeTab = document.querySelector('.tab-content.active');
          if (activeTab && activeTab.id === 'flashcards') {
            // Debounce pour éviter les rafraîchissements multiples
            if (updateFlashcardsDebounce) clearTimeout(updateFlashcardsDebounce);
            updateFlashcardsDebounce = setTimeout(() => {
              console.log('🔄 Rafraîchissement de l\'affichage des flashcards');
              updateFlashcards();
            }, 100);
          }
        } else {
          console.log('⏸️ Rafraîchissement ignoré:', { isFlippingCard, isAddingFlashcard });
        }
        // Mettre à jour les stats
        updateStats();
      }
    }
    */
    
    // Gérer les changements de traductions
    if (changes.translations) {
      console.log('📌 Traductions mises à jour dans storage');
      if (changes.translations.newValue) {
        translations = changes.translations.newValue;
        console.log(`🔄 Mise à jour: ${translations.length} traductions`);
        
        // Rafraîchir l'affichage si on est sur l'onglet historique
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab && activeTab.id === 'history') {
          // Debounce pour éviter les rafraîchissements multiples
          if (updateHistoryDebounce) clearTimeout(updateHistoryDebounce);
          updateHistoryDebounce = setTimeout(() => {
            console.log('🔄 Rafraîchissement de l\'affichage de l\'historique');
            updateHistory();
          }, 100);
        }
        // Mettre à jour les stats
        updateStats();
      }
    }
  }
});

// Écouter les messages du background script pour OAuth
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Gérer l'ajout de flashcard depuis content.js
  if (message.action === 'flashcardAdded' && message.flashcard) {
    console.log('📥 Nouvelle flashcard reçue du content script');
    
    // Recharger les flashcards depuis le serveur
    setTimeout(async () => {
      await loadFlashcardsFromServer();
      updateStats();
    }, 500); // Petit délai pour laisser le temps au serveur
    return;
  }
  
  
  if (message.type === 'oauth-success' && message.token) {
    console.log('Message OAuth reçu avec token');
    
    // Annuler le timeout OAuth s'il existe
    if (oauthTimeoutId) {
      clearTimeout(oauthTimeoutId);
      oauthTimeoutId = null;
    }
    
    // Sauvegarder le token
    chrome.storage.local.set({ authToken: message.token }, async () => {
      try {
        const response = await apiRequest('/api/user/profile');
        if (response && response.user) {
          updateUIAfterLogin(response.user);
          // NE PAS appeler syncFlashcardsAfterLogin ici - updateUIAfterLogin s'en charge
          showNotification('Connexion réussie!', 'success');
        }
      } catch (error) {
        console.error('Erreur profil:', error);
        showNotification('Erreur lors de la récupération du profil', 'error');
        await authAPI.logout();
        resetUIAfterLogout();
      }
    });
  } else if (message.type === 'oauth-error') {
    console.error('Erreur OAuth reçue:', message.error);
    showNotification(`Erreur de connexion: ${message.error}`, 'error');
  }
});