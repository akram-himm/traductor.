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

// IMPORTANT: Déclarer les fonctions globales AVANT leur utilisation
window.toggleFolder = function(key) {
  const folder = document.querySelector(`.language-folder[data-key="${key}"]`);
  if (!folder) return;
  
  const content = document.getElementById(`folder-content-${key}`);
  const arrow = folder.querySelector('.folder-arrow');
  
  if (!content) return;
  
  const isExpanded = folder.classList.contains('expanded');
  
  if (isExpanded) {
    folder.classList.remove('expanded');
    content.style.maxHeight = '0';
    content.style.overflow = 'hidden';
    setTimeout(() => {
      content.style.display = 'none';
    }, 300);
    if (arrow) arrow.style.transform = 'rotate(0deg)';
  } else {
    folder.classList.add('expanded');
    content.style.display = 'block';
    const height = content.scrollHeight;
    content.style.maxHeight = height + 'px';
    content.style.overflow = 'visible';
    if (arrow) arrow.style.transform = 'rotate(90deg)';
  }
};

window.swapLanguages = function(key, currentDirection) {
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
      <button class="folder-swap" onclick="event.stopPropagation(); swapLanguages('${key}', '${newDirection}')">
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
};

window.toggleFlashcardFolder = function(key) {
  const folder = document.querySelector(`.flashcard-language-folder[data-key="${key}"]`);
  if (!folder) return;
  
  const content = document.getElementById(`flashcard-folder-content-${key}`);
  const arrow = folder.querySelector('.folder-arrow');
  
  if (!content) return;
  
  const isExpanded = folder.classList.contains('expanded');
  
  if (isExpanded) {
    folder.classList.remove('expanded');
    content.style.maxHeight = '0';
    content.style.overflow = 'hidden';
    setTimeout(() => {
      content.style.display = 'none';
    }, 300);
    if (arrow) arrow.style.transform = 'rotate(0deg)';
  } else {
    folder.classList.add('expanded');
    content.style.display = 'block';
    const height = content.scrollHeight;
    content.style.maxHeight = height + 'px';
    content.style.overflow = 'visible';
    if (arrow) arrow.style.transform = 'rotate(90deg)';
  }
};

window.swapFlashcardLanguages = function(key, currentDirection) {
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
      <button class="folder-swap" onclick="event.stopPropagation(); swapFlashcardLanguages('${key}', '${newDirection}')">
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
};

window.flipCard = function(cardId) {
  const card = flashcards.find(c => c.id === parseInt(cardId));
  if (!card) return;
  
  const front = document.getElementById(`front-${cardId}`);
  const back = document.getElementById(`back-${cardId}`);
  const cardEl = document.querySelector(`[data-id="${cardId}"]`);
  
  if (front && back && cardEl) {
    if (front.style.display === 'none') {
      // Retourner vers l'avant
      front.style.display = 'block';
      back.style.display = 'none';
      cardEl.classList.remove('flipped');
    } else {
      // Retourner vers l'arrière
      front.style.display = 'none';
      back.style.display = 'block';
      cardEl.classList.add('flipped');
      
      // Mettre à jour les statistiques de révision
      card.reviews = (card.reviews || 0) + 1;
      card.lastReview = new Date().toISOString();
      saveFlashcards();
    }
  }
};

window.moveToFolder = function(cardId, folderId) {
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
};

window.deleteFlashcard = function(cardId) {
  if (!confirm('Supprimer cette flashcard ?')) return;
  
  flashcards = flashcards.filter(c => c.id !== parseInt(cardId));
  saveFlashcards();
  updateFlashcards();
  updateStats();
  
  showNotification('Flashcard supprimée', 'info');
};

window.showFlashcardTips = function() {
  alert(`💡 Conseils pour utiliser les flashcards:

1. 📝 Créez des flashcards après chaque traduction importante
2. 🎯 Pratiquez régulièrement avec le Mode Pratique
3. ⭐ Marquez vos cartes favorites pour les réviser plus souvent
4. 🔥 Les cartes difficiles seront prioritaires en pratique
5. ✅ Les cartes maîtrisées apparaîtront moins souvent

Astuce: Utilisez les dossiers pour organiser vos cartes par thème!`);
};

