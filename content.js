// Fonction utilitaire pour obtenir le nom de langue
function getLanguageName(langCode) {
  const names = {
    'fr': 'français',
    'en': 'anglais',
    'es': 'espagnol',
    'de': 'allemand',
    'it': 'italien',
    'pt': 'portugais',
    'auto': 'détection auto'
  };
  
  return names[langCode] || langCode.toUpperCase();
}// Variables globales
let qtIcon = null;
let qtBubble = null;
let selectedText = '';
let isTranslating = false;
let userSettings = {};
let currentTranslationData = {
  original: '',
  translated: '',
  language: ''
};

// Cache pour éviter les re-traductions
const translationCache = new Map();

// Charger les paramètres utilisateur
async function loadSettings() {
  return new Promise((resolve) => {
    try {
      if (!chrome.storage || !chrome.storage.sync) {
        console.warn('⚠️ Extension context invalidated');
        userSettings = getDefaultSettings();
        resolve(userSettings);
        return;
      }
      
      chrome.storage.sync.get(getDefaultSettings(), (result) => {
        if (chrome.runtime.lastError) {
          console.warn('⚠️ Erreur loadSettings:', chrome.runtime.lastError.message);
          userSettings = getDefaultSettings();
        } else {
          userSettings = result;
        }
        console.log('⚙️ Paramètres chargés:', userSettings);
        resolve(userSettings);
      });
    } catch (error) {
      console.error('❌ Erreur loadSettings:', error);
      userSettings = getDefaultSettings();
      resolve(userSettings);
    }
  });
}

// Paramètres par défaut
function getDefaultSettings() {
  return {
    targetLanguage: 'fr',
    isEnabled: true,
    buttonColor: '#3b82f6',
    isPro: false,
    deepSeekEnabled: false,
    deepSeekApiKey: '',
    enableShortcut: true,
    autoDetectSameLanguage: true,
    showConfidence: true,
    animationsEnabled: true
  };
}

// Sauvegarder une traduction dans l'historique
async function saveTranslation(original, translated, fromLang, toLang) {
  try {
    // Ne pas sauvegarder si même langue
    if (fromLang === toLang) return;
    
    const translation = {
      id: Date.now(),
      original,
      translated,
      fromLang,
      toLang,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      domain: window.location.hostname
    };
    
    if (!chrome.storage || !chrome.storage.local) {
      console.warn('⚠️ Extension context invalidated');
      return;
    }
    
    chrome.storage.local.get({ translations: [] }, (result) => {
      if (chrome.runtime.lastError) {
        console.warn('⚠️ Erreur chrome.storage:', chrome.runtime.lastError.message);
        return;
      }
      
      const translations = result.translations || [];
      
      // Éviter les doublons
      const existingIndex = translations.findIndex(t => 
        t.original.toLowerCase() === original.toLowerCase() && 
        t.toLang === toLang
      );
      
      if (existingIndex !== -1) {
        translations.splice(existingIndex, 1);
      }
      
      translations.unshift(translation);
      
      // Garder seulement les 1000 dernières
      if (translations.length > 1000) {
        translations.splice(1000);
      }
      
      chrome.storage.local.set({ translations }, () => {
        if (chrome.runtime.lastError) {
          console.warn('⚠️ Erreur sauvegarde:', chrome.runtime.lastError.message);
        }
      });
    });
  } catch (error) {
    console.error('❌ Erreur sauvegarde traduction:', error);
  }
}

