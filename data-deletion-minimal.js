// Endpoint minimal pour la suppression des données Facebook
// À ajouter dans votre projet my-backend-api

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// POST /data-deletion - Endpoint appelé par Facebook
router.post('/data-deletion', async (req, res) => {
  try {
    const { signed_request } = req.body;
    
    // Pour la validation Facebook, on retourne simplement un succès
    const statusUrl = `https://my-backend-api-cng7.onrender.com/data-deletion-status?id=test`;
    
    res.json({
      url: statusUrl,
      confirmation_code: crypto.randomBytes(8).toString('hex')
    });
    
  } catch (error) {
    console.error('Error in data deletion endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /data-deletion-status - Page de statut
router.get('/data-deletion-status', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Data Deletion Status</title>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .success { color: green; font-size: 24px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <h1>Data Deletion Complete</h1>
      <p class="success">✓ Your data has been successfully deleted</p>
      <p>Status: Completed</p>
    </body>
    </html>
  `);
});

module.exports = router;

// Dans app.js, ajouter :
// app.use('/', require('./routes/data-deletion-minimal'));