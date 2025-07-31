const fetch = require('node-fetch');

const RENDER_URL = 'https://my-backend-api-cng7.onrender.com';

async function testSubscriptionFlow(email, password) {
  console.log('🔍 Testing subscription creation flow on Render...\n');
  
  try {
    // 1. Try to login first
    console.log('1. Attempting to login with existing user...');
    const loginResponse = await fetch(`${RENDER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const loginText = await loginResponse.text();
    console.log(`   Status: ${loginResponse.status}`);
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginText);
      
      // If login fails due to unverified email, we need a different approach
      if (loginText.includes('verify your email')) {
        console.log('\n⚠️  User exists but email is not verified.');
        console.log('   In production, you would need to verify the email first.');
        return;
      }
      
      console.log('\n   Trying with a known verified test account...');
      // Try with a test account that might already be verified
      const testEmails = [
        'test1753640614413@example.com',
        'akramhimmich00@gmail.com',
        'test@example.com'
      ];
      
      for (const testEmail of testEmails) {
        console.log(`\n   Trying ${testEmail}...`);
        const testLoginResponse = await fetch(`${RENDER_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: testEmail, password: password })
        });
        
        if (testLoginResponse.ok) {
          const data = await testLoginResponse.json();
          console.log(`✅ Successfully logged in with ${testEmail}`);
          return await testWithUser(data.token, data.user);
        }
      }
      
      console.log('\n❌ Could not login with any test account.');
      return;
    }
    
    const loginData = JSON.parse(loginText);
    console.log('✅ Login successful!');
    console.log(`   User: ${loginData.user.email}`);
    console.log(`   Premium: ${loginData.user.isPremium}`);
    console.log(`   Subscription Plan: ${loginData.user.subscriptionPlan || 'None'}`);
    
    await testWithUser(loginData.token, loginData.user);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testWithUser(token, user) {
  console.log('\n2. Checking subscription status...');
  const statusResponse = await fetch(`${RENDER_URL}/api/subscription/status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (statusResponse.ok) {
    const statusData = await statusResponse.json();
    console.log('📊 Current subscription status:');
    console.log(JSON.stringify(statusData, null, 2));
  }
  
  console.log('\n3. Testing /api/subscription/create-missing endpoint...');
  const createMissingResponse = await fetch(`${RENDER_URL}/api/subscription/create-missing`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log(`\n📋 Response:`);
  console.log(`   Status: ${createMissingResponse.status} ${createMissingResponse.statusText}`);
  
  const responseText = await createMissingResponse.text();
  try {
    const data = JSON.parse(responseText);
    console.log(`   Data:`, JSON.stringify(data, null, 2));
    
    if (createMissingResponse.ok) {
      console.log('\n✅ Subscription record created/found successfully!');
    } else {
      console.log('\n❌ Failed to create subscription record');
      
      // Get more diagnostic info
      console.log('\n4. Getting diagnostic information...');
      const diagnosticResponse = await fetch(`${RENDER_URL}/api/diagnostic/subscription`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (diagnosticResponse.ok) {
        const diagnosticData = await diagnosticResponse.json();
        console.log('\n🔍 Diagnostic data:');
        console.log(JSON.stringify(diagnosticData, null, 2));
        
        if (diagnosticData.issues && diagnosticData.issues.length > 0) {
          console.log('\n⚠️  Issues found:');
          diagnosticData.issues.forEach(issue => console.log(`   - ${issue}`));
        }
      }
    }
  } catch (e) {
    console.log(`   Raw response: ${responseText}`);
    
    // Check for common error patterns
    if (responseText.includes('Database') || responseText.includes('Sequelize')) {
      console.log('\n⚠️  DATABASE ERROR DETECTED');
      console.log('   The backend is having database connectivity issues.');
    } else if (responseText.includes('<!DOCTYPE')) {
      console.log('\n⚠️  HTML ERROR PAGE RETURNED');
      console.log('   The server returned an error page instead of JSON.');
    }
  }
  
  console.log('\n5. Checking if this is a Stripe configuration issue...');
  const debugResponse = await fetch(`${RENDER_URL}/api/subscription/debug`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (debugResponse.ok) {
    const debugData = await debugResponse.json();
    console.log('\n🔧 Debug information:');
    console.log('   Stripe Customer ID:', debugData.user.stripeCustomerId || 'Not set');
    console.log('   Database subscriptions:', debugData.database.count);
    console.log('   Stripe subscriptions:', debugData.stripe.count);
    console.log('   Price IDs configured:', JSON.stringify(debugData.prices));
    
    if (!debugData.user.stripeCustomerId) {
      console.log('\n⚠️  User has no Stripe customer ID');
      console.log('   This means they have never attempted to purchase a subscription.');
    }
  }
}

// Main execution
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node test-subscription-flow.js <email> <password>');
  console.log('\nExample: node test-subscription-flow.js test@example.com password123');
  process.exit(1);
}

testSubscriptionFlow(email, password);