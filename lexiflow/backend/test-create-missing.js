const fetch = require('node-fetch');

const RENDER_URL = 'https://my-backend-api-cng7.onrender.com';

async function testCreateMissing() {
  console.log('🔍 Testing /api/subscription/create-missing endpoint...\n');
  
  try {
    // First, try to login with a test user
    console.log('1. Attempting login...');
    const loginResponse = await fetch(`${RENDER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'akramhimmich00@gmail.com',
        password: 'YourPasswordHere' // You'll need to replace this
      })
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log('❌ Login failed:', loginResponse.status);
      console.log('Response:', errorText);
      console.log('\nPlease update the script with valid credentials');
      return;
    }
    
    const { token, user } = await loginResponse.json();
    console.log('✅ Logged in successfully as:', user.email);
    console.log('   User ID:', user.id);
    console.log('   Stripe Customer ID:', user.stripeCustomerId);
    console.log('   Is Premium:', user.isPremium);
    console.log('   Subscription Plan:', user.subscriptionPlan);
    
    // Check subscription status first
    console.log('\n2. Checking current subscription status...');
    const statusResponse = await fetch(`${RENDER_URL}/api/subscription/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('📊 Current subscription status:', JSON.stringify(statusData, null, 2));
    }
    
    // Test the create-missing endpoint
    console.log('\n3. Testing create-missing endpoint...');
    const createMissingResponse = await fetch(`${RENDER_URL}/api/subscription/create-missing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const responseText = await createMissingResponse.text();
    console.log('\n📋 Create-missing response:');
    console.log('   Status:', createMissingResponse.status);
    console.log('   Headers:', Object.fromEntries(createMissingResponse.headers));
    console.log('   Body:', responseText);
    
    if (createMissingResponse.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('\n✅ Response data:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('Could not parse response as JSON');
      }
    } else {
      console.log('\n❌ Request failed');
      
      // Try to get more debug info
      console.log('\n4. Getting debug info...');
      const debugResponse = await fetch(`${RENDER_URL}/api/subscription/debug/${user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (debugResponse.ok) {
        const debugData = await debugResponse.json();
        console.log('\n🔍 Debug info:', JSON.stringify(debugData, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Check if we have credentials as command line arguments
if (process.argv.length >= 4) {
  const email = process.argv[2];
  const password = process.argv[3];
  
  // Override the hardcoded credentials
  const originalFetch = global.fetch;
  global.fetch = function(url, options) {
    if (url.includes('/api/auth/login') && options.body) {
      options.body = JSON.stringify({ email, password });
    }
    return originalFetch.apply(this, arguments);
  };
}

testCreateMissing();