// Variables globales
let userSettings = {};
let translations = [];
let flashcards = [];
let flashcardFolders = {
  default: { name: 'Non classées', icon: '📁' },
  favorites: { name: 'Favoris', icon: '⭐' },
  difficult: { name: 'Difficiles', icon: '🔥' },
  learned: { name: 'Maîtrisées', icon: '✅' }
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
        Supprimer ce dossier
      </div>
      <div class="menu-item js-export-folder" data-key="${key}" data-type="history" style="padding: 8px 16px; cursor: pointer; transition: background 0.2s;">
        <span style="margin-right: 8px;">📤</span>
        Exporter ce dossier
      </div>
    `;
  } else if (type === 'flashcards') {
    menu.innerHTML = `
      <div class="menu-item js-delete-flashcard-folder" data-key="${key}" style="padding: 8px 16px; cursor: pointer; transition: background 0.2s;">
        <span style="margin-right: 8px;">🗑️</span>
        Supprimer ce dossier
      </div>
      <div class="menu-item js-practice-folder" data-key="${key}" style="padding: 8px 16px; cursor: pointer; transition: background 0.2s;">
        <span style="margin-right: 8px;">🎮</span>
        Pratiquer ce dossier
      </div>
      <div class="menu-item js-export-folder" data-key="${key}" data-type="flashcards" style="padding: 8px 16px; cursor: pointer; transition: background 0.2s;">
        <span style="margin-right: 8px;">📤</span>
        Exporter ce dossier
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
    } else if (item.classList.contains('js-export-folder')) {
      exportFolderData(item.dataset.key, item.dataset.type);
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
  
  if (!confirm(`Supprimer ${count} traductions de ce dossier ?`)) return;
  
  translations = translations.filter(t => {
    const langs = [t.fromLang, t.toLang].sort();
    return `${langs[0]}_${langs[1]}` !== key;
  });
  
  chrome.storage.local.set({ translations }, () => {
    updateHistory();
    updateStats();
    showNotification('Dossier supprimé', 'info');
  });
}

function deleteFlashcardFolder(key) {
  const cards = flashcards.filter(card => {
    const fromLang = detectLanguage(card.front);
    const toLang = card.language;
    const langs = [fromLang, toLang].sort();
    return `${langs[0]}_${langs[1]}` === key;
  });
  
  if (!confirm(`Supprimer ${cards.length} flashcards de ce dossier ?`)) return;
  
  flashcards = flashcards.filter(card => {
    const fromLang = detectLanguage(card.front);
    const toLang = card.language;
    const langs = [fromLang, toLang].sort();
    return `${langs[0]}_${langs[1]}` !== key;
  });
  
  saveFlashcards();
  updateFlashcards();
  updateStats();
  showNotification('Dossier de flashcards supprimé', 'info');
}

function practiceFolder(key) {
  const cards = flashcards.filter(card => {
    const fromLang = detectLanguage(card.front);
    const toLang = card.language;
    const langs = [fromLang, toLang].sort();
    return `${langs[0]}_${langs[1]}` === key;
  });
  
  if (cards.length === 0) {
    showNotification('Aucune flashcard dans ce dossier!', 'warning');
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
      const fromLang = detectLanguage(card.front);
      const toLang = card.language;
      const langs = [fromLang, toLang].sort();
      return `${langs[0]}_${langs[1]}` === key;
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
  showNotification('Dossier exporté avec succès!', 'success');
}

function toggleFlashcardFolder(key) {
  console.log('toggleFlashcardFolder appelé avec key:', key);
  const folder = document.querySelector(`.flashcard-language-folder[data-key="${key}"]`);
  if (!folder) {
    console.error('Dossier flashcard non trouvé:', key);
    return;
  }
  
  const content = document.getElementById(`flashcard-folder-content-${key}`);
  const arrow = folder.querySelector('.folder-arrow');
  
  if (!content) {
    console.error('Contenu flashcard non trouvé:', `flashcard-folder-content-${key}`);
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
      fromLang: detectLanguage(card.front),
      toLang: card.language
    })).filter(card => {
      const langs = [card.fromLang, card.toLang].sort();
      return `${langs[0]}_${langs[1]}` === key;
    });
    
    grid.innerHTML = renderFlashcards(cards, toLang, fromLang);
  }
}

