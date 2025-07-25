const fetch = require('node-fetch');

const deepseekTranslationService = {
  // Configuration du modèle DeepSeek V3
  config: {
    model: 'deepseek-chat', // Utilise DeepSeek V3 au lieu de R1
    apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
    temperature: 0.3,
    maxTokens: 1000
  },

  // Fonction pour traduire du texte avec DeepSeek
  translate: async (text, sourceLang, targetLang, apiKey) => {
    try {
      const requestBody = {
        model: deepseekTranslationService.config.model,
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the given text from ${sourceLang} to ${targetLang}. 
                     Provide only the translation without any explanation or additional text. 
                     Maintain the original tone, style, and formatting.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: deepseekTranslationService.config.temperature,
        max_tokens: deepseekTranslationService.config.maxTokens
      };

      const response = await fetch(deepseekTranslationService.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('DeepSeek API error:', error);
        throw new Error(`DeepSeek API returned ${response.status}: ${error}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from DeepSeek API');
      }

      return {
        success: true,
        translation: data.choices[0].message.content.trim(),
        model: deepseekTranslationService.config.model,
        usage: data.usage || null
      };
    } catch (error) {
      console.error('DeepSeek translation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Fonction pour détecter la langue avec DeepSeek
  detectLanguage: async (text, apiKey) => {
    try {
      const requestBody = {
        model: deepseekTranslationService.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are a language detection expert. Identify the language of the given text. Respond with only the ISO 639-1 language code (e.g., "en" for English, "fr" for French, "es" for Spanish).'
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.1, // Très basse température pour une détection cohérente
        max_tokens: 10
      };

      const response = await fetch(deepseekTranslationService.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API returned ${response.status}`);
      }

      const data = await response.json();
      const languageCode = data.choices[0].message.content.trim().toLowerCase();

      return {
        success: true,
        language: languageCode
      };
    } catch (error) {
      console.error('DeepSeek language detection error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

module.exports = deepseekTranslationService;