window.startPracticeMode = function() {
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
        <button class="btn btn-primary btn-lg" onclick="launchPractice()" style="min-width: 200px;">
          🚀 Commencer la pratique
        </button>
        <button class="btn btn-secondary" onclick="updateFlashcards()" style="margin-left: 12px;">
          Annuler
        </button>
      </div>
    </div>
  `;
};

window.launchPractice = function() {
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
};

window.checkAnswer = function() {
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
};

window.showHint = function() {
  const currentCard = practiceMode.cards[practiceMode.currentIndex];
  const hint = currentCard.back.substring(0, Math.ceil(currentCard.back.length / 3)) + '...';
  
  showNotification(`Indice: "${hint}"`, 'info');
};

window.skipQuestion = function() {
  practiceMode.score.incorrect++;
  nextQuestion();
};

window.nextQuestion = function() {
  practiceMode.currentIndex++;
  
  if (practiceMode.currentIndex >= practiceMode.cards.length) {
    showPracticeResults();
  } else {
    displayPracticeMode();
  }
};

window.quitPractice = function() {
  practiceMode.active = false;
  updateFlashcards();
};

window.copyTranslation = function(text) {
  navigator.clipboard.writeText(text).then(() => {
    showNotification('Traduction copiée!', 'success');
  }).catch(() => {
    showNotification('Erreur lors de la copie', 'error');
  });
};

window.createFlashcardFromHistory = function(original, translated, language) {
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
};

window.deleteTranslation = function(id) {
  if (!confirm('Supprimer cette traduction ?')) return;
  
  translations = translations.filter(t => t.id !== parseInt(id));
  chrome.storage.local.set({ translations }, () => {
    updateHistory();
    updateStats();
    showNotification('Traduction supprimée', 'info');
  });
};

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
      animationsEnabled: true
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
  // Badges
  const proBadge = document.getElementById('proBadge');
  const deepSeekBadge = document.getElementById('deepSeekBadge');
  const premiumBanner = document.getElementById('premiumBanner');
  
  if (proBadge) {
    proBadge.style.display = userSettings.isPro ? 'flex' : 'none';
  }
  
  if (deepSeekBadge) {
    deepSeekBadge.style.display = userSettings.deepSeekEnabled ? 'flex' : 'none';
  }
  
  if (premiumBanner) {
    premiumBanner.style.display = userSettings.deepSeekEnabled ? 'none' : 'block';
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
    deepSeekToggle.classList.toggle('active', userSettings.deepSeekEnabled);
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
        <div class="folder-header" onclick="toggleFolder('${key}')">
          <div class="folder-info">
            <div class="folder-langs" id="folder-langs-${key}">
              <span>${getFlagEmoji(fromLang)} ${getLanguageName(fromLang)}</span>
              <span>→</span>
              <span>${getFlagEmoji(toLang)} ${getLanguageName(toLang)}</span>
              <button class="folder-swap" onclick="event.stopPropagation(); swapLanguages('${key}', '${currentDirection}')">
                ↔️
              </button>
            </div>
            <div class="folder-count">
              ${totalCount} traductions
            </div>
          </div>
          <div class="folder-toggle">
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

// Basculer l'affichage d'un dossier
function toggleFolder(key) {
  const folder = document.querySelector(`.language-folder[data-key="${key}"]`);
  if (!folder) return;
  
  const content = document.getElementById(`folder-content-${key}`);
  const arrow = folder.querySelector('.folder-arrow');
  
  if (!content) return;
  
  const isExpanded = folder.classList.contains('expanded');
  
  if (isExpanded) {
    folder.classList.remove('expanded');
    content.style.maxHeight = '0';
    content.style.overflow = 'hidden';
    setTimeout(() => {
      content.style.display = 'none';
    }, 300);
    if (arrow) arrow.style.transform = 'rotate(0deg)';
  } else {
    folder.classList.add('expanded');
    content.style.display = 'block';
    const height = content.scrollHeight;
    content.style.maxHeight = height + 'px';
    content.style.overflow = 'visible';
    if (arrow) arrow.style.transform = 'rotate(90deg)';
  }
}

// Échanger les langues dans un dossier
function swapLanguages(key, currentDirection) {
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
      <button class="folder-swap" onclick="event.stopPropagation(); swapLanguages('${key}', '${newDirection}')">
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
        <button class="btn btn-primary" style="margin-top: 16px;" onclick="showFlashcardTips()">
          💡 Comment utiliser les flashcards
        </button>
      </div>
    `;
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
        <div class="folder-header" onclick="toggleFlashcardFolder('${key}')">
          <div class="folder-info">
            <div class="folder-langs" id="flashcard-folder-langs-${key}">
              <span>${getFlagEmoji(fromLang)} ${getLanguageName(fromLang)}</span>
              <span>→</span>
              <span>${getFlagEmoji(toLang)} ${getLanguageName(toLang)}</span>
              <button class="folder-swap" onclick="event.stopPropagation(); swapFlashcardLanguages('${key}', '${currentDirection}')">
                ↔️
              </button>
            </div>
            <div class="folder-count">
              ${totalCount} flashcards
            </div>
          </div>
          <div class="folder-toggle">
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
      <div class="flashcard" data-id="${card.id}" onclick="flipCard(${card.id})">
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
              <button class="btn btn-sm" onclick="event.stopPropagation(); moveToFolder(${card.id}, 'favorites')" title="Favori">⭐</button>
              <button class="btn btn-sm" onclick="event.stopPropagation(); moveToFolder(${card.id}, 'difficult')" title="Difficile">🔥</button>
              <button class="btn btn-sm" onclick="event.stopPropagation(); moveToFolder(${card.id}, 'learned')" title="Maîtrisée">✅</button>
              <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteFlashcard(${card.id})" title="Supprimer">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Basculer l'affichage d'un dossier de flashcards
function toggleFlashcardFolder(key) {
  const folder = document.querySelector(`.flashcard-language-folder[data-key="${key}"]`);
  if (!folder) return;
  
  const content = document.getElementById(`flashcard-folder-content-${key}`);
  const arrow = folder.querySelector('.folder-arrow');
  
  if (!content) return;
  
  const isExpanded = folder.classList.contains('expanded');
  
  if (isExpanded) {
    folder.classList.remove('expanded');
    content.style.maxHeight = '0';
    content.style.overflow = 'hidden';
    setTimeout(() => {
      content.style.display = 'none';
    }, 300);
    if (arrow) arrow.style.transform = 'rotate(0deg)';
  } else {
    folder.classList.add('expanded');
    content.style.display = 'block';
    const height = content.scrollHeight;
    content.style.maxHeight = height + 'px';
    content.style.overflow = 'visible';
    if (arrow) arrow.style.transform = 'rotate(90deg)';
  }
}

// Échanger les langues dans un dossier de flashcards
function swapFlashcardLanguages(key, currentDirection) {
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
      <button class="folder-swap" onclick="event.stopPropagation(); swapFlashcardLanguages('${key}', '${newDirection}')">
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

// Retourner une carte
function flipCard(cardId) {
  const card = flashcards.find(c => c.id === parseInt(cardId));
  if (!card) return;
  
  const front = document.getElementById(`front-${cardId}`);
  const back = document.getElementById(`back-${cardId}`);
  const cardEl = document.querySelector(`[data-id="${cardId}"]`);
  
  if (front && back && cardEl) {
    if (front.style.display === 'none') {
      // Retourner vers l'avant
      front.style.display = 'block';
      back.style.display = 'none';
      cardEl.classList.remove('flipped');
    } else {
      // Retourner vers l'arrière
      front.style.display = 'none';
      back.style.display = 'block';
      cardEl.classList.add('flipped');
      
      // Mettre à jour les statistiques de révision
      card.reviews = (card.reviews || 0) + 1;
      card.lastReview = new Date().toISOString();
      saveFlashcards();
    }
  }
}

// Déplacer une carte vers un dossier
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

// Supprimer une flashcard
function deleteFlashcard(cardId) {
  if (!confirm('Supprimer cette flashcard ?')) return;
  
  flashcards = flashcards.filter(c => c.id !== parseInt(cardId));
  saveFlashcards();
  updateFlashcards();
  updateStats();
  
  showNotification('Flashcard supprimée', 'info');
}

// Sauvegarder les flashcards
function saveFlashcards() {
  chrome.storage.local.set({ flashcards }, () => {
    console.log('💾 Flashcards sauvegardées');
  });
}

// Mode pratique
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
        <button class="btn btn-primary btn-lg" onclick="launchPractice()" style="min-width: 200px;">
          🚀 Commencer la pratique
        </button>
        <button class="btn btn-secondary" onclick="updateFlashcards()" style="margin-left: 12px;">
          Annuler
        </button>
      </div>
    </div>
  `;
}

// Lancer la pratique avec les options sélectionnées
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
          <button onclick="checkAnswer()" id="checkBtn" class="btn btn-primary">
            Vérifier
          </button>
          <button onclick="showHint()" class="btn btn-secondary">
            💡 Indice
          </button>
          <button onclick="skipQuestion()" class="btn btn-secondary">
            Passer →
          </button>
          <button onclick="quitPractice()" class="btn btn-danger">
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
  }, 100);
}

// Vérifier la réponse
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

// Afficher un indice
function showHint() {
  const currentCard = practiceMode.cards[practiceMode.currentIndex];
  const hint = currentCard.back.substring(0, Math.ceil(currentCard.back.length / 3)) + '...';
  
  showNotification(`Indice: "${hint}"`, 'info');
}

// Passer à la question suivante
function skipQuestion() {
  practiceMode.score.incorrect++;
  nextQuestion();
}

// Question suivante
function nextQuestion() {
  practiceMode.currentIndex++;
  
  if (practiceMode.currentIndex >= practiceMode.cards.length) {
    showPracticeResults();
  } else {
    displayPracticeMode();
  }
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
        <button onclick="startPracticeMode()" class="btn btn-primary">
          🔄 Recommencer
        </button>
        <button onclick="quitPractice()" class="btn btn-secondary">
          📚 Retour aux flashcards
        </button>
      </div>
    </div>
  `;
}

// Quitter le mode pratique
function quitPractice() {
  practiceMode.active = false;
  updateFlashcards();
}

// Créer une flashcard depuis l'historique
function createFlashcardFromHistory(original, translated, language) {
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
    'es': '🇪🇸',
    'de': '🇩🇪',
    'it': '🇮🇹',
    'pt': '🇵🇹',
    'ru': '🇷🇺',
    'ja': '🇯🇵',
    'ko': '🇰🇷',
    'zh': '🇨🇳',
    'ar': '🇸🇦',
    'auto': '🌐'
  };
  
  return flags[langCode] || '🌐';
}

