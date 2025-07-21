// Variables globales
let selectedText = '';
let qtIcon = null;
let qtBubble = null;
let userSettings = {
  targetLanguage: 'fr',
  isEnabled: true,
  buttonColor: '#3b82f6',
  enableShortcut: true,
  autoDetectSameLanguage: true,
  showConfidence: true,
  animationsEnabled: true,
  hoverTranslation: false,
  immersionMode: false,
  autoSaveToFlashcards: false
};
let isTranslating = false;
let translationTimeout = null;
let lastTranslation = null;
let languageMenuOpen = false;

// Générateur d'UUID pour les flashcards
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Charger les paramètres au démarrage
loadSettings();

// Fonction pour charger les paramètres
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get({
      targetLanguage: 'fr',
      isEnabled: true,
      buttonColor: '#3b82f6',
      enableShortcut: true,
      autoDetectSameLanguage: true,
      showConfidence: true,
      animationsEnabled: true,
      hoverTranslation: false,
      immersionMode: false,
      autoSaveToFlashcards: false
    });
    userSettings = result;
    console.log('⚙️ Settings loaded:', userSettings);
  } catch (error) {
    console.error('❌ Error loading settings:', error);
  }
}

// Écouter les changements de paramètres
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateSettings') {
    userSettings = { ...userSettings, ...request.settings };
    console.log('🔄 Settings updated:', userSettings);
    console.log('📌 Auto save flashcards:', userSettings.autoSaveToFlashcards);
  } else if (request.action === 'toggleExtension') {
    userSettings.isEnabled = request.enabled;
  } else if (request.action === 'updateButtonColor') {
    userSettings.buttonColor = request.color;
    if (qtIcon) {
      qtIcon.style.background = request.color;
    }
  }
});

// API de traduction avec plusieurs services
async function translateText(text, targetLang = 'fr', sourceLang = 'auto') {
  console.log('🌐 Translation:', { text, from: sourceLang, to: targetLang });
  
  // Ne pas traduire si même langue
  if (sourceLang === targetLang && sourceLang !== 'auto') {
    return {
      translatedText: text,
      detectedLanguage: sourceLang,
      confidence: 1
    };
  }
  
  // Essayer plusieurs APIs dans l'ordre
  const translators = [
    translateWithGoogleFree,
    translateWithLibreTranslate,
    translateWithMyMemory
  ];
  
  for (const translator of translators) {
    try {
      const result = await translator(text, targetLang, sourceLang);
      if (result && result.translatedText && result.translatedText !== text) {
        return result;
      }
    } catch (error) {
      console.warn('⚠️ Error with translation service:', error);
    }
  }
  
  // Si tout échoue, retourner le texte original
  return {
    translatedText: text,
    detectedLanguage: sourceLang === 'auto' ? detectLanguage(text) : sourceLang,
    confidence: 0
  };
}

// Google Translate (via proxy public)
async function translateWithGoogleFree(text, targetLang, sourceLang) {
  try {
    const sl = sourceLang === 'auto' ? 'auto' : sourceLang;
    const tl = targetLang;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data[0] && data[0][0]) {
      const detectedLang = data[2] || (sourceLang === 'auto' ? detectLanguage(text) : sourceLang);
      console.log(`🔍 Google Translate - Détecté: ${detectedLang} pour "${text.substring(0, 30)}..."`);
      return {
        translatedText: data[0][0][0],
        detectedLanguage: detectedLang,
        confidence: 0.9
      };
    }
  } catch (error) {
    console.error('Google Translate error:', error);
  }
  return null;
}

// LibreTranslate (désactivé à cause des problèmes CORS)
async function translateWithLibreTranslate(text, targetLang, sourceLang) {
  // LibreTranslate a des problèmes CORS persistants, on passe directement au service suivant
  return null;
}