// Fonction améliorée pour détecter la langue avec gestion des mots ambigus
function detectLanguage(text) {
  if (!text || text.length === 0) return 'auto';
  
  // Normaliser le texte pour la détection
  const normalizedText = text.toLowerCase().trim();
  
  // Mots ambigus entre langues
  const ambiguousWords = {
    'car': {
      'fr': ['voiture', 'auto', 'véhicule', 'parce', 'que'],
      'en': ['vehicle', 'automobile', 'because', 'since']
    },
    'chat': {
      'fr': ['conversation', 'discussion', 'félin'],
      'en': ['conversation', 'talk', 'messaging']
    },
    'pain': {
      'fr': ['baguette', 'mie', 'croûte'],
      'en': ['hurt', 'ache', 'suffering']
    },
    'sale': {
      'fr': ['dirty', 'malpropre'],
      'en': ['discount', 'promotion', 'offer']
    }
  };
  
  // Vérifier si c'est un mot ambigu
  const lowerText = text.toLowerCase();
  if (ambiguousWords[lowerText]) {
    // Analyser le contexte pour déterminer la langue
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      let contextText = '';
      
      if (container.nodeType === Node.TEXT_NODE) {
        contextText = container.textContent;
      } else {
        contextText = container.innerText || container.textContent || '';
      }
      
      // Chercher des indices contextuels
      const contextWords = contextText.toLowerCase().split(/\s+/);
      let frScore = 0, enScore = 0;
      
      const frContextWords = ['le', 'la', 'les', 'un', 'une', 'de', 'du', 'des', 'est', 'sont'];
      const enContextWords = ['the', 'a', 'an', 'is', 'are', 'in', 'on', 'at', 'to', 'for'];
      
      contextWords.forEach(word => {
        if (frContextWords.includes(word)) frScore++;
        if (enContextWords.includes(word)) enScore++;
      });
      
      if (frScore > enScore) return 'fr';
      if (enScore > frScore) return 'en';
    }
  }
  
  // Détection par caractères spéciaux
  const charPatterns = {
    'fr': /[àâäéêëèîïôùûüÿç]/i,
    'es': /[áéíóúñ¡¿]/i,
    'de': /[äöüß]/i,
    'it': /[àèéìíîòóù]/i,
    'pt': /[àáâãçéêíõôú]/i
  };
  
  for (const [lang, pattern] of Object.entries(charPatterns)) {
    if (pattern.test(text)) return lang;
  }
  
  // Détection par mots-clés améliorée
  const keywords = {
    'fr': ['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'est', 'dans', 'pour', 'avec', 'sur', 'qui', 'que', 'mais', 'ou', 'donc', 'car', 'ce', 'cette', 'ces'],
    'en': ['the', 'a', 'an', 'and', 'is', 'in', 'for', 'with', 'on', 'that', 'which', 'but', 'or', 'so', 'if', 'then', 'to', 'of', 'as', 'this', 'these', 'those'],
    'es': ['el', 'la', 'los', 'las', 'un', 'una', 'y', 'es', 'en', 'para', 'con', 'por', 'que', 'pero', 'o', 'si', 'entonces', 'este', 'esta'],
    'de': ['der', 'die', 'das', 'ein', 'eine', 'und', 'ist', 'in', 'für', 'mit', 'auf', 'dass', 'aber', 'oder', 'wenn', 'dann', 'dieser', 'diese'],
    'it': ['il', 'la', 'lo', 'gli', 'le', 'un', 'una', 'e', 'è', 'in', 'per', 'con', 'su', 'che', 'ma', 'o', 'se', 'poi', 'questo', 'questa'],
    'pt': ['o', 'a', 'os', 'as', 'um', 'uma', 'e', 'é', 'em', 'para', 'com', 'por', 'que', 'mas', 'ou', 'se', 'então', 'este', 'esta']
  };
  
  let maxScore = 0;
  let detectedLang = 'en';
  
  // Analyse plus sophistiquée
  const words = normalizedText.split(/\s+/);
  const wordCount = words.length;
  
  for (const [lang, langKeywords] of Object.entries(keywords)) {
    let score = 0;
    for (const word of words) {
      if (langKeywords.includes(word)) {
        score++;
      }
    }
    
    // Normaliser le score par rapport au nombre de mots
    const normalizedScore = wordCount > 0 ? (score / wordCount) : 0;
    
    if (normalizedScore > maxScore) {
      maxScore = normalizedScore;
      detectedLang = lang;
    }
  }
  
  // Si le score est trop faible, utiliser d'autres indices
  if (maxScore < 0.1) {
    // Vérifier la langue de la page
    const pageLang = document.documentElement.lang || 
                     document.querySelector('html')?.getAttribute('lang') || 
                     navigator.language.split('-')[0] || 
                     'en';
    
    const supportedLangs = ['fr', 'en', 'es', 'de', 'it', 'pt'];
    if (supportedLangs.includes(pageLang.substring(0, 2))) {
      return pageLang.substring(0, 2);
    }
  }
  
  return detectedLang;
}

// ========================================
// DEEPSEEK API PREMIUM AMÉLIORÉE
// ========================================

async function translateWithDeepSeek(text, sourceLang = 'auto', targetLang = 'fr', contextData = null) {
  try {
    console.log('🤖 DeepSeek Premium translation:', { text, sourceLang, targetLang });
    
    const cleanedText = cleanText(text);
    if (!cleanedText) throw new Error('Texte vide');
    
    const apiKey = userSettings.deepSeekApiKey;
    if (!apiKey) throw new Error('Clé API DeepSeek manquante');
    
    // Prompt optimisé pour DeepSeek avec gestion des ambiguïtés
    const systemPrompt = `Tu es un traducteur expert multilingue. Tu dois:
1. Traduire avec précision en préservant le sens et les nuances
2. Gérer correctement les apostrophes et la ponctuation
3. Adapter le registre de langue au contexte
4. Pour les noms propres, les garder identiques si approprié
5. Pour les mots ambigus (comme "car" qui peut être français ou anglais), utiliser le contexte pour déterminer le sens correct
6. Répondre UNIQUEMENT avec la traduction, sans explications`;

    const userPrompt = buildSmartPrompt(cleanedText, sourceLang, targetLang, contextData);
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 150,
        temperature: 0.3,
        top_p: 0.9,
        stream: false
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ DeepSeek error:', error);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📡 DeepSeek response:', data);
    
    if (data.choices?.[0]?.message?.content) {
      const translation = cleanText(data.choices[0].message.content);
      
      // Validation de la traduction
      if (translation && !isBadTranslation(cleanedText, translation, sourceLang, targetLang)) {
        console.log('✅ DeepSeek success:', translation);
        return {
          translation,
          detectedLanguage: sourceLang === 'auto' ? detectLanguage(cleanedText) : sourceLang,
          confidence: 0.95,
          source: 'DeepSeek AI',
          isAI: true,
          originalText: cleanedText,
          contextUsed: !!contextData
        };
      }
    }
    
    throw new Error('Traduction DeepSeek invalide');
    
  } catch (error) {
    console.error('❌ DeepSeek error:', error);
    throw error;
  }
}

