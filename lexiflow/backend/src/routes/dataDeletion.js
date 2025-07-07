const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const Flashcard = require('../models/Flashcard');

// Fonction pour décoder le signed_request de Facebook
function parseSignedRequest(signedRequest, appSecret) {
  const [encodedSig, encodedData] = signedRequest.split('.');
  
  if (!encodedSig || !encodedData) {
    throw new Error('Invalid signed_request format');
  }

  // Décoder la signature et les données
  const sig = Buffer.from(encodedSig.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  const data = Buffer.from(encodedData.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  
  // Vérifier la signature
  const expectedSig = crypto
    .createHmac('sha256', appSecret)
    .update(encodedData)
    .digest();
  
  if (!crypto.timingSafeEqual(sig, expectedSig)) {
    throw new Error('Invalid signature');
  }
  
  // Parser les données JSON
  return JSON.parse(data.toString('utf-8'));
}

// POST /data-deletion - Endpoint appelé par Facebook
router.post('/data-deletion', async (req, res) => {
  try {
    const { signed_request } = req.body;
    
    if (!signed_request) {
      return res.status(400).json({ error: 'Missing signed_request parameter' });
    }
    
    // Récupérer le secret de l'app Facebook depuis les variables d'environnement
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    if (!appSecret) {
      console.error('FACEBOOK_APP_SECRET not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    // Décoder le signed_request
    let decodedRequest;
    try {
      decodedRequest = parseSignedRequest(signed_request, appSecret);
    } catch (error) {
      console.error('Error parsing signed_request:', error);
      return res.status(400).json({ error: 'Invalid signed_request' });
    }
    
    // Extraire l'ID utilisateur Facebook
    const facebookUserId = decodedRequest.user_id;
    if (!facebookUserId) {
      return res.status(400).json({ error: 'No user_id in signed_request' });
    }
    
    // Trouver l'utilisateur dans notre base de données
    const user = await User.findOne({ 
      where: {
        facebookId: facebookUserId
      }
    });
    
    if (user) {
      // Supprimer toutes les flashcards de l'utilisateur
      await Flashcard.destroy({ 
        where: { userId: user.id } 
      });
      
      // Marquer l'utilisateur pour suppression ou le supprimer directement
      if (process.env.SOFT_DELETE === 'true') {
        // Soft delete : marquer comme supprimé
        user.deletedAt = new Date();
        user.deletionRequestId = crypto.randomBytes(16).toString('hex');
        await user.save();
      } else {
        // Hard delete : supprimer immédiatement
        await user.destroy();
      }
      
      console.log(`Data deletion requested for Facebook user ${facebookUserId}`);
    }
    
    // Répondre selon les spécifications Facebook
    const statusUrl = `https://my-backend-api-cng7.onrender.com/data-deletion-status?id=${facebookUserId}`;
    
    res.json({
      url: statusUrl,
      confirmation_code: crypto.randomBytes(8).toString('hex')
    });
    
  } catch (error) {
    console.error('Error in data deletion endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /data-deletion-status - Page de statut de suppression
router.get('/data-deletion-status', (req, res) => {
  const { id } = req.query;
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>LexiFlow - Data Deletion Status</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 600px;
          margin: 50px auto;
          padding: 20px;
          background: #f5f5f5;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          text-align: center;
        }
        .success-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        h1 {
          color: #1f2937;
          margin-bottom: 10px;
        }
        .status {
          color: #059669;
          font-weight: bold;
          font-size: 18px;
          margin-bottom: 20px;
        }
        .details {
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .timeline {
          text-align: left;
          margin: 30px 0;
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
        }
        .timeline-item {
          margin: 10px 0;
          padding-left: 20px;
          position: relative;
        }
        .timeline-item:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #059669;
        }
        .footer {
          margin-top: 30px;
          font-size: 14px;
          color: #9ca3af;
        }
        .user-id {
          font-family: monospace;
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success-icon">✅</div>
        <h1>Data Deletion Complete</h1>
        <div class="status">Your data has been successfully deleted</div>
        
        <div class="details">
          ${id ? `<p>Request ID: <span class="user-id">${id}</span></p>` : ''}
          <p>All your personal data has been removed from LexiFlow.</p>
        </div>
        
        <div class="timeline">
          <h3>What was deleted:</h3>
          <div class="timeline-item">Account information (email, name)</div>
          <div class="timeline-item">All flashcards and translations</div>
          <div class="timeline-item">Learning progress and statistics</div>
          <div class="timeline-item">Subscription information</div>
          <div class="timeline-item">Authentication tokens</div>
        </div>
        
        <div class="details">
          <p><strong>Processing time:</strong> Immediate</p>
          <p><strong>Status:</strong> Completed</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="footer">
          <p>If you have any questions about this deletion, please contact:</p>
          <p><strong>privacy@lexiflow.app</strong></p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// GET /data-deletion - Page d'information (garde l'ancienne route pour la navigation)
router.get('/data-deletion', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>LexiFlow - Data Deletion</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
        h1 { color: #667eea; }
        h2 { color: #764ba2; margin-top: 30px; }
        .deletion-box { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .warning { color: #ef4444; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>Data Deletion Request - LexiFlow</h1>
      
      <h2>How to Delete Your Data</h2>
      
      <div class="deletion-box">
        <h3>Method 1: From the Extension (Recommended)</h3>
        <ol>
          <li>Open the LexiFlow extension</li>
          <li>Click on your profile button</li>
          <li>Select "Delete Account"</li>
          <li>Confirm the deletion</li>
        </ol>
      </div>
      
      <div class="deletion-box">
        <h3>Method 2: Through Facebook</h3>
        <p>If you logged in with Facebook, you can request deletion through:</p>
        <ul>
          <li>Facebook Settings → Apps and Websites → LexiFlow → Remove</li>
          <li>This will automatically trigger our data deletion process</li>
        </ul>
      </div>
      
      <div class="deletion-box">
        <h3>Method 3: Email Request</h3>
        <p>Send an email to: <strong>privacy@lexiflow.app</strong></p>
        <p>Include your registered email address</p>
      </div>
      
      <h2>What Gets Deleted</h2>
      <ul>
        <li>All personal information</li>
        <li>All flashcards and translations</li>
        <li>Usage history and statistics</li>
        <li>Authentication data</li>
      </ul>
      
      <p class="warning">⚠️ Data deletion is permanent and cannot be undone.</p>
    </body>
    </html>
  `);
});

module.exports = router;