// MyMemory
async function translateWithMyMemory(text, targetLang, sourceLang) {
  try {
    const langPair = sourceLang === 'auto' ? `autodetect|${targetLang}` : `${sourceLang}|${targetLang}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.responseStatus === 200) {
      return {
        translatedText: data.responseData.translatedText,
        detectedLanguage: sourceLang === 'auto' ? detectLanguage(text) : sourceLang,
        confidence: data.responseData.match
      };
    }
  } catch (error) {
    console.error('MyMemory error:', error);
  }
  return null;
}

// Créer l'icône de traduction (style original GitHub)
function createIcon() {
  if (qtIcon) qtIcon.remove();
  
  qtIcon = document.createElement('div');
  qtIcon.id = 'qt-icon';
  qtIcon.style.cssText = `
    position: absolute;
    background: ${userSettings.buttonColor};
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    z-index: 2147483647;
    transition: all 0.2s ease;
    user-select: none;
    font-size: 16px;
  `;
  
  qtIcon.textContent = '🌐';
  qtIcon.title = 'Traduire';
  
  // Effet hover
  qtIcon.addEventListener('mouseenter', () => {
    if (userSettings.animationsEnabled) {
      qtIcon.style.transform = 'scale(1.1)';
    }
  });
  
  qtIcon.addEventListener('mouseleave', () => {
    qtIcon.style.transform = 'scale(1)';
  });
  
  // Gérer le clic
  qtIcon.addEventListener('click', handleTranslation);
  
  document.body.appendChild(qtIcon);
  return qtIcon;
}

// Créer la bulle de traduction (style exact du GitHub)
function createBubble() {
  if (qtBubble) qtBubble.remove();
  
  qtBubble = document.createElement('div');
  qtBubble.id = 'qt-bubble';
  qtBubble.style.cssText = `
    position: absolute;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    z-index: 10001;
    max-width: 400px;
    min-width: 280px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: #111827;
    animation: ${userSettings.animationsEnabled ? 'fadeIn 0.2s ease-out' : 'none'};
  `;
  
  // Ajouter l'animation
  if (userSettings.animationsEnabled && !document.getElementById('qt-animations')) {
    const style = document.createElement('style');
    style.id = 'qt-animations';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.8); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      /* Fix pour le dropdown select */
      #qt-lang-selector {
        position: relative;
        z-index: 10002;
      }
      #qt-lang-selector:focus {
        outline: 2px solid #3b82f6;
        outline-offset: 1px;
      }
      /* S'assurer que le dropdown est visible */
      #qt-bubble {
        overflow: visible !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(qtBubble);
  return qtBubble;
}

// Gérer la traduction
async function handleTranslation(event) {
  event.preventDefault();
  event.stopPropagation();
  
  if (isTranslating || !selectedText.trim()) return;
  
  isTranslating = true;
  
  try {
    const bubble = createBubble();
    const selection = window.getSelection();
    
    if (selection.rangeCount > 0) {
      positionBubble(selection);
    }
    
    // Afficher le chargement
    bubble.innerHTML = `
      <div style="text-align: center; padding: 8px;">
        <div style="width: 20px; height: 20px; border: 2px solid ${userSettings.buttonColor}; 
                    border-top: 2px solid transparent; border-radius: 50%; 
                    animation: spin 1s linear infinite; margin: 0 auto;"></div>
        <div style="color: #6b7280; font-size: 12px; margin-top: 8px;">Translating...</div>
      </div>
    `;
    
    // Traduire
    const result = await translateText(selectedText, userSettings.targetLanguage);
    lastTranslation = result;
    
    // Afficher le résultat
    displayTranslation(bubble, result);
    
    // Sauvegarder dans l'historique
    if (result.translatedText !== selectedText) {
      saveTranslation(
        selectedText,
        result.translatedText,
        result.detectedLanguage,
        userSettings.targetLanguage
      );
      
      // Créer automatiquement une flashcard si activé
      console.log('🔍 Checking auto save:', userSettings.autoSaveToFlashcards);
      if (userSettings.autoSaveToFlashcards) {
        console.log('✅ Sauvegarde automatique activée, création de la flashcard...');
        createFlashcard(selectedText, result.translatedText, userSettings.targetLanguage, result.detectedLanguage);
      }
    }
    
  } catch (error) {
    console.error('❌ Translation error:', error);
    if (qtBubble) {
      qtBubble.innerHTML = `
        <div style="color: #ef4444; text-align: center; padding: 12px;">
          ❌ Erreur de traduction
        </div>
      `;
    }
  } finally {
    isTranslating = false;
  }
}

// Afficher la traduction dans la bulle (style original exact du GitHub)
function displayTranslation(bubble, result) {
  const { translatedText, detectedLanguage, confidence } = result;
  
  // Vérifier si le texte est déjà dans la langue cible
  const isAlreadyInTargetLanguage = detectedLanguage === userSettings.targetLanguage && 
                                   translatedText.toLowerCase().trim() === selectedText.toLowerCase().trim();
  
  const sameLanguageNote = isAlreadyInTargetLanguage ? 
    `<div style="background: #fef3c7; color: #92400e; padding: 8px; border-radius: 6px; font-size: 12px; margin-bottom: 8px; border-left: 3px solid #f59e0b;">
      ℹ️ Déjà en ${getLanguageName(userSettings.targetLanguage)}
    </div>` : '';
  
  // Structure exacte du design original
  bubble.innerHTML = `
    <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-weight: 600; color: #374151;">
          🌐 Traduction
        </span>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 11px; color: #9ca3af;">
            ${getFlagEmoji(detectedLanguage)} →
          </span>
          <select id="qt-lang-selector" style="font-size: 11px; padding: 2px 4px; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer;">
            <option value="fr" ${userSettings.targetLanguage === 'fr' ? 'selected' : ''}>🇫🇷 FR</option>
            <option value="en" ${userSettings.targetLanguage === 'en' ? 'selected' : ''}>🇺🇸 EN</option>
            <option value="ar" ${userSettings.targetLanguage === 'ar' ? 'selected' : ''}>🇸🇦 AR</option>
            <option value="es" ${userSettings.targetLanguage === 'es' ? 'selected' : ''}>🇪🇸 ES</option>
            <option value="de" ${userSettings.targetLanguage === 'de' ? 'selected' : ''}>🇩🇪 DE</option>
            <option value="it" ${userSettings.targetLanguage === 'it' ? 'selected' : ''}>🇮🇹 IT</option>
            <option value="pt" ${userSettings.targetLanguage === 'pt' ? 'selected' : ''}>🇵🇹 PT</option>
            <option value="ru" ${userSettings.targetLanguage === 'ru' ? 'selected' : ''}>🇷🇺 RU</option>
            <option value="ja" ${userSettings.targetLanguage === 'ja' ? 'selected' : ''}>🇯🇵 JA</option>
            <option value="ko" ${userSettings.targetLanguage === 'ko' ? 'selected' : ''}>🇰🇷 KO</option>
            <option value="zh" ${userSettings.targetLanguage === 'zh' ? 'selected' : ''}>🇨🇳 ZH</option>
          </select>
        </div>
      </div>
      
      ${sameLanguageNote}
      
      <div style="color: #111827; padding: 12px; background: #f8fafc; border-radius: 8px; font-weight: 500; font-size: 15px;">
        ${translatedText}
      </div>
      
      ${userSettings.showConfidence && confidence ? `
        <div style="margin-top: 8px; font-size: 11px; color: #9ca3af;">
          Confiance: ${Math.round(confidence * 100)}%
        </div>
      ` : ''}
    </div>
    
    <div style="display: flex; gap: 8px; margin-bottom: 8px;">
      <button id="qt-copy-translation" style="flex: 1; background: #6b7280; color: white; border: none; padding: 8px; border-radius: 6px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
        📋 Copier
      </button>
      <button id="qt-save-flashcard" style="flex: 1; background: #10b981; color: white; border: none; padding: 8px; border-radius: 6px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
        💾 Flashcard
      </button>
    </div>
    
    <div style="text-align: center; padding-top: 8px; border-top: 1px solid #e5e7eb;">
      <div style="font-size: 10px; color: #9ca3af;">
        "${selectedText.substring(0, 30)}${selectedText.length > 30 ? '...' : ''}"
      </div>
    </div>
  `;
  
  // Event listeners
  setTimeout(() => {
    const copyBtn = document.getElementById('qt-copy-translation');
    const saveBtn = document.getElementById('qt-save-flashcard');
    const langSelector = document.getElementById('qt-lang-selector');
    
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(translatedText);
        copyBtn.textContent = '✅ Copié!';
        copyBtn.style.background = '#059669';
        setTimeout(() => {
          copyBtn.textContent = '📋 Copy';
          copyBtn.style.background = '#6b7280';
        }, 2000);
      });
    }
    
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        createFlashcard(selectedText, translatedText, userSettings.targetLanguage, lastTranslation?.detectedLanguage || 'auto');
      });
    }
    
    if (langSelector) {
      langSelector.addEventListener('change', async (e) => {
        const newLang = e.target.value;
        userSettings.targetLanguage = newLang;
        
        if (chrome.storage && chrome.storage.sync) {
          chrome.storage.sync.set({ targetLanguage: newLang });
        }
        
        // Retraduire avec animation
        const translationDiv = bubble.querySelector('div[style*="background: #f8fafc"]');
        if (translationDiv) {
          translationDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 14px; height: 14px; border: 2px solid #6b7280; 
                          border-top: 2px solid transparent; border-radius: 50%; 
                          animation: spin 1s linear infinite;"></div>
              <span style="color: #6b7280;">Retraduction...</span>
            </div>
          `;
        }
        
        try {
          const newResult = await translateText(selectedText, newLang, lastTranslation?.detectedLanguage || 'auto');
          lastTranslation = newResult;
          
          // Reconstruire complètement la bulle avec le nouveau résultat
          displayTranslation(bubble, newResult);
          
          saveTranslation(selectedText, newResult.translatedText, newResult.detectedLanguage, newLang);
        } catch (error) {
          if (translationDiv) {
            translationDiv.innerHTML = '❌ Retranslation error';
          }
        }
      });
    }
  }, 100);
}

