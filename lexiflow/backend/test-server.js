const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running!' });
});

app.post('/api/payment/webhook', (req, res) => {
  console.log('Webhook received!');
  res.json({ received: true });
});

app.post('/api/subscription/webhook', (req, res) => {
  console.log('Subscription webhook received!');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  res.json({ received: true });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log('Try: curl http://localhost:3001/health');
});