// Construire un prompt intelligent pour DeepSeek
function buildSmartPrompt(text, sourceLang, targetLang, contextData) {
  const languageNames = {
    'fr': 'français',
    'en': 'anglais',
    'es': 'espagnol', 
    'de': 'allemand',
    'it': 'italien',
    'pt': 'portugais',
    'auto': 'langue source à détecter'
  };
  
  let prompt = `Traduire de ${languageNames[sourceLang] || sourceLang} vers ${languageNames[targetLang] || targetLang}:\n"${text}"`;
  
  if (contextData?.context && contextData.context !== text) {
    prompt += `\n\nContexte: "${contextData.context}"`;
    prompt += `\nNote: Traduis uniquement "${text}" en tenant compte du contexte.`;
    
    // Pour les mots ambigus
    const ambiguousWords = ['car', 'chat', 'pain', 'sale'];
    if (ambiguousWords.some(word => text.toLowerCase().includes(word))) {
      prompt += `\nAttention: Le mot peut avoir plusieurs sens selon la langue source. Utilise le contexte pour déterminer le sens correct.`;
    }
  }
  
  // Instructions spécifiques selon les langues
  if (targetLang === 'fr') {
    prompt += '\n\nRappel: Préserve les apostrophes françaises (l\', d\', qu\', etc.)';
  }
  
  return prompt;
}