// Afficher le dropdown de langues (dans la bulle)
function showLanguageDropdown(anchor) {
  const dropdown = document.getElementById('qt-lang-dropdown');
  if (!dropdown) return;
  
  // Si déjà ouvert, fermer
  if (dropdown.style.display === 'block') {
    dropdown.style.display = 'none';
    languageMenuOpen = false;
    return;
  }
  
  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
  ];
  
  dropdown.innerHTML = languages.map(lang => `
    <div class="qt-lang-item" data-lang="${lang.code}" 
         style="padding: 6px 12px; cursor: pointer; display: flex; 
                align-items: center; gap: 8px; transition: background 0.2s;">
      <span>${lang.flag}</span>
      <span style="font-size: 12px;">${lang.name}</span>
    </div>
  `).join('');
  
  // Positionner le dropdown
  const anchorRect = anchor.getBoundingClientRect();
  const bubbleRect = qtBubble.getBoundingClientRect();
  
  dropdown.style.top = `${anchorRect.bottom - bubbleRect.top + 4}px`;
  dropdown.style.left = `${anchorRect.left - bubbleRect.left}px`;
  dropdown.style.display = 'block';
  languageMenuOpen = true;
  
  // Event listeners pour chaque langue
  dropdown.querySelectorAll('.qt-lang-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.background = '#f3f4f6';
    });
    item.addEventListener('mouseleave', () => {
      item.style.background = 'none';
    });
    item.addEventListener('click', async () => {
      const langCode = item.dataset.lang;
      const langData = languages.find(l => l.code === langCode);
      
      // Mettre à jour les paramètres
      userSettings.targetLanguage = langCode;
      chrome.storage.sync.set({ targetLanguage: langCode });
      
      // Fermer le dropdown
      dropdown.style.display = 'none';
      languageMenuOpen = false;
      
      // Mettre à jour l'affichage
      const targetLangBtn = document.querySelector('#qt-target-lang');
      if (targetLangBtn) {
        targetLangBtn.innerHTML = `
          <span style="font-size: 16px;">${langData.flag}</span>
          <span style="color: #333; font-size: 12px;">${langData.name}</span>
        `;
      }
      
      // Retraduire avec la nouvelle langue
      if (selectedText && lastTranslation) {
        try {
          // Afficher le chargement dans la zone de traduction
          const translationDiv = qtBubble.querySelector('div[style*="font-size: 16px"]');
          if (translationDiv) {
            translationDiv.innerHTML = `
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 14px; height: 14px; border: 2px solid ${userSettings.buttonColor}; 
                            border-top: 2px solid transparent; border-radius: 50%; 
                            animation: spin 1s linear infinite;"></div>
                <span style="color: #6b7280; font-size: 14px;">Traduction...</span>
              </div>
            `;
          }
          
          // Traduire
          const result = await translateText(selectedText, langCode, lastTranslation.detectedLanguage);
          
          // Mettre à jour la traduction
          if (translationDiv) {
            translationDiv.innerHTML = result.translatedText;
          }
          
          // Mettre à jour la confiance si affichée
          if (userSettings.showConfidence && result.confidence) {
            const confidenceBar = qtBubble.querySelector('div[style*="border-radius: 2px"]');
            if (confidenceBar && confidenceBar.firstElementChild) {
              confidenceBar.firstElementChild.style.width = `${result.confidence * 100}%`;
            }
          }
          
          // Sauvegarder
          lastTranslation = result;
          saveTranslation(
            selectedText,
            result.translatedText,
            result.detectedLanguage,
            langCode
          );
        } catch (error) {
          console.error('❌ Retranslation error:', error);
        }
      }
    });
  });
}

