// Configuration pour DeepSeek API
const DEEPSEEK_CONFIG = {
  // Utiliser le modèle DeepSeek V3 (deepseek-chat) au lieu de R1
  model: 'deepseek-chat', // Pointe vers DeepSeek-V3-0324
  apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
  
  // Configuration pour les traductions
  translationPrompt: (text, sourceLang, targetLang) => {
    return {
      model: DEEPSEEK_CONFIG.model,
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the given text from ${sourceLang} to ${targetLang}. Provide only the translation without any explanation or additional text. Maintain the original tone and style.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3, // Basse température pour des traductions cohérentes
      max_tokens: 1000
    };
  }
};

// Fonction pour traduire avec DeepSeek
async function translateWithDeepSeek(text, targetLang, sourceLang, apiKey) {
  try {
    const response = await fetch(DEEPSEEK_CONFIG.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(DEEPSEEK_CONFIG.translationPrompt(text, sourceLang, targetLang))
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      translatedText: data.choices[0].message.content.trim(),
      detectedLanguage: sourceLang,
      confidence: 0.95, // DeepSeek a généralement une haute confiance
      service: 'DeepSeek V3'
    };
  } catch (error) {
    console.error('DeepSeek translation error:', error);
    return null;
  }
}

// Export pour utilisation dans d'autres fichiers
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEEPSEEK_CONFIG, translateWithDeepSeek };
}