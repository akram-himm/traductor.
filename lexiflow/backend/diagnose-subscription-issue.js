const fetch = require('node-fetch');

const RENDER_URL = 'https://my-backend-api-cng7.onrender.com';

// Color output for better readability
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

async function diagnoseSubscriptionIssue(email, password) {
  log('\n🔍 Diagnosing Subscription Creation Issue', 'cyan');
  log('=====================================', 'cyan');
  
  try {
    // 1. Check server health
    log('\n1. Checking server health...', 'yellow');
    const healthResponse = await fetch(`${RENDER_URL}/api/health`);
    const healthData = await healthResponse.json();
    log(`✅ Server is ${healthData.status}`, 'green');
    
    // 2. Login
    log('\n2. Attempting login...', 'yellow');
    const loginResponse = await fetch(`${RENDER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!loginResponse.ok) {
      const error = await loginResponse.text();
      log(`❌ Login failed: ${error}`, 'red');
      return;
    }
    
    const { token, user } = await loginResponse.json();
    log(`✅ Logged in as: ${user.email}`, 'green');
    log(`   User ID: ${user.id}`);
    log(`   Stripe Customer ID: ${user.stripeCustomerId || 'None'}`);
    log(`   Is Premium: ${user.isPremium}`);
    log(`   Subscription Plan: ${user.subscriptionPlan || 'None'}`);
    
    // 3. Check current subscription status
    log('\n3. Checking subscription status...', 'yellow');
    const statusResponse = await fetch(`${RENDER_URL}/api/subscription/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      log('📊 Current subscription status:', 'blue');
      console.log(JSON.stringify(statusData, null, 2));
    } else {
      log('❌ Failed to get subscription status', 'red');
    }
    
    // 4. Run diagnostic endpoint
    log('\n4. Running subscription diagnostic...', 'yellow');
    const diagnosticResponse = await fetch(`${RENDER_URL}/api/diagnostic/subscription`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (diagnosticResponse.ok) {
      const diagnosticData = await diagnosticResponse.json();
      log('🔍 Diagnostic Results:', 'blue');
      
      if (diagnosticData.issues && diagnosticData.issues.length > 0) {
        log('\n⚠️  Issues found:', 'red');
        diagnosticData.issues.forEach(issue => {
          log(`   - ${issue}`, 'red');
        });
      } else {
        log('✅ No issues found in diagnostic', 'green');
      }
      
      log('\n📋 Full diagnostic data:', 'cyan');
      console.log(JSON.stringify(diagnosticData, null, 2));
    }
    
    // 5. Test create-missing endpoint
    log('\n5. Testing /api/subscription/create-missing endpoint...', 'yellow');
    
    const createMissingResponse = await fetch(`${RENDER_URL}/api/subscription/create-missing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const createMissingText = await createMissingResponse.text();
    log(`\n📋 Create-missing response:`, 'blue');
    log(`   Status: ${createMissingResponse.status}`);
    log(`   Status Text: ${createMissingResponse.statusText}`);
    log(`   Headers:`, 'cyan');
    for (const [key, value] of createMissingResponse.headers) {
      console.log(`     ${key}: ${value}`);
    }
    log(`\n   Body:`, 'cyan');
    
    try {
      const data = JSON.parse(createMissingText);
      console.log(JSON.stringify(data, null, 2));
      
      if (createMissingResponse.ok) {
        log('\n✅ Subscription record created successfully!', 'green');
      } else {
        log('\n❌ Failed to create subscription record', 'red');
        if (data.error) log(`   Error: ${data.error}`, 'red');
        if (data.details) log(`   Details: ${data.details}`, 'red');
      }
    } catch (e) {
      log('   Raw response: ' + createMissingText, 'red');
    }
    
    // 6. Check Stripe directly (if we have customer ID)
    if (user.stripeCustomerId) {
      log('\n6. Checking Stripe subscriptions via sync endpoint...', 'yellow');
      const syncResponse = await fetch(`${RENDER_URL}/api/subscription/sync-stripe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (syncResponse.ok) {
        const syncData = await syncResponse.json();
        log('🔄 Stripe sync results:', 'blue');
        console.log(JSON.stringify(syncData, null, 2));
      } else {
        const errorText = await syncResponse.text();
        log('❌ Stripe sync failed: ' + errorText, 'red');
      }
    }
    
    // 7. Final check - get updated status
    log('\n7. Final status check...', 'yellow');
    const finalStatusResponse = await fetch(`${RENDER_URL}/api/subscription/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (finalStatusResponse.ok) {
      const finalStatus = await finalStatusResponse.json();
      log('📊 Final subscription status:', 'green');
      console.log(JSON.stringify(finalStatus, null, 2));
    }
    
  } catch (error) {
    log('\n❌ Unexpected error:', 'red');
    log(error.message, 'red');
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Get credentials from command line or environment
const email = process.argv[2] || process.env.TEST_EMAIL;
const password = process.argv[3] || process.env.TEST_PASSWORD;

if (!email || !password) {
  log('Usage: node diagnose-subscription-issue.js <email> <password>', 'yellow');
  log('Or set TEST_EMAIL and TEST_PASSWORD environment variables', 'yellow');
  process.exit(1);
}

// Run the diagnosis
diagnoseSubscriptionIssue(email, password);