// Positionner la bulle (pour qu'elle soit toujours visible)
function positionBubble(selection) {
  if (!qtBubble || !selection.rangeCount) return;
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  // Position initiale
  let left = rect.left + window.scrollX;
  let top = rect.bottom + window.scrollY + 12;
  
  // Mesurer la bulle
  qtBubble.style.visibility = 'hidden';
  qtBubble.style.display = 'block';
  const bubbleRect = qtBubble.getBoundingClientRect();
  const bubbleWidth = bubbleRect.width;
  const bubbleHeight = bubbleRect.height;
  
  // Ajustement horizontal
  if (left + bubbleWidth > window.innerWidth - 20) {
    left = window.innerWidth - bubbleWidth - 20;
  }
  if (left < 10) {
    left = 10;
  }
  
  // Ajustement vertical
  if (top + bubbleHeight > window.innerHeight + window.scrollY - 20) {
    // Afficher au-dessus de la sélection
    top = rect.top + window.scrollY - bubbleHeight - 12;
  }
  
  qtBubble.style.left = `${left}px`;
  qtBubble.style.top = `${top}px`;
  qtBubble.style.visibility = 'visible';
}

// Positionner l'icône
function positionIcon(selection) {
  if (!qtIcon || !selection.rangeCount) return;
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  // Position à droite du texte
  const top = rect.top + (rect.height / 2) - 12 + window.scrollY;
  const left = rect.right + window.scrollX + 5;
  
  qtIcon.style.top = `${top}px`;
  qtIcon.style.left = `${left}px`;
  
  // Si déborde à droite, mettre à gauche
  if (rect.right + 30 > window.innerWidth) {
    qtIcon.style.left = `${rect.left + window.scrollX - 30}px`;
  }
}

