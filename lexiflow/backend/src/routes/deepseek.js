const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const premiumMiddleware = require('../middleware/premium');
const deepseekService = require('../services/deepseekService');
const User = require('../models/User');

// Gérer la clé API DeepSeek
router.post('/deepseek-key', authMiddleware, premiumMiddleware, async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey || apiKey.length < 20) {
      return res.status(400).json({
        success: false,
        error: 'Clé API invalide'
      });
    }
    
    // Valider la clé avec DeepSeek
    const isValid = await deepseekService.validateApiKey(apiKey);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Clé API DeepSeek invalide ou expirée'
      });
    }
    
    // Chiffrer et sauvegarder la clé
    const encryptedKey = deepseekService.encryptApiKey(apiKey);
    await req.user.update({
      deepseekApiKey: encryptedKey
    });
    
    res.json({
      success: true,
      message: 'Clé API DeepSeek sauvegardée avec succès'
    });
    
  } catch (error) {
    console.error('Erreur sauvegarde clé DeepSeek:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la sauvegarde de la clé API'
    });
  }
});

// Vérifier le statut de la clé DeepSeek
router.get('/deepseek-status', authMiddleware, premiumMiddleware, async (req, res) => {
  try {
    const { deepseekApiKey } = req.user;
    
    if (!deepseekApiKey) {
      return res.json({
        success: true,
        hasKey: false
      });
    }
    
    // Déchiffrer et valider la clé
    const apiKey = deepseekService.decryptApiKey(deepseekApiKey);
    const isValid = await deepseekService.validateApiKey(apiKey);
    
    res.json({
      success: true,
      hasKey: true,
      isValid
    });
    
  } catch (error) {
    console.error('Erreur vérification DeepSeek:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification de la clé API'
    });
  }
});

// Supprimer la clé DeepSeek
router.delete('/deepseek-key', authMiddleware, async (req, res) => {
  try {
    await req.user.update({
      deepseekApiKey: null
    });
    
    res.json({
      success: true,
      message: 'Clé API DeepSeek supprimée'
    });
    
  } catch (error) {
    console.error('Erreur suppression clé DeepSeek:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de la clé API'
    });
  }
});

module.exports = router;
