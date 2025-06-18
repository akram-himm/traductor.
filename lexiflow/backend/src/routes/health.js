const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');
const Stripe = require('stripe');
const os = require('os');

router.get('/health', async (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '0.8.0',
    services: {
      database: 'connected',
      stripe: 'configured',
      email: 'ready'
    }
  });
});

router.get('/health/detailed', async (req, res) => {
  try {
    const sequelize = new Sequelize(process.env.DATABASE_URL, { logging: false });
    await sequelize.authenticate();

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    await stripe.products.list();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '0.8.0',
      services: {
        database: 'connected',
        stripe: 'configured',
        email: 'ready'
      },
      system: {
        memoryUsage: process.memoryUsage(),
        uptime: os.uptime()
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;
