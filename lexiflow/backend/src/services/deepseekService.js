const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-encryption-key-32-characters-long'; // 32 bytes
const IV_LENGTH = 16; // For AES, this is always 16

const deepseekService = {
  // Chiffrer la clé API
  encryptApiKey: (apiKey) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY),
      iv
    );
    
    let encrypted = cipher.update(apiKey);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  },
  
  // Déchiffrer la clé API
  decryptApiKey: (encryptedKey) => {
    const [ivHex, encryptedHex] = encryptedKey.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY),
      iv
    );
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  },
  
  // Valider la clé API avec DeepSeek
  validateApiKey: async (apiKey) => {
    try {
      const response = await fetch('https://api.deepseek.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Erreur validation DeepSeek:', error);
      return false;
    }
  }
};

module.exports = deepseekService;