function getLanguageName(langCode) {
  const names = {
    'fr': 'Français',
    'en': 'English',
    'es': 'Español',
    'de': 'Deutsch',
    'it': 'Italiano',
    'pt': 'Português',
    'ru': 'Русский',
    'ja': '日本語',
    'ko': '한국어',
    'zh': '中文',
    'ar': 'العربية',
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
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Copier une traduction
function copyTranslation(text) {
  navigator.clipboard.writeText(text).then(() => {
    showNotification('Traduction copiée!', 'success');
  }).catch(() => {
    showNotification('Erreur lors de la copie', 'error');
  });
}

// Supprimer une traduction
function deleteTranslation(id) {
  if (!confirm('Supprimer cette traduction ?')) return;
  
  translations = translations.filter(t => t.id !== parseInt(id));
  chrome.storage.local.set({ translations }, () => {
    updateHistory();
    updateStats();
    showNotification('Traduction supprimée', 'info');
  });
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

// Exporter les données
function exportData() {
  const data = {
    translations: translations,
    flashcards: flashcards,
    flashcardFolders: flashcardFolders,
    settings: userSettings,
    exportDate: new Date().toISOString(),
    version: '3.0'
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `quick-translator-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  showNotification('Données exportées avec succès!', 'success');
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
    animationsEnabled: true
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

// Afficher les conseils pour les flashcards
function showFlashcardTips() {
  alert(`💡 Conseils pour utiliser les flashcards:

1. 📝 Créez des flashcards après chaque traduction importante
2. 🎯 Pratiquez régulièrement avec le Mode Pratique
3. ⭐ Marquez vos cartes favorites pour les réviser plus souvent
4. 🔥 Les cartes difficiles seront prioritaires en pratique
5. ✅ Les cartes maîtrisées apparaîtront moins souvent

Astuce: Utilisez les dossiers pour organiser vos cartes par thème!`);
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
        case 'exportData':
          exportData();
          break;
        case 'importData':
          importData();
          break;
        case 'resetApp':
          resetApp();
          break;
        case 'startPracticeMode':
          startPracticeMode();
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
    
    // Paramètres - Toggles
    const toggles = [
      { id: 'enabledToggle', setting: 'isEnabled', label: 'Extension' },
      { id: 'shortcutToggle', setting: 'enableShortcut', label: 'Raccourci' },
      { id: 'smartDetectionToggle', setting: 'autoDetectSameLanguage', label: 'Détection intelligente' },
      { id: 'animationsToggle', setting: 'animationsEnabled', label: 'Animations' }
    ];
    
    toggles.forEach(({ id, setting, label }) => {
      const toggle = document.getElementById(id);
      if (toggle) {
        toggle.addEventListener('click', () => {
          userSettings[setting] = !userSettings[setting];
          toggle.classList.toggle('active', userSettings[setting]);
          saveSettings();
          showNotification(`${label} ${userSettings[setting] ? 'activé' : 'désactivé'}`, 'info');
        });
      }
    });
    
    // DeepSeek settings
    const deepSeekToggle = document.getElementById('deepSeekToggle');
    const deepSeekApiGroup = document.getElementById('deepSeekApiGroup');
    const deepSeekApiKey = document.getElementById('deepSeekApiKey');
    
    if (deepSeekToggle) {
      deepSeekToggle.addEventListener('click', async () => {
        userSettings.deepSeekEnabled = !userSettings.deepSeekEnabled;
        deepSeekToggle.classList.toggle('active', userSettings.deepSeekEnabled);
        
        if (deepSeekApiGroup) {
          deepSeekApiGroup.style.display = userSettings.deepSeekEnabled ? 'block' : 'none';
        }
        
        saveSettings();
        await initUI();
        
        if (userSettings.deepSeekEnabled && deepSeekApiKey) {
          deepSeekApiKey.focus();
          showNotification('Entrez votre clé API DeepSeek pour activer l\'IA', 'info');
        }
      });
    }
    
    if (deepSeekApiKey) {
      let validateTimeout;
      
      deepSeekApiKey.addEventListener('input', async (e) => {
        const apiKey = e.target.value.trim();
        userSettings.deepSeekApiKey = apiKey;
        
        clearTimeout(validateTimeout);
        validateTimeout = setTimeout(async () => {
          saveSettings();
          if (apiKey) {
            await validateDeepSeekKey(apiKey);
          }
        }, 1000);
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

// Rendre les fonctions globales pour les onclick
window.toggleFolder = toggleFolder;
window.swapLanguages = swapLanguages;
window.toggleFlashcardFolder = toggleFlashcardFolder;
window.swapFlashcardLanguages = swapFlashcardLanguages;
window.flipCard = flipCard;
window.moveToFolder = moveToFolder;
window.deleteFlashcard = deleteFlashcard;
window.startPracticeMode = startPracticeMode;
window.launchPractice = launchPractice;
window.checkAnswer = checkAnswer;
window.showHint = showHint;
window.skipQuestion = skipQuestion;
window.nextQuestion = nextQuestion;
window.quitPractice = quitPractice;
window.showFlashcardTips = showFlashcardTips;
window.copyTranslation = copyTranslation;
window.createFlashcardFromHistory = createFlashcardFromHistory;
window.deleteTranslation = deleteTranslation;