// Sauvegarder la traduction
async function saveTranslation(original, translated, fromLang, toLang) {
  try {
    if (fromLang === toLang) return;
    
    const translation = {
      id: Date.now(),
      original: original.substring(0, 100),
      translated: translated.substring(0, 100),
      fromLang,
      toLang,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      domain: window.location.hostname
    };
    
    chrome.storage.local.get({ translations: [] }, (result) => {
      const translations = result.translations || [];
      
      // Vérifier si une traduction identique existe déjà récemment (dans les 10 dernières)
      const recentTranslations = translations.slice(0, 10);
      const isDuplicate = recentTranslations.some(t => 
        t.original === translation.original && 
        t.translated === translation.translated &&
        t.fromLang === translation.fromLang &&
        t.toLang === translation.toLang
      );
      
      if (!isDuplicate) {
        translations.unshift(translation);
        
        if (translations.length > 1000) {
          translations.splice(1000);
        }
        
        chrome.storage.local.set({ translations }, () => {
          console.log('✅ Translation saved');
          // Le listener chrome.storage.onChanged dans popup.js s'occupera de la mise à jour
        });
      } else {
        console.log('⏭️ Translation already exists in recent history, skipping');
      }
    });
  } catch (error) {
    console.error('❌ Save error:', error);
  }
}