// Fonction utilitaire pour nettoyer le texte
function cleanText(text) {
  if (!text) return '';
  
  return text
    .replace(/\*\*/g, '')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/["""'']/g, '')
    .replace(/'/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Validation améliorée des traductions
function isBadTranslation(original, translation, sourceLang, targetLang) {
  if (!original || !translation) return true;
  
  const originalLower = original.toLowerCase().trim();
  const translationLower = translation.toLowerCase().trim();
  
  // Rejeter si la traduction est trop courte pour un mot long
  if (original.length > 5 && translation.length < 3) {
    console.log(`🚫 Traduction trop courte: "${original}" → "${translation}"`);
    return true;
  }
  
  // Rejeter si c'est un pronom sans rapport
  const pronouns = ['he', 'she', 'it', 'they', 'them', 'we', 'us', 'him', 'her'];
  if (pronouns.includes(translationLower) && !pronouns.includes(originalLower)) {
    console.log(`🚫 Pronom invalide: "${original}" → "${translation}"`);
    return true;
  }
  
  // Dictionnaire des mauvaises traductions connues
  const badTranslations = {
    'étudiants': ['they', 'them', 'it'],
    'réseau': ['they', 'network they', 'it network'],
    'différents': ['channels', 'communication', 'ways'],
    'porte': ['door porte', 'porte door'],
    'population': ['earths', 'planets'],
    'certaines': ['beverage', 'drink'],
    'principale': ['supply', 'provide']
  };
  
  if (badTranslations[originalLower]) {
    for (const bad of badTranslations[originalLower]) {
      if (translationLower === bad || translationLower.includes(bad)) {
        console.log(`🚫 Traduction connue comme mauvaise: "${original}" → "${translation}"`);
        return true;
      }
    }
  }
  
  // Mots qui peuvent rester identiques (noms propres, termes techniques)
  const validIdenticalWords = [
    // Marques et entreprises
    'google', 'facebook', 'twitter', 'instagram', 'youtube', 'netflix', 'amazon', 'apple', 'microsoft',
    // Termes techniques
    'internet', 'email', 'software', 'hardware', 'bluetooth', 'wifi', 'usb', 'web', 'api', 'css', 'html', 'javascript',
    // Noms de lieux
    'paris', 'london', 'tokyo', 'berlin', 'madrid', 'rome', 'new york',
    // Termes scientifiques
    'covid', 'adn', 'dna', 'laser', 'radar',
    // Autres
    'ok', 'okay', 'taxi', 'hotel', 'restaurant', 'pizza', 'sandwich', 'burger'
  ];
  
  // Si le mot est identique mais fait partie des mots valides
  if (originalLower === translationLower && validIdenticalWords.includes(originalLower)) {
    return false;
  }
  
  // Rejeter si la traduction contient des mots suspects
  const suspiciousWords = ['undefined', 'null', 'error', 'http', 'www', 'function', 'object', '${', '{{'];
  if (suspiciousWords.some(word => translationLower.includes(word))) {
    console.log(`🚫 Mots suspects détectés: "${translation}"`);
    return true;
  }
  
  // Rejeter si c'est exactement le même texte (sauf mots valides)
  if (originalLower === translationLower && sourceLang !== targetLang && sourceLang !== 'auto') {
    console.log(`🚫 Traduction identique non autorisée: "${original}"`);
    return true;
  }
  
  return false;
}

// Dictionnaire de traductions fiables (étendu)
function getReliableTranslation(text, sourceLang, targetLang) {
  const translations = {
    'fr_en': {
      // Mots ambigus avec contexte
      'car': 'because', // En français, "car" signifie "parce que"
      // Mots qui posent problème
      'réseau': 'network',
      'réseaux': 'networks',
      'étudiants': 'students',
      'étudiant': 'student',
      'étudiante': 'student',
      'étudiantes': 'students',
      'connectivité': 'connectivity',
      'chaque': 'each',
      'dorsale': 'backbone',
      'internet': 'internet',
      'abilene': 'abilene',
      'différents': 'different',
      'différent': 'different',
      'différente': 'different',
      'différentes': 'different',
      'porte': 'door',
      'portes': 'doors',
      'population': 'population',
      'certaines': 'certain',
      'certains': 'certain',
      'principale': 'main',
      'principal': 'main',
      'principales': 'main',
      'principaux': 'main',
      // Mots courants
      'bonjour': 'hello',
      'bonsoir': 'good evening',
      'bonne nuit': 'good night',
      'merci': 'thank you',
      'merci beaucoup': 'thank you very much',
      'au revoir': 'goodbye',
      'oui': 'yes',
      'non': 'no',
      'peut-être': 'maybe',
      's\'il vous plaît': 'please',
      'excusez-moi': 'excuse me',
      'pardon': 'sorry',
      'de rien': 'you\'re welcome',
      // Mots avec apostrophes
      'l\'eau': 'water',
      'l\'homme': 'the man',
      'l\'amour': 'love',
      'd\'accord': 'okay',
      'aujourd\'hui': 'today'
    },
    'en_fr': {
      // Mots ambigus
      'car': 'voiture', // En anglais, "car" signifie "voiture"
      'pain': 'douleur', // En anglais, "pain" signifie "douleur"
      // Inverser les traductions fr_en importantes
      'network': 'réseau',
      'networks': 'réseaux',
      'students': 'étudiants',
      'student': 'étudiant',
      'connectivity': 'connectivité',
      'each': 'chaque',
      'backbone': 'dorsale',
      'internet': 'internet',
      'different': 'différent',
      'door': 'porte',
      'doors': 'portes',
      'population': 'population',
      'certain': 'certain',
      'main': 'principal',
      'hello': 'bonjour',
      'good morning': 'bonjour',
      'good evening': 'bonsoir',
      'good night': 'bonne nuit',
      'thank you': 'merci',
      'thanks': 'merci',
      'goodbye': 'au revoir',
      'bye': 'au revoir',
      'yes': 'oui',
      'no': 'non',
      'maybe': 'peut-être',
      'please': 's\'il vous plaît',
      'excuse me': 'excusez-moi',
      'sorry': 'pardon',
      'you\'re welcome': 'de rien',
      'water': 'eau',
      'the man': 'l\'homme',
      'love': 'amour',
      'okay': 'd\'accord',
      'today': 'aujourd\'hui'
    }
  };
  
  const key = `${sourceLang}_${targetLang}`;
  const textLower = text.toLowerCase().trim();
  
  return translations[key]?.[textLower] || null;
}

// Service de traduction principal avec fallback intelligent
async function translateWithService(text, sourceLang = 'auto', targetLang = 'fr', contextData = null) {
  try {
    console.log('🌐 Translation service:', { text, sourceLang, targetLang, isPro: userSettings.isPro });
    
    const cleanedText = cleanText(text);
    if (!cleanedText) throw new Error('Texte vide');
    
    // Vérifier le cache
    const cacheKey = `${cleanedText}_${sourceLang}_${targetLang}`;
    if (translationCache.has(cacheKey)) {
      console.log('📦 Utilisation du cache');
      return translationCache.get(cacheKey);
    }
    
    // Détection de langue si auto
    if (sourceLang === 'auto') {
      sourceLang = detectLanguage(cleanedText);
      console.log('🔍 Langue détectée:', sourceLang);
    }
    
    // Vérifier si même langue - IMPORTANT: vérifier pour TOUTES les langues, pas seulement FR
    if (sourceLang === targetLang) {
      console.log('⚠️ Même langue détectée:', sourceLang, '=', targetLang);
      
      // Pour les mots ambigus, essayer de détecter la vraie langue
      if (userSettings.autoDetectSameLanguage) {
        // Liste des mots ambigus connus
        const ambiguousWords = ['car', 'chat', 'pain', 'sale', 'centre', 'place'];
        const isAmbiguous = ambiguousWords.some(word => 
          cleanedText.toLowerCase() === word || 
          cleanedText.toLowerCase().includes(word)
        );
        
        if (isAmbiguous) {
          // Tester avec une autre langue
          const testLang = sourceLang === 'fr' ? 'en' : 'fr';
          const testResult = await quickTranslationTest(cleanedText, sourceLang, testLang);
          
          if (testResult && testResult.toLowerCase() !== cleanedText.toLowerCase()) {
            // C'est probablement l'autre langue
            sourceLang = testLang;
            console.log('🔄 Mot ambigu, langue corrigée:', sourceLang);
          } else {
            // C'est vraiment la même langue
            return {
              translation: `Déjà en ${getLanguageName(targetLang)}`,
              detectedLanguage: sourceLang,
              confidence: 1.0,
              source: 'Même langue détectée',
              sameLanguage: true,
              originalText: cleanedText
            };
          }
        } else {
          // Pas ambigu, c'est vraiment la même langue
          return {
            translation: `Déjà en ${getLanguageName(targetLang)}`,
            detectedLanguage: sourceLang,
            confidence: 1.0,
            source: 'Même langue détectée',
            sameLanguage: true,
            originalText: cleanedText
          };
        }
      } else {
        // Détection intelligente désactivée
        return {
          translation: `Déjà en ${getLanguageName(targetLang)}`,
          detectedLanguage: sourceLang,
          confidence: 1.0,
          source: 'Même langue détectée',
          sameLanguage: true,
          originalText: cleanedText
        };
      }
    }
    
    // 1. Essayer DeepSeek si Premium activé
    if (userSettings.isPro && userSettings.deepSeekEnabled && userSettings.deepSeekApiKey) {
      try {
        const deepSeekResult = await translateWithDeepSeek(cleanedText, sourceLang, targetLang, contextData);
        if (deepSeekResult) {
          translationCache.set(cacheKey, deepSeekResult);
          return deepSeekResult;
        }
      } catch (error) {
        console.warn('⚠️ DeepSeek failed, fallback to free services');
      }
    }
    
    // 2. Vérifier le dictionnaire fiable EN PREMIER
    const reliableTranslation = getReliableTranslation(cleanedText, sourceLang, targetLang);
    if (reliableTranslation) {
      console.log('✅ Utilisation du dictionnaire fiable:', cleanedText, '→', reliableTranslation);
      const result = {
        translation: reliableTranslation,
        detectedLanguage: sourceLang,
        confidence: 1.0,
        source: 'Dictionnaire intégré',
        originalText: cleanedText
      };
      translationCache.set(cacheKey, result);
      return result;
    }
    
    // 3. Services gratuits avec validation stricte
    console.log('🔄 Essai des services gratuits pour:', cleanedText);
    
    // Essayer MyMemory d'abord (plus fiable)
    try {
      const myMemoryResult = await translateWithMyMemory(cleanedText, sourceLang, targetLang);
      if (myMemoryResult && !isBadTranslation(cleanedText, myMemoryResult.translation, sourceLang, targetLang)) {
        console.log('✅ MyMemory réussi:', myMemoryResult.translation);
        translationCache.set(cacheKey, myMemoryResult);
        return myMemoryResult;
      }
    } catch (error) {
      console.warn('⚠️ MyMemory échoué');
    }
    
    // Essayer Lingva ensuite
    try {
      const lingvaResult = await translateWithLingva(cleanedText, sourceLang, targetLang);
      if (lingvaResult && !isBadTranslation(cleanedText, lingvaResult.translation, sourceLang, targetLang)) {
        console.log('✅ Lingva réussi:', lingvaResult.translation);
        translationCache.set(cacheKey, lingvaResult);
        return lingvaResult;
      }
    } catch (error) {
      console.warn('⚠️ Lingva échoué');
    }
    
    // 4. Fallback final
    return {
      translation: `${cleanedText} (traduction indisponible)`,
      detectedLanguage: sourceLang,
      confidence: 0.1,
      source: 'Fallback',
      originalText: cleanedText
    };
    
  } catch (error) {
    console.error('❌ Translation error:', error);
    throw error;
  }
}

// Test rapide de traduction pour détecter la langue réelle
async function quickTranslationTest(text, fromLang, toLang) {
  try {
    const langPair = `${fromLang}|${toLang}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// MyMemory Translation API
async function translateWithMyMemory(text, sourceLang, targetLang) {
  try {
    // Convertir les codes de langue pour MyMemory
    const langMap = {
      'auto': 'auto',
      'fr': 'fr-FR',
      'en': 'en-GB',
      'es': 'es-ES',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-PT',
      'ru': 'ru-RU',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'zh': 'zh-CN',
      'ar': 'ar-SA'
    };
    
    const source = langMap[sourceLang] || sourceLang;
    const target = langMap[targetLang] || targetLang;
    const langPair = `${source}|${target}`;
    
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return {
        translation: cleanText(data.responseData.translatedText),
        detectedLanguage: sourceLang,
        confidence: data.responseData.match || 0.8,
        source: 'MyMemory',
        originalText: text
      };
    }
    
    throw new Error('No translation from MyMemory');
  } catch (error) {
    console.error('❌ MyMemory error:', error);
    throw error;
  }
}

// Lingva Translate API (Google backend)
async function translateWithLingva(text, sourceLang, targetLang) {
  try {
    const url = `https://lingva.ml/api/v1/${sourceLang}/${targetLang}/${encodeURIComponent(text)}`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    if (data.translation) {
      return {
        translation: cleanText(data.translation),
        detectedLanguage: sourceLang,
        confidence: 0.9,
        source: 'Lingva (Google)',
        originalText: text
      };
    }
    
    throw new Error('No translation from Lingva');
  } catch (error) {
    console.error('❌ Lingva error:', error);
    throw error;
  }
}

// Extraire le contexte autour du texte sélectionné
function extractContext(selectedText, contextWords = 10) {
  try {
    const selection = window.getSelection();
    if (!selection.rangeCount) return { context: selectedText };
    
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    
    let fullText = '';
    if (container.nodeType === Node.TEXT_NODE) {
      fullText = container.textContent;
    } else {
      fullText = container.innerText || container.textContent || '';
    }
    
    // Trouver la position du texte sélectionné
    const selectedIndex = fullText.indexOf(selectedText);
    if (selectedIndex === -1) return { context: selectedText };
    
    // Extraire les mots avant et après
    const beforeText = fullText.substring(0, selectedIndex);
    const afterText = fullText.substring(selectedIndex + selectedText.length);
    
    const beforeWords = beforeText.split(/\s+/).slice(-contextWords).join(' ');
    const afterWords = afterText.split(/\s+/).slice(0, contextWords).join(' ');
    
    const context = `${beforeWords} ${selectedText} ${afterWords}`.trim();
    
    return {
      context,
      beforeContext: beforeWords,
      afterContext: afterWords,
      selectedText
    };
  } catch (error) {
    console.error('❌ Context extraction error:', error);
    return { context: selectedText };
  }
}

// Créer l'icône de traduction
function createIcon() {
  if (qtIcon) return qtIcon;
  
  qtIcon = document.createElement('div');
  qtIcon.id = 'qt-icon';
  qtIcon.innerHTML = '🌐';
  qtIcon.style.cssText = `
    position: absolute;
    width: 36px;
    height: 36px;
    background: ${userSettings.buttonColor || '#3b82f6'};
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 18px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    transition: all 0.2s ease;
    user-select: none;
    border: 2px solid white;
    animation: ${userSettings.animationsEnabled ? 'fadeIn 0.2s ease-out' : 'none'};
  `;
  
  qtIcon.addEventListener('click', handleTranslation);
  qtIcon.addEventListener('mouseenter', () => {
    if (userSettings.animationsEnabled) {
      qtIcon.style.transform = 'scale(1.1)';
      qtIcon.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
    }
  });
  qtIcon.addEventListener('mouseleave', () => {
    if (userSettings.animationsEnabled) {
      qtIcon.style.transform = 'scale(1)';
      qtIcon.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
    }
  });
  
  // Ajouter les animations CSS
  if (!document.getElementById('qt-animations')) {
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
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
        70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
        100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
      }
    `;
    document.head.appendChild(style);
  }
  
  return qtIcon;
}

// Positionner l'icône
function positionIcon(selection) {
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  const icon = createIcon();
  
  // Position intelligente
  let left = rect.right + window.scrollX + 8;
  let top = rect.top + window.scrollY - 8;
  
  // Ajustement si proche du bord droit
  if (left + 36 > window.innerWidth - 10) {
    left = rect.left + window.scrollX - 44;
  }
  
  // Ajustement si proche du haut
  if (top < 10) {
    top = rect.bottom + window.scrollY + 8;
  }
  
  icon.style.left = `${left}px`;
  icon.style.top = `${top}px`;
  icon.style.display = 'flex';
  
  if (!icon.parentNode) {
    document.body.appendChild(icon);
  }
}

// Créer la bulle de traduction
function createBubble() {
  if (qtBubble) return qtBubble;
  
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
    display: none;
    animation: ${userSettings.animationsEnabled ? 'fadeIn 0.2s ease-out' : 'none'};
  `;
  
  return qtBubble;
}

// Positionner la bulle
function positionBubble(selection) {
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  const bubble = createBubble();
  bubble.style.width = 'auto';
  bubble.style.display = 'block';
  bubble.style.visibility = 'hidden';
  
  // Mesurer la taille réelle de la bulle
  document.body.appendChild(bubble);
  const bubbleRect = bubble.getBoundingClientRect();
  const bubbleWidth = bubbleRect.width;
  const bubbleHeight = bubbleRect.height;
  
  let left = rect.left + window.scrollX;
  let top = rect.bottom + window.scrollY + 12;
  
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
  
  bubble.style.left = `${left}px`;
  bubble.style.top = `${top}px`;
  bubble.style.visibility = 'visible';
}

// Afficher le résultat de traduction
function displayTranslationResult(result, bubble, contextData) {
  currentTranslationData = {
    original: selectedText,
    translated: result.translation,
    language: userSettings.targetLanguage
  };
  
  const isPremium = userSettings.isPro && userSettings.deepSeekEnabled;
  const isAI = result.isAI || result.source === 'DeepSeek AI';
  const serviceIcon = isAI ? '🤖' : '🌐';
  const serviceName = result.source || 'Service de traduction';
  const sourceLabel = isAI ? 'DeepSeek AI • Intelligence artificielle' : serviceName;
  
  // Animations pour les éléments
  const animClass = userSettings.animationsEnabled ? 'qt-fade-in' : '';
  
  bubble.innerHTML = `
    <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-weight: 600; color: #374151;">
          ${serviceIcon} ${result.sameLanguage ? 'Même langue détectée' : 'Traduction'}
          ${isAI && !result.sameLanguage ? '<span style="font-size: 10px; color: #6b7280; margin-left: 8px;">par IA</span>' : ''}
        </span>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 11px; color: #9ca3af;">
            ${getFlagEmoji(result.detectedLanguage)} →
          </span>
          <select id="qt-lang-selector" style="font-size: 11px; padding: 2px 4px; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer;">
            <option value="fr" ${userSettings.targetLanguage === 'fr' ? 'selected' : ''}>🇫🇷 FR</option>
            <option value="en" ${userSettings.targetLanguage === 'en' ? 'selected' : ''}>🇺🇸 EN</option>
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
      
      <div class="${animClass}" style="color: #111827; padding: 12px; background: ${result.sameLanguage ? '#fef3c7' : '#f8fafc'}; border-radius: 8px; font-weight: 500; font-size: 15px;">
        ${result.translation}
      </div>
      
      ${userSettings.showConfidence && result.confidence ? `
      <div style="font-size: 10px; color: #9ca3af; margin-top: 4px; text-align: right;">
        ${sourceLabel} (${Math.round(result.confidence * 100)}% de confiance)
        ${isPremium ? ' • Intelligence artificielle' : ''}
      </div>
      ` : `
      <div style="font-size: 10px; color: #9ca3af; margin-top: 4px; text-align: right;">
        ${sourceLabel}
        ${isPremium ? ' • Intelligence artificielle' : ''}
      </div>
      `}
    </div>
    
    ${contextData && contextData.context !== selectedText && !result.sameLanguage ? `
    <div style="margin-bottom: 12px; padding: 8px; background: #f0f9ff; border-left: 3px solid #3b82f6; border-radius: 4px;">
      <div style="font-size: 11px; color: #3b82f6; font-weight: 600; margin-bottom: 4px;">
        📝 Contexte analysé:
      </div>
      <div style="font-size: 12px; color: #1e40af; font-style: italic;">
        "...${contextData.beforeContext} <strong>${selectedText}</strong> ${contextData.afterContext}..."
      </div>
    </div>
    ` : ''}
    
    <div style="margin-bottom: 12px;">
      <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Texte original:</div>
      <div style="font-size: 13px; color: #4b5563; font-style: italic;">
        "${selectedText}"
      </div>
    </div>
    
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; gap: 8px;">
        ${!result.sameLanguage ? `
        <button id="qt-save-flashcard" style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
          💾 Flashcard
        </button>
        ` : ''}
        <button id="qt-copy-translation" style="background: #6b7280; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
          📋 Copier
        </button>
        <button id="qt-speak" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
          🔊 Écouter
        </button>
      </div>
      
      <div style="font-size: 10px; color: #9ca3af;">
        Quick Translator ${isPremium ? 'Premium 🤖' : 'Free'}
      </div>
    </div>
    
    ${!isPremium ? `
    <div style="margin-top: 12px; padding: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; text-align: center;">
      <div style="color: white; font-size: 12px; margin-bottom: 4px;">
        🤖 Passez à Premium avec DeepSeek AI!
      </div>
      <div style="color: rgba(255,255,255,0.9); font-size: 10px; margin-bottom: 6px;">
        Traductions ultra-précises • Détection langue intelligente • Support prioritaire
      </div>
      <button id="qt-upgrade-pro" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 4px 12px; border-radius: 4px; font-size: 11px; cursor: pointer; transition: all 0.2s;">
        En savoir plus →
      </button>
    </div>
    ` : ''}
    
    <style>
      .qt-fade-in {
        animation: fadeIn 0.3s ease-out;
      }
      #qt-bubble button:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      }
      #qt-bubble button:active {
        transform: translateY(0);
      }
    </style>
  `;
  
  // Ajouter les event listeners
  setTimeout(() => {
    const saveBtn = document.getElementById('qt-save-flashcard');
    const copyBtn = document.getElementById('qt-copy-translation');
    const speakBtn = document.getElementById('qt-speak');
    const langSelector = document.getElementById('qt-lang-selector');
    const upgradeBtn = document.getElementById('qt-upgrade-pro');
    
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        saveToFlashcard(selectedText, result.translation, userSettings.targetLanguage);
      });
    }
    
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(result.translation);
        copyBtn.textContent = '✅ Copié!';
        copyBtn.style.background = '#059669';
        setTimeout(() => {
          copyBtn.textContent = '📋 Copier';
          copyBtn.style.background = '#6b7280';
        }, 2000);
      });
    }
    
    if (speakBtn) {
      speakBtn.addEventListener('click', () => {
        speakText(result.translation, userSettings.targetLanguage);
      });
    }
    
    if (langSelector) {
      langSelector.addEventListener('change', async (e) => {
        const newLang = e.target.value;
        userSettings.targetLanguage = newLang;
        
        if (chrome.storage && chrome.storage.sync) {
          chrome.storage.sync.set({ targetLanguage: newLang });
        }
        
        // Retraduire
        bubble.innerHTML = '<div style="text-align: center; padding: 20px;">⏳ Retraduction en cours...</div>';
        
        try {
          const newResult = await translateWithService(selectedText, 'auto', newLang, contextData);
          displayTranslationResult(newResult, bubble, contextData);
        } catch (error) {
          bubble.innerHTML = '<div style="text-align: center; color: #dc2626; padding: 20px;">❌ Erreur de retraduction</div>';
        }
      });
    }
    
    if (upgradeBtn) {
      upgradeBtn.addEventListener('click', () => {
        window.open('https://quick-translator-pro.com/pricing', '_blank');
      });
    }
  }, 100);
}

// Fonction pour lire le texte à haute voix
function speakText(text, language) {
  if ('speechSynthesis' in window) {
    // Arrêter toute lecture en cours
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Trouver la meilleure voix pour la langue
    const voices = window.speechSynthesis.getVoices();
    const langVoice = voices.find(voice => voice.lang.startsWith(language)) || 
                      voices.find(voice => voice.lang.includes(language)) ||
                      voices[0];
    
    if (langVoice) {
      utterance.voice = langVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  } else {
    console.warn('⚠️ Synthèse vocale non supportée');
  }
}

// Obtenir l'emoji du drapeau pour une langue
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
    'auto': '🌐'
  };
  
  return flags[langCode] || '🌐';
}

// Sauvegarder en flashcard
function saveToFlashcard(front, back, language) {
  try {
    if (!chrome.storage || !chrome.storage.local) {
      console.warn('⚠️ Extension context invalidated');
      return;
    }
    
    const flashcard = {
      id: Date.now(),
      front: cleanText(front),
      back: cleanText(back),
      language: language,
      created: new Date().toISOString(),
      folder: 'default',
      reviews: 0,
      lastReview: null,
      difficulty: 'normal'
    };
    
    chrome.storage.local.get({ flashcards: [] }, (data) => {
      if (chrome.runtime.lastError) {
        console.warn('⚠️ Erreur chrome.storage:', chrome.runtime.lastError.message);
        return;
      }
      
      const flashcards = data.flashcards || [];
      
      // Éviter les doublons
      const exists = flashcards.some(f => 
        f.front.toLowerCase() === flashcard.front.toLowerCase() && 
        f.back.toLowerCase() === flashcard.back.toLowerCase()
      );
      
      if (!exists) {
        flashcards.push(flashcard);
        
        chrome.storage.local.set({ flashcards }, () => {
          if (!chrome.runtime.lastError) {
            console.log('✅ Flashcard sauvegardée');
            // Feedback visuel avec animation
            const btn = document.getElementById('qt-save-flashcard');
            if (btn) {
              btn.textContent = '✅ Ajouté!';
              btn.style.background = '#059669';
              if (userSettings.animationsEnabled) {
                btn.style.animation = 'pulse 0.5s';
              }
              setTimeout(() => {
                btn.textContent = '💾 Flashcard';
                btn.style.background = '#10b981';
                btn.style.animation = '';
              }, 2000);
            }
          }
        });
      } else {
        // Déjà existe
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
    });
  } catch (error) {
    console.error('❌ Erreur sauvegarde flashcard:', error);
  }
}

// Gérer la traduction
async function handleTranslation(event) {
  event.preventDefault();
  event.stopPropagation();
  
  if (isTranslating || !selectedText.trim() || !userSettings.isEnabled) return;
  
  isTranslating = true;
  
  try {
    const bubble = createBubble();
    const selection = window.getSelection();
    
    if (selection.rangeCount > 0) {
      positionBubble(selection);
    }
    
    // Afficher le chargement avec animation
    bubble.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 20px; height: 20px; border: 3px solid ${userSettings.buttonColor}; border-top: 3px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <div>
          <div style="font-weight: 600; color: #374151;">
            ${userSettings.isPro && userSettings.deepSeekEnabled ? '🤖 DeepSeek AI analyse...' : '🌐 Traduction en cours...'}
          </div>
          <div style="font-size: 12px; color: #6b7280;">Analyse du contexte linguistique</div>
        </div>
      </div>
    `;
    
    bubble.style.display = 'block';
    
    // Extraire le contexte
    const contextData = extractContext(selectedText);
    
    // Traduire
    const result = await translateWithService(selectedText, 'auto', userSettings.targetLanguage, contextData);
    
    // Sauvegarder la traduction (seulement si langues différentes)
    if (!result.sameLanguage) {
      await saveTranslation(selectedText, result.translation, result.detectedLanguage, userSettings.targetLanguage);
    }
    
    // Afficher le résultat
    displayTranslationResult(result, bubble, contextData);
    
  } catch (error) {
    console.error('❌ Erreur de traduction:', error);
    
    const bubble = createBubble();
    bubble.innerHTML = `
      <div style="text-align: center; color: #dc2626; padding: 20px;">
        <div style="font-size: 24px; margin-bottom: 8px;">⚠️</div>
        <div style="font-weight: 600; margin-bottom: 4px;">Erreur de traduction</div>
        <div style="font-size: 12px; color: #6b7280;">
          ${error.message || 'Service temporairement indisponible'}
        </div>
        <button onclick="this.parentElement.parentElement.style.display='none'" style="margin-top: 8px; background: #dc2626; color: white; border: none; padding: 4px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">
          Fermer
        </button>
      </div>
    `;
    bubble.style.display = 'block';
  } finally {
    isTranslating = false;
  }
}

// Masquer les éléments
function hideElements() {
  if (qtIcon) qtIcon.style.display = 'none';
  if (qtBubble) qtBubble.style.display = 'none';
}

// Gérer la sélection de texte
async function handleTextSelection() {
  if (!userSettings.isEnabled) return;
  
  const selection = window.getSelection();
  const text = selection.toString().trim();
  
  if (text && text.length > 0 && text.length < 500) {
    selectedText = text;
    
    setTimeout(() => {
      if (window.getSelection().toString().trim() === text) {
        positionIcon(selection);
      }
    }, 150);
  } else {
    selectedText = '';
    hideElements();
  }
}

// Event listeners
document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('keyup', handleTextSelection);

document.addEventListener('click', (event) => {
  if (!qtIcon?.contains(event.target) && !qtBubble?.contains(event.target)) {
    hideElements();
  }
});

document.addEventListener('scroll', hideElements);

// Raccourci clavier Ctrl+Q (au lieu de Ctrl+T qui ouvre un nouvel onglet)
document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'q' && selectedText && userSettings.enableShortcut) {
    event.preventDefault();
    handleTranslation(event);
  }
});

// Écouter les changements de paramètres
if (chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
      loadSettings();
    }
  });
}

// Écouter les messages du popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateButtonColor' && qtIcon) {
    qtIcon.style.background = request.color;
  } else if (request.action === 'updateSettings') {
    userSettings = request.settings;
    if (qtIcon) {
      qtIcon.style.background = userSettings.buttonColor;
    }
  }
});

// Précharger les voix pour la synthèse vocale
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

// Initialisation
(async function init() {
  try {
    await loadSettings();
    console.log('🚀 Quick Translator Pro initialisé avec succès!');
    console.log('⚙️ Configuration:', {
      isPro: userSettings.isPro,
      deepSeekEnabled: userSettings.deepSeekEnabled,
      hasApiKey: !!userSettings.deepSeekApiKey,
      animationsEnabled: userSettings.animationsEnabled
    });
  } catch (error) {
    console.error('❌ Erreur initialisation:', error);
  }
})();