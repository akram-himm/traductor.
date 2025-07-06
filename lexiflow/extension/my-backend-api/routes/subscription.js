const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create checkout session
router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    const { priceId, billingPeriod } = req.body;

    // Validate price ID
    const validPriceIds = [
      process.env.STRIPE_MONTHLY_PRICE_ID,
      process.env.STRIPE_YEARLY_PRICE_ID
    ];

    if (!validPriceIds.includes(priceId)) {
      return res.status(400).json({ error: 'Invalid price ID' });
    }

    // Create or get Stripe customer
    let customerId = req.user.customerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: {
          userId: req.user.id
        }
      });
      
      customerId = customer.id;
      
      // Save customer ID to user
      await User.update(
        { customerId },
        { where: { id: req.user.id } }
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/subscription/cancel`,
      metadata: {
        userId: req.user.id
      }
    });

    res.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ error: 'Error creating checkout session' });
  }
});

// Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        
        // Update user
        await User.update({
          isPremium: true,
          subscriptionId: subscription.id,
          subscriptionStatus: subscription.status
        }, {
          where: { id: session.metadata.userId }
        });
        
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object;
        
        await User.update({
          subscriptionStatus: updatedSubscription.status,
          isPremium: updatedSubscription.status === 'active'
        }, {
          where: { subscriptionId: updatedSubscription.id }
        });
        
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        
        await User.update({
          isPremium: false,
          subscriptionStatus: 'canceled',
          subscriptionId: null
        }, {
          where: { subscriptionId: deletedSubscription.id }
        });
        
        break;

      case 'invoice.payment_failed':
        const invoice = event.data.object;
        
        // Handle failed payment
        if (invoice.subscription) {
          await User.update({
            subscriptionStatus: 'past_due'
          }, {
            where: { subscriptionId: invoice.subscription }
          });
        }
        
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Get subscription status
router.get('/status', auth, async (req, res) => {
  try {
    let subscriptionDetails = null;

    if (req.user.subscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(req.user.subscriptionId);
        
        subscriptionDetails = {
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          planName: subscription.items.data[0].price.nickname || 'Premium',
          interval: subscription.items.data[0].price.recurring.interval
        };

        // Update status in database if changed
        if (subscription.status !== req.user.subscriptionStatus) {
          await User.update({
            subscriptionStatus: subscription.status,
            isPremium: subscription.status === 'active'
          }, {
            where: { id: req.user.id }
          });
        }
      } catch (error) {
        console.error('Error fetching subscription from Stripe:', error);
        // If subscription not found in Stripe, update user
        await User.update({
          isPremium: false,
          subscriptionStatus: 'inactive',
          subscriptionId: null
        }, {
          where: { id: req.user.id }
        });
      }
    }

    res.json({
      isPremium: req.user.isPremium,
      subscription: subscriptionDetails
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ error: 'Error fetching subscription status' });
  }
});

// Cancel subscription
router.post('/cancel', auth, async (req, res) => {
  try {
    if (!req.user.subscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Cancel at period end
    const subscription = await stripe.subscriptions.update(
      req.user.subscriptionId,
      { cancel_at_period_end: true }
    );

    res.json({
      message: 'Subscription will be canceled at the end of the billing period',
      cancelAt: new Date(subscription.cancel_at * 1000)
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Error canceling subscription' });
  }
});

// Resume subscription (remove cancellation)
router.post('/resume', auth, async (req, res) => {
  try {
    if (!req.user.subscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    const subscription = await stripe.subscriptions.update(
      req.user.subscriptionId,
      { cancel_at_period_end: false }
    );

    res.json({
      message: 'Subscription resumed successfully',
      subscription: {
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });
  } catch (error) {
    console.error('Resume subscription error:', error);
    res.status(500).json({ error: 'Error resuming subscription' });
  }
});

// Get available plans
router.get('/plans', async (req, res) => {
  try {
    const plans = [
      {
        id: process.env.STRIPE_MONTHLY_PRICE_ID,
        name: 'Monthly Premium',
        price: 9.99,
        currency: 'usd',
        interval: 'month',
        features: [
          'Unlimited flashcards',
          'Advanced statistics',
          'Priority support',
          'Export data',
          'Custom categories',
          'Bulk operations'
        ]
      },
      {
        id: process.env.STRIPE_YEARLY_PRICE_ID,
        name: 'Yearly Premium',
        price: 99.99,
        currency: 'usd',
        interval: 'year',
        features: [
          'All monthly features',
          'Save 2 months',
          'Early access to new features'
        ]
      }
    ];

    res.json(plans);
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Error fetching plans' });
  }
});

module.exports = router;