// Créer une flashcard
function createFlashcard(front, back, targetLanguage, sourceLanguage = 'auto') {
  try {
    console.log('💾 Creating flashcard:', { front, back, targetLanguage, sourceLanguage, autoSave: userSettings.autoSaveToFlashcards });
    
    // Créer la flashcard avec le format cohérent avec popup.js
    const flashcard = {
      id: generateUUID(), // Utiliser UUID au lieu de Date.now()
      front: front.substring(0, 100),
      back: back.substring(0, 100),
      text: front.substring(0, 100), // Champs attendus par popup.js
      translation: back.substring(0, 100),
      sourceLanguage: sourceLanguage, // Utiliser la langue détectée
      targetLanguage: targetLanguage,
      language: targetLanguage, // Garder pour compatibilité
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(), // Pour la fusion
      folder: 'default',
      reviews: 0,
      lastReview: null,
      difficulty: 'normal',
      synced: false // Marquer comme non synchronisé
    };
    
    chrome.storage.local.get({ flashcards: [], authToken: null }, (data) => {
      const flashcards = data.flashcards || [];
      
      const exists = flashcards.some(f => 
        f.front?.toLowerCase() === front.toLowerCase() && 
        f.back?.toLowerCase() === back.toLowerCase()
      );
      
      if (!exists) {
        flashcards.unshift(flashcard); // Ajouter au début comme dans popup.js
        chrome.storage.local.set({ flashcards }, () => {
          console.log('✅ Flashcard saved locally');
          
          // Notifier le popup de mettre à jour l'affichage
          chrome.runtime.sendMessage({
            action: 'flashcardAdded',
            flashcard: flashcard
          });
          
          // Envoyer un message au background pour synchroniser avec le serveur
          if (data.authToken) {
            chrome.runtime.sendMessage({
              action: 'syncFlashcard',
              flashcard: {
                originalText: front,
                translatedText: back,
                sourceLanguage: sourceLanguage,
                targetLanguage: targetLanguage,
                folder: 'default',
                difficulty: 'normal'
              }
            });
          }
          
          // Si c'est une sauvegarde manuelle, afficher le feedback
          if (!userSettings.autoSaveToFlashcards) {
            const btn = document.getElementById('qt-save-flashcard');
            if (btn) {
              btn.textContent = '✅ Ajouté!';
              btn.style.background = '#059669';
              setTimeout(() => {
                btn.textContent = '💾 Flashcard';
                btn.style.background = '#10b981';
              }, 2000);
            }
          }
        });
      } else {
        console.log('⚠️ Flashcard already exists');
        if (!userSettings.autoSaveToFlashcards) {
          const btn = document.getElementById('qt-save-flashcard');
          if (btn) {
            btn.textContent = '⚠️ Existe déjà';
            btn.style.background = '#f59e0b';
            setTimeout(() => {
              btn.textContent = '💾 Flashcard';
              btn.style.background = '#10b981';
            }, 2000);
          }
        }
      }
    });
  } catch (error) {
    console.error('❌ Flashcard creation error:', error);
  }
}

// Détecter la langue
function detectLanguage(text) {
  if (!text) return 'fr';
  
  // Nettoyer le texte
  const cleanText = text.toLowerCase().trim();
  
  // Détection par caractères spéciaux (priorité absolue)
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
  
  // Si on trouve des caractères spéciaux, c'est définitif
  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) {
      console.log(`🎯 Langue détectée par caractères spéciaux: ${lang} pour "${text}"`);
      return lang;
    }
  }
  
  // Détection par mots courants pour textes sans accents
  const words = cleanText.split(/\s+/);
  const langWords = {
    'fr': ['le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'est', 'dans', 'avec', 'pour', 'sur', 'ce', 'cette', 'que', 'qui', 'ne', 'pas'],
    'en': ['the', 'a', 'an', 'is', 'and', 'in', 'on', 'at', 'to', 'for', 'with', 'this', 'that', 'have', 'has', 'will', 'would', 'could'],
    'es': ['el', 'la', 'los', 'las', 'y', 'es', 'en', 'de', 'un', 'una', 'con', 'por', 'para', 'que', 'no', 'se'],
    'de': ['der', 'die', 'das', 'und', 'ist', 'in', 'ein', 'eine', 'mit', 'für', 'auf', 'nicht', 'ich', 'du'],
    'it': ['il', 'la', 'lo', 'le', 'e', 'è', 'in', 'un', 'una', 'con', 'per', 'che', 'non', 'di']
  };
  
  let maxScore = 0;
  let detectedLang = 'fr'; // Par défaut français
  
  for (const [lang, keywords] of Object.entries(langWords)) {
    const score = words.filter(w => keywords.includes(w)).length;
    if (score > maxScore) {
      maxScore = score;
      detectedLang = lang;
    }
  }
  
  console.log(`🔍 Langue détectée par mots: ${detectedLang} (score: ${maxScore}) pour "${text}"`);
  return detectedLang;
}

