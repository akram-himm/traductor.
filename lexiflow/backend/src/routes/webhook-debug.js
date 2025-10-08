// Route temporaire pour débugger le webhook
const express = require('express');
const router = express.Router();

// Route de debug pour voir ce que Render reçoit
router.post('/webhook-debug', express.raw({ type: 'application/json' }), (req, res) => {
  console.log('🔍 WEBHOOK DEBUG - Requête reçue !');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Secret configuré sur Render:', process.env.STRIPE_WEBHOOK_SECRET ?
    `${process.env.STRIPE_WEBHOOK_SECRET.substring(0, 20)}...` :
    'NON CONFIGURÉ');

  const sig = req.headers['stripe-signature'];
  if (sig) {
    console.log('Signature reçue:', sig.substring(0, 50) + '...');
  } else {
    console.log('❌ Pas de signature Stripe !');
  }

  // Répondre OK pour éviter que Stripe retry
  res.json({
    received: true,
    debug: {
      secretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
      secretStart: process.env.STRIPE_WEBHOOK_SECRET ?
        process.env.STRIPE_WEBHOOK_SECRET.substring(0, 20) : null,
      signatureReceived: !!sig
    }
  });
});

module.exports = router;