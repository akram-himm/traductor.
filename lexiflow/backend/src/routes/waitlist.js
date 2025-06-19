const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

console.log('🔥 Waitlist routes loaded!');

// Fichier où on stocke les emails
const WAITLIST_FILE = path.join(__dirname, '../../../data/waitlist.json');

// Créer le dossier data s'il n'existe pas
const ensureDataDir = async () => {
  const dataDir = path.dirname(WAITLIST_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
};

// Route GET /api/waitlist/stats
router.get('/stats', async (req, res) => {
  try {
    let waitlist = [];
    try {
      const data = await fs.readFile(WAITLIST_FILE, 'utf8');
      waitlist = JSON.parse(data);
    } catch {
      // Pas de fichier encore
    }
    
    res.json({
      count: waitlist.length,
      total: waitlist.length,
      earlyBirds: waitlist.filter(e => e.isEarlyBird).length,
      lastSignup: waitlist[waitlist.length - 1]?.timestamp
    });
  } catch (error) {
    res.json({
      count: 0,
      total: 0,
      earlyBirds: 0,
      lastSignup: null
    });
  }
});

// Route POST /api/waitlist/subscribe
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Vérifier l'email
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Email invalide'
      });
    }
    
    // Créer le dossier si nécessaire
    await ensureDataDir();
    
    // Lire la liste existante
    let waitlist = [];
    try {
      const data = await fs.readFile(WAITLIST_FILE, 'utf8');
      waitlist = JSON.parse(data);
    } catch (error) {
      // Le fichier n'existe pas encore, c'est OK
    }
    
    // Vérifier si l'email existe déjà
    if (waitlist.some(entry => entry.email === email)) {
      return res.status(409).json({
        success: false,
        error: 'Cet email est déjà inscrit'
      });
    }
    
    // Ajouter le nouvel email
    const entry = {
      email,
      timestamp: new Date().toISOString(),
      position: waitlist.length + 1,
      isEarlyBird: waitlist.length < 1000
    };
    
    waitlist.push(entry);
    
    // Sauvegarder
    await fs.writeFile(WAITLIST_FILE, JSON.stringify(waitlist, null, 2));
    
    console.log(`✅ Nouvel inscrit : ${email} (position ${entry.position})`);
    
    // Répondre avec le format attendu par le frontend
    res.json({
      success: true,
      message: 'Inscription réussie !',
      position: entry.position,
      isEarlyBird: entry.isEarlyBird
    });
    
  } catch (error) {
    console.error('Erreur waitlist:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'inscription'
    });
  }
});

module.exports = router;