// Obtenir l'emoji du drapeau
function getFlagEmoji(langCode) {
  const flags = {
    'fr': '🇫🇷',
    'en': '🇺🇸',
    'es': '🇪🇸',
    'de': '🇩🇪',
    'it': '🇮🇹',
    'pt': '🇵🇹',
    'ar': '🇸🇦',
    'ru': '🇷🇺',
    'ja': '🇯🇵',
    'ko': '🇰🇷',
    'zh': '🇨🇳',
    'auto': '🌐'
  };
  
  return flags[langCode] || '🌐';
}

// Obtenir le nom de la langue
function getLanguageName(langCode) {
  const names = {
    'fr': 'Français',
    'en': 'English',
    'es': 'Español',
    'de': 'Deutsch',
    'it': 'Italiano',
    'pt': 'Português',
    'ar': 'العربية',
    'ru': 'Русский',
    'ja': '日本語',
    'ko': '한국어',
    'zh': '中文',
    'auto': 'Auto'
  };
  
  return names[langCode] || langCode.toUpperCase();
}

// Nettoyer en cliquant ailleurs
document.addEventListener('mousedown', (event) => {
  // Ne pas fermer si on clique sur le dropdown
  if (event.target.closest('#qt-lang-dropdown')) {
    return;
  }
  
  // Fermer le dropdown si ouvert
  const dropdown = document.getElementById('qt-lang-dropdown');
  if (dropdown && languageMenuOpen) {
    dropdown.style.display = 'none';
    languageMenuOpen = false;
  }
  
  // Fermer tout si on clique ailleurs
  if (qtIcon && !qtIcon.contains(event.target) && 
      qtBubble && !qtBubble.contains(event.target)) {
    if (qtIcon) {
      qtIcon.remove();
      qtIcon = null;
    }
    if (qtBubble) {
      qtBubble.remove();
      qtBubble = null;
    }
  }
});

// Gérer la sélection de texte
document.addEventListener('mouseup', (event) => {
  if (!userSettings.isEnabled) return;
  
  // Ignorer si on clique sur nos éléments
  if (event.target.id === 'qt-icon' || 
      event.target.id === 'qt-bubble' ||
      event.target.closest('#qt-bubble')) {
    return;
  }
  
  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text && text.length > 0 && text.length < 1000) {
      selectedText = text;
      
      // Supprimer l'icône existante
      if (qtIcon) {
        qtIcon.remove();
        qtIcon = null;
      }
      
      // Créer et positionner la nouvelle icône
      createIcon();
      positionIcon(selection);
      
      // Traduction au survol si activé
      if (userSettings.hoverTranslation) {
        clearTimeout(translationTimeout);
        translationTimeout = setTimeout(() => {
          handleTranslation(new Event('auto'));
        }, 1000);
      }
    } else {
      // Nettoyer si pas de sélection
      if (qtIcon) {
        qtIcon.remove();
        qtIcon = null;
      }
      selectedText = '';
    }
  }, 10);
});

// Gérer le raccourci clavier
document.addEventListener('keydown', (event) => {
  if (!userSettings.isEnabled || !userSettings.enableShortcut) return;
  
  // Ctrl+Q ou Cmd+Q
  if ((event.ctrlKey || event.metaKey) && event.key === 'q') {
    event.preventDefault();
    
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text) {
      selectedText = text;
      createIcon();
      positionIcon(selection);
      handleTranslation(new Event('keyboard'));
    }
  }
});

console.log('✅ LexiFlow content script chargé');