function flipCard(cardId) {
  console.log('flipCard appelé avec cardId:', cardId);
  
  const card = flashcards.find(c => c.id === parseInt(cardId));
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
    saveFlashcards();
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

function deleteFlashcard(cardId) {
  if (!confirm('Supprimer cette flashcard ?')) return;
  
  const cardIdInt = parseInt(cardId);
  flashcards = flashcards.filter(c => c.id !== cardIdInt);
  
  // Supprimer aussi du localStorage
  chrome.storage.sync.get(['flashcards'], (result) => {
    const storedFlashcards = result.flashcards || [];
    const updatedFlashcards = storedFlashcards.filter(c => c.id !== cardIdInt);
    chrome.storage.sync.set({ flashcards: updatedFlashcards }, () => {
      console.log('Flashcard supprimée du storage');
    });
  });
  
  saveFlashcards();
  updateFlashcards();
  updateStats();
  
  showNotification('Flashcard supprimée', 'info');
}

function showFlashcardTips() {
  alert(`💡 Conseils pour utiliser les flashcards:

1. 📝 Créez des flashcards après chaque traduction importante
2. 🎯 Pratiquez régulièrement avec le Mode Pratique
3. ⭐ Marquez vos cartes favorites pour les réviser plus souvent
4. 🔥 Les cartes difficiles seront prioritaires en pratique
5. ✅ Les cartes maîtrisées apparaîtront moins souvent

Astuce: Utilisez les dossiers pour organiser vos cartes par thème!`);
}

function startPracticeMode() {
  if (flashcards.length === 0) {
    showNotification('Aucune flashcard disponible pour la pratique!', 'warning');
    return;
  }
  
  // Afficher la sélection de langue
  const container = document.getElementById('flashcardsList');
  if (!container) return;
  
  // Obtenir toutes les langues disponibles
  const languages = new Set();
  flashcards.forEach(card => {
    languages.add(card.language);
    languages.add(detectLanguage(card.front));
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
  let practiceCards = flashcards.filter(card => 
    selectedLangs.includes(card.language) || 
    selectedLangs.includes(detectLanguage(card.front))
  );
  
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
    showNotification('Traduction copiée!', 'success');
  }).catch(() => {
    showNotification('Erreur lors de la copie', 'error');
  });
}

function createFlashcardFromHistory(original, translated, language) {
  // Vérifier les limites pour les utilisateurs gratuits
  if (!checkLimits('flashcard')) return;
  
  const flashcard = {
    id: Date.now(),
    front: original,
    back: translated,
    language: language,
    created: new Date().toISOString(),
    folder: 'default',
    reviews: 0,
    lastReview: null,
    difficulty: 'normal'
  };
  
  // Vérifier si elle existe déjà
  const exists = flashcards.some(f => 
    f.front.toLowerCase() === original.toLowerCase() && 
    f.back.toLowerCase() === translated.toLowerCase()
  );
  
  if (exists) {
    showNotification('Cette flashcard existe déjà!', 'warning');
    return;
  }
  
  flashcards.unshift(flashcard);
  saveFlashcards();
  updateStats();
  showNotification('Flashcard créée avec succès!', 'success');
}

function deleteTranslation(id) {
  if (!confirm('Supprimer cette traduction ?')) return;
  
  translations = translations.filter(t => t.id !== parseInt(id));
  chrome.storage.local.set({ translations }, () => {
    updateHistory();
    updateStats();
    showNotification('Traduction supprimée', 'info');
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
function checkLimits(type = 'translation') {
  if (userSettings.isPro) return true; // Pas de limites pour Premium
  
  if (type === 'flashcard') {
    // Limite de flashcards
    if (flashcards.length >= 100) {
      showNotification('Limite atteinte! Passez à Premium pour créer plus de flashcards', 'warning');
      showPremiumPrompt();
      return false;
    }
  } else if (type === 'translation') {
    // Limite de traductions par jour
    const today = new Date().toDateString();
    const todayTranslations = translations.filter(t => 
      new Date(t.timestamp).toDateString() === today
    ).length;
    
    if (todayTranslations >= 50) {
      showNotification('Limite quotidienne atteinte! Passez à Premium pour des traductions illimitées', 'warning');
      showPremiumPrompt();
      return false;
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
    }, (settings) => {
      userSettings = settings;
      console.log('⚙️ Paramètres chargés:', userSettings);
      
      chrome.storage.local.get({
        translations: [],
        flashcards: [],
        flashcardFolders: flashcardFolders,
        totalTranslations: 0
      }, (data) => {
        translations = data.translations || [];
        flashcards = data.flashcards || [];
        flashcardFolders = data.flashcardFolders || flashcardFolders;
        
        // Migrer les anciennes flashcards sans dossier
        flashcards = flashcards.map(card => ({
          ...card,
          folder: card.folder || 'default',
          reviews: card.reviews || 0,
          lastReview: card.lastReview || null,
          difficulty: card.difficulty || 'normal'
        }));
        
        console.log('📊 Données chargées:', {
          translations: translations.length,
          flashcards: flashcards.length
        });
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
  const deepSeekToggle = document.getElementById('deepSeekToggle');
  const deepSeekApiKey = document.getElementById('deepSeekApiKey');
  const deepSeekApiGroup = document.getElementById('deepSeekApiGroup');
  
  if (targetLanguage) targetLanguage.value = userSettings.targetLanguage;
  if (buttonColor) buttonColor.value = userSettings.buttonColor;
  if (enabledToggle) enabledToggle.classList.toggle('active', userSettings.isEnabled);
  if (shortcutToggle) shortcutToggle.classList.toggle('active', userSettings.enableShortcut);
  if (smartDetectionToggle) smartDetectionToggle.classList.toggle('active', userSettings.autoDetectSameLanguage);
  if (animationsToggle) animationsToggle.classList.toggle('active', userSettings.animationsEnabled);
  
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
            <span class="translation-action" data-action="createFlashcard" data-original="${escapeHtml(t.original)}" data-translated="${escapeHtml(t.translated)}" data-lang="${t.toLang}">💾 Flashcard</span>
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
            <span class="translation-action" data-action="createFlashcard" data-original="${escapeHtml(displayOriginal)}" data-translated="${escapeHtml(displayTranslated)}" data-lang="${displayToLang}">💾</span>
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
    const fromLang = detectLanguage(card.front);
    const toLang = card.language;
    
    if (fromLang === toLang) return;
    
    const langs = [fromLang, toLang].sort();
    const key = `${langs[0]}_${langs[1]}`;
    
    if (!grouped[key]) {
      grouped[key] = {
        langs: langs,
        cards: [],
        primaryDirection: `${fromLang}_${toLang}`,
        currentDirection: `${fromLang}_${toLang}`
      };
    }
    
    grouped[key].cards.push({...card, fromLang, toLang});
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
        // Ne pas déclencher si on clique sur un bouton
        if (e.target.closest('button')) return;
        
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
          flipCard(parseInt(cardId));
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
            <div class="flashcard-actions" style="margin-top: 12px; display: flex; justify-content: center; gap: 8px;">
              <button class="btn btn-sm js-card-action" data-action="favorite" data-card-id="${card.id}" title="Favori">⭐</button>
              <button class="btn btn-sm js-card-action" data-action="difficult" data-card-id="${card.id}" title="Difficile">🔥</button>
              <button class="btn btn-sm js-card-action" data-action="learned" data-card-id="${card.id}" title="Maîtrisée">✅</button>
              <button class="btn btn-sm btn-danger js-card-action" data-action="delete" data-card-id="${card.id}" title="Supprimer">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Sauvegarder les flashcards
function saveFlashcards() {
  chrome.storage.local.set({ flashcards }, () => {
    console.log('💾 Flashcards sauvegardées');
  });
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
            <span>${getFlagEmoji(detectLanguage(currentCard.front))}</span>
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
        
        <div style="text-align: center;">
          <a href="#" style="color: #667eea; font-size: 13px; text-decoration: none; margin-right: 12px;">Mot de passe oublié ?</a>
          <span style="color: #d1d5db;">•</span>
          <a href="#" style="color: #667eea; font-size: 13px; text-decoration: none; margin-left: 12px;">Créer un compte</a>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(loginModal);
  
  // Event listeners
  loginModal.querySelector('.js-login-cancel').addEventListener('click', () => {
    loginModal.remove();
  });
  
  loginModal.querySelector('.js-login-submit').addEventListener('click', () => {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
      showNotification('Veuillez remplir tous les champs', 'warning');
      return;
    }
    
    // TODO: Implémenter la vraie logique de connexion
    showNotification('Connexion en cours...', 'info');
    
    // Simuler une connexion
    setTimeout(() => {
      loginModal.remove();
      showNotification('Connexion réussie!', 'success');
      
      // Mettre à jour l'interface
      const loginButton = document.getElementById('loginButton');
      if (loginButton) {
        loginButton.innerHTML = '<span style="font-size: 14px;">✅</span><span>Connecté</span>';
        loginButton.style.background = 'rgba(16, 185, 129, 0.3)';
        loginButton.style.borderColor = 'rgba(16, 185, 129, 0.5)';
        loginButton.style.cursor = 'default';
        
        // Supprimer les event listeners hover
        loginButton.onmouseenter = null;
        loginButton.onmouseleave = null;
      }
    }, 1500);
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
}

// Effacer tout l'historique
function clearHistory() {
  if (!confirm('Effacer tout l\'historique des traductions ?')) return;
  
  translations = [];
  chrome.storage.local.set({ translations }, () => {
    updateHistory();
    updateStats();
    showNotification('Historique effacé', 'info');
  });
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
        
        // Sauvegarder
        chrome.storage.local.set({ 
          translations, 
          flashcards, 
          flashcardFolders 
        }, () => {
          initUI();
          showNotification('Données importées avec succès!', 'success');
        });
      }
    } catch (error) {
      showNotification('Erreur lors de l\'import: ' + error.message, 'error');
    }
  };
  
  input.click();
}

// Réinitialiser l'application
function resetApp() {
  if (!confirm('⚠️ Attention! Ceci supprimera toutes vos données (traductions, flashcards, paramètres). Continuer ?')) {
    return;
  }
  
  if (!confirm('Êtes-vous vraiment sûr ? Cette action est irréversible!')) {
    return;
  }
  
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
    chrome.storage.sync.clear(() => {
      saveSettings();
      chrome.storage.local.set({ 
        translations, 
        flashcards, 
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

// Event listeners principaux
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadData();
    await initUI();
    
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
              target.dataset.lang
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
              target.dataset.lang
            );
            break;
          case 'deleteTranslation':
            deleteTranslation(parseInt(target.dataset.id));
            break;
        }
      });
    }
    
    // Bouton de connexion
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
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
      
      loginButton.addEventListener('click', () => {
        // Ouvrir la fenêtre de login
        showLoginWindow();
      });
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
        case 'viewAllHistory':
          switchTab('history');
          break;
        case 'goToSettings':
          switchTab('settings');
          break;
        case 'importData':
          importData();
          break;
        case 'resetApp':
          resetApp();
          break;
        case 'startPracticeMode':
          // Fonctionnalité temporairement désactivée
          showNotification('Cette fonctionnalité arrive bientôt! 🚀', 'info');
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
            label: 'Traduction au survol',
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
      const isLoggedIn = false; // TODO: vérifier le statut de connexion réel
      const isPremium = false;  // TODO: vérifier le statut premium réel
      
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
        // Empêcher l'action si désactivé
        if (deepSeekToggle.classList.contains('disabled')) {
          e.preventDefault();
          e.stopPropagation();
          
          if (!isLoggedIn) {
            showNotification('Vous devez vous connecter pour activer DeepSeek AI', 'warning');
          } else if (!isPremium) {
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
    
    // Rafraîchir périodiquement
    setInterval(async () => {
      await loadData();
      updateStats();
    }, 5000);
    
  } catch (error) {
    console.error('❌ Erreur initialisation:', error);
    showNotification('Erreur lors du chargement', 'error');
  }
});