const express = require('express');
const router = express.Router();

// Privacy Policy
router.get('/privacy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>LexiFlow - Privacy Policy</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
        h1 { color: #667eea; }
        h2 { color: #764ba2; margin-top: 30px; }
      </style>
    </head>
    <body>
      <h1>Privacy Policy - LexiFlow</h1>
      <p>Last updated: ${new Date().toLocaleDateString()}</p>
      
      <h2>1. Information We Collect</h2>
      <p>LexiFlow collects the following information:</p>
      <ul>
        <li>Email address (for authentication)</li>
        <li>Name (optional, for personalization)</li>
        <li>Translation history and flashcards (for learning purposes)</li>
        <li>Usage statistics (to improve the service)</li>
      </ul>
      
      <h2>2. How We Use Your Information</h2>
      <p>We use your information to:</p>
      <ul>
        <li>Provide and maintain our service</li>
        <li>Synchronize your flashcards across devices</li>
        <li>Send important updates about your account</li>
        <li>Improve our translation and learning algorithms</li>
      </ul>
      
      <h2>3. Data Security</h2>
      <p>We implement industry-standard security measures to protect your data. All data is encrypted in transit and at rest.</p>
      
      <h2>4. Third-Party Services</h2>
      <p>We use the following third-party services:</p>
      <ul>
        <li>Stripe for payment processing</li>
        <li>OAuth providers (Google, Facebook, Apple) for authentication</li>
      </ul>
      
      <h2>5. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access your personal data</li>
        <li>Correct inaccurate data</li>
        <li>Request deletion of your data</li>
        <li>Export your data</li>
      </ul>
      
      <h2>6. Contact Us</h2>
      <p>For privacy concerns, contact us at: privacy@lexiflow.app</p>
    </body>
    </html>
  `);
});

// Terms of Service
router.get('/terms', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>LexiFlow - Terms of Service</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
        h1 { color: #667eea; }
        h2 { color: #764ba2; margin-top: 30px; }
      </style>
    </head>
    <body>
      <h1>Terms of Service - LexiFlow</h1>
      <p>Last updated: ${new Date().toLocaleDateString()}</p>
      
      <h2>1. Acceptance of Terms</h2>
      <p>By using LexiFlow, you agree to these Terms of Service.</p>
      
      <h2>2. Description of Service</h2>
      <p>LexiFlow is a Chrome extension that provides:</p>
      <ul>
        <li>Instant translation of selected text</li>
        <li>Flashcard creation and management</li>
        <li>Language learning tools</li>
      </ul>
      
      <h2>3. User Accounts</h2>
      <ul>
        <li>You must provide accurate information</li>
        <li>You are responsible for maintaining account security</li>
        <li>One person per account</li>
      </ul>
      
      <h2>4. Subscription Plans</h2>
      <ul>
        <li>Free Plan: Up to 50 flashcards</li>
        <li>Premium Plan: Up to 200 flashcards + advanced features</li>
        <li>Payments processed securely via Stripe</li>
      </ul>
      
      <h2>5. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the service for illegal purposes</li>
        <li>Attempt to hack or disrupt the service</li>
        <li>Share your account with others</li>
      </ul>
      
      <h2>6. Intellectual Property</h2>
      <p>User-generated content (flashcards, translations) remains your property. LexiFlow retains rights to the service and its features.</p>
      
      <h2>7. Limitation of Liability</h2>
      <p>LexiFlow is provided "as is" without warranties. We are not liable for translation accuracy or data loss.</p>
      
      <h2>8. Changes to Terms</h2>
      <p>We may update these terms. Continued use constitutes acceptance of new terms.</p>
      
      <h2>9. Contact</h2>
      <p>For questions about these terms: support@lexiflow.app</p>
    </body>
    </html>
  `);
});

// Data Deletion
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
          <li>Select "Account Settings"</li>
          <li>Click "Delete Account and Data"</li>
          <li>Confirm the deletion</li>
        </ol>
      </div>
      
      <div class="deletion-box">
        <h3>Method 2: Email Request</h3>
        <p>Send an email to: <strong>privacy@lexiflow.app</strong></p>
        <p>Include:</p>
        <ul>
          <li>Your registered email address</li>
          <li>Subject: "Data Deletion Request"</li>
        </ul>
      </div>
      
      <h2>What Gets Deleted</h2>
      <ul>
        <li>Your account information (email, name)</li>
        <li>All your flashcards</li>
        <li>Translation history</li>
        <li>Usage statistics</li>
        <li>Subscription information</li>
      </ul>
      
      <h2>Processing Time</h2>
      <p>Your data will be deleted within:</p>
      <ul>
        <li><strong>Immediate:</strong> If using Method 1 (extension)</li>
        <li><strong>72 hours:</strong> If using Method 2 (email)</li>
      </ul>
      
      <p class="warning">⚠️ Warning: Data deletion is permanent and cannot be undone.</p>
      
      <h2>Data Retention</h2>
      <p>After deletion, we may retain:</p>
      <ul>
        <li>Anonymized usage statistics</li>
        <li>Transaction records (legal requirement)</li>
      </ul>
      
      <h2>Questions?</h2>
      <p>Contact us at: privacy@lexiflow.app</p>
    </body>
    </html>
  `);
});

module.exports = router;