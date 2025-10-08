// Route webhook Stripe AMÉLIORÉE pour trouver l'utilisateur
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

// Webhook Stripe - DOIT recevoir le body RAW
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log('✅ Stripe webhook received!');
  const sig = req.headers['stripe-signature'];
  let event;

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('⚠️ STRIPE_WEBHOOK_SECRET not configured!');
    return res.status(500).send('Webhook secret not configured');
  }

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log('✅ Webhook signature verified!');
    console.log('Event type:', event.type);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('💳 Checkout session completed!');
        const session = event.data.object;

        // Récupérer la session complète avec toutes les données
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['line_items', 'customer', 'subscription']
        });

        console.log('Session data:', {
          id: fullSession.id,
          customer: fullSession.customer,
          customer_email: fullSession.customer_email,
          metadata: fullSession.metadata,
          mode: fullSession.mode
        });

        // Trouver l'utilisateur - essayer plusieurs méthodes
        let user = null;

        // Méthode 1: Par email direct de la session
        if (fullSession.customer_email) {
          console.log('Searching by session email:', fullSession.customer_email);
          user = await User.findOne({ where: { email: fullSession.customer_email } });
        }

        // Méthode 2: Par metadata userId
        if (!user && fullSession.metadata?.userId) {
          console.log('Searching by metadata.userId:', fullSession.metadata.userId);
          user = await User.findByPk(fullSession.metadata.userId);
        }

        // Méthode 3: Par customer ID Stripe existant
        if (!user && fullSession.customer) {
          const customerId = typeof fullSession.customer === 'string' ?
            fullSession.customer : fullSession.customer.id;

          console.log('Searching by stripeCustomerId:', customerId);
          user = await User.findOne({ where: { stripeCustomerId: customerId } });

          // Méthode 4: Récupérer le customer et chercher par son email
          if (!user) {
            const customer = typeof fullSession.customer === 'object' ?
              fullSession.customer : await stripe.customers.retrieve(customerId);

            if (customer.email) {
              console.log('Searching by customer.email:', customer.email);
              user = await User.findOne({ where: { email: customer.email } });
            }
          }
        }

        if (!user) {
          console.error('❌ User not found for session:', fullSession.id);
          console.error('Tried all methods. Session details:', {
            customer_email: fullSession.customer_email,
            metadata: fullSession.metadata,
            customer: fullSession.customer
          });

          // Ne pas bloquer le webhook, mais logger l'erreur
          return res.json({ received: true, warning: 'User not found but payment received' });
        }

        console.log('✅ User found:', user.email);

        // Déterminer le plan à partir des line_items ou du mode
        let plan = 'monthly'; // Par défaut

        // Essayer de récupérer le price ID
        const lineItem = fullSession.line_items?.data?.[0];
        const priceId = lineItem?.price?.id;

        console.log('Price ID:', priceId);

        if (priceId === process.env.STRIPE_YEARLY_PRICE_ID ||
            priceId === 'price_1RpQMQ2VEl7gdPoz3JtfaNEk') {
          plan = 'yearly';
        } else if (priceId === process.env.STRIPE_MONTHLY_PRICE_ID ||
                   priceId === 'price_1RpQMQ2VEl7gdPozfYJSzL6B') {
          plan = 'monthly';
        }

        // Calculer la date d'expiration
        const premiumUntil = new Date();
        if (plan === 'yearly') {
          premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);
        } else {
          premiumUntil.setMonth(premiumUntil.getMonth() + 1);
        }

        // Mettre à jour l'utilisateur
        const updateData = {
          isPremium: true,
          subscriptionStatus: 'active',
          subscriptionPlan: plan,
          premiumUntil: premiumUntil
        };

        // Ajouter le customer ID si on l'a
        if (fullSession.customer) {
          const customerId = typeof fullSession.customer === 'string' ?
            fullSession.customer : fullSession.customer.id;
          updateData.stripeCustomerId = customerId;
        }

        // Si c'est un abonnement, sauvegarder l'ID
        if (fullSession.subscription) {
          const subscriptionId = typeof fullSession.subscription === 'string' ?
            fullSession.subscription : fullSession.subscription.id;
          updateData.stripeSubscriptionId = subscriptionId;
        }

        await user.update(updateData);

        console.log('✅ User upgraded to premium!', {
          email: user.email,
          plan: plan,
          expires: premiumUntil
        });

        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        console.log(`Subscription ${event.type}:`, subscription.id);

        // Trouver l'utilisateur par subscription ID ou customer
        let subUser = await User.findOne({
          where: { stripeSubscriptionId: subscription.id }
        });

        if (!subUser && subscription.customer) {
          subUser = await User.findOne({
            where: { stripeCustomerId: subscription.customer }
          });
        }

        if (subUser) {
          const isActive = subscription.status === 'active';
          await subUser.update({
            isPremium: isActive,
            subscriptionStatus: subscription.status
          });
          console.log(`User ${subUser.email} subscription status: ${subscription.status}`);
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