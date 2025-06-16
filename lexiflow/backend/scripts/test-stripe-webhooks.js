import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import chalk from 'chalk';
import crypto from 'crypto';
import fetch from 'node-fetch';

console.log('Webhook secret:', process.env.STRIPE_WEBHOOK_SECRET);

const generateSignature = (payload, secret) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${JSON.stringify(payload)}`)
    .digest('hex');

  return `t=${timestamp},v1=${signature}`;
};

(async () => {
  console.log(chalk.blue('🧪 Testing Stripe Webhooks...'));

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const events = [
    {
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_123', customer: 'cus_test123' } }
    },
    {
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_test123', status: 'active' } }
    },
    {
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_test123' } }
    },
    {
      type: 'invoice.payment_failed',
      data: { object: { id: 'in_test123' } }
    }
  ];

  const webhookUrl = 'http://localhost:3001/api/subscription/webhook';

  // Health check
  try {
    const response = await fetch('http://localhost:3001/api/health');
    console.log('Server status:', response.status);
  } catch (error) {
    console.log('❌ Server is not running! Please start it first.');
    process.exit(1);
  }

  // Update the endpoint path and ensure the secret is used correctly
  for (const event of events) {
    try {
      const signature = generateSignature(event, process.env.STRIPE_WEBHOOK_SECRET);
      const response = await axios.post(
        webhookUrl,
        event,
        {
          headers: {
            'Stripe-Signature': signature,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(chalk.green(`✅ Webhook ${event.type} processed successfully.`));
    } catch (error) {
      console.log(chalk.red(`❌ Webhook ${event.type} failed:`));
      console.error(error.stack); // Log full error stack for debugging
    }
  }
})();
