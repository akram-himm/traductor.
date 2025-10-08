// Route webhook Stripe SÉPARÉE pour éviter les conflits de middleware
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Subscription = require('../models/Subscription');

// Webhook Stripe - DOIT recevoir le body RAW
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log('✅ Stripe webhook received!');
  console.log('Headers received:', req.headers['stripe-signature'] ? 'Yes' : 'No');

  const sig = req.headers['stripe-signature'];
  let event;

  // Vérifier que le webhook secret est configuré
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('⚠️ STRIPE_WEBHOOK_SECRET not configured!');
    return res.status(500).send('Webhook secret not configured');
  }

  try {
    // Vérifier la signature Stripe
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log('✅ Webhook signature verified successfully!');
    console.log('Event type:', event.type);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    console.error('   Make sure STRIPE_WEBHOOK_SECRET is correct');
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Traiter l'événement
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('💳 Checkout session completed!');
        const session = event.data.object;

        // Trouver l'utilisateur
        let user;
        if (session.customer_email) {
          user = await User.findOne({ where: { email: session.customer_email } });
        } else if (session.metadata?.userId) {
          user = await User.findByPk(session.metadata.userId);
        }

        if (!user) {
          console.error('User not found for session:', session.id);
          return res.json({ received: true, error: 'User not found' });
        }

        // Déterminer le plan
        const priceId = session.line_items?.data?.[0]?.price?.id ||
                       session.subscription_items?.data?.[0]?.price?.id;

        let plan = 'monthly';
        if (priceId === process.env.STRIPE_YEARLY_PRICE_ID ||
            priceId === 'price_1RpQMQ2VEl7gdPoz3JtfaNEk') {
          plan = 'yearly';
        }

        // Calculer la date d'expiration
        const premiumUntil = new Date();
        if (plan === 'yearly') {
          premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);
        } else {
          premiumUntil.setMonth(premiumUntil.getMonth() + 1);
        }

        // Mettre à jour l'utilisateur
        await user.update({
          isPremium: true,
          subscriptionStatus: 'active',
          subscriptionPlan: plan,
          premiumUntil: premiumUntil,
          stripeCustomerId: session.customer
        });

        console.log('✅ User upgraded to premium:', user.email, plan);
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer);

        if (customer.email) {
          const userSub = await User.findOne({ where: { email: customer.email } });
          if (userSub) {
            const isActive = subscription.status === 'active';
            await userSub.update({
              isPremium: isActive,
              subscriptionStatus: subscription.status
            });
            console.log(`User ${customer.email} subscription status: ${subscription.status}`);
          }
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.json({ received: true, error: error.message });
  }
});

module.exports = router;