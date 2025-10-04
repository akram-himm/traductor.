const fetch = require('node-fetch');

const RENDER_URL = 'https://my-backend-api-cng7.onrender.com';

async function testRenderLogs() {
  console.log('🔍 Testing Render API endpoints to understand the issue...\n');
  
  // Test endpoints that might give us more information
  const endpoints = [
    { method: 'GET', path: '/api/health', description: 'Health check' },
    { method: 'GET', path: '/ping', description: 'Ping endpoint' },
    { method: 'GET', path: '/api/subscription/webhook-test', description: 'Webhook test endpoint' }
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n📍 Testing ${endpoint.description}: ${endpoint.path}`);
    try {
      const response = await fetch(`${RENDER_URL}${endpoint.path}`, {
        method: endpoint.method
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log(`   Response: ${text}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Now let's try to create a test user and see what happens
  console.log('\n\n🧪 Creating a test user to check database connectivity...');
  const testEmail = `test-${Date.now()}@example.com`;
  
  try {
    const registerResponse = await fetch(`${RENDER_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: testEmail,
        password: 'TestPassword123!'
      })
    });
    
    console.log(`\n📝 Registration attempt:`);
    console.log(`   Status: ${registerResponse.status} ${registerResponse.statusText}`);
    console.log(`   Headers:`, Object.fromEntries(registerResponse.headers));
    
    const responseText = await registerResponse.text();
    console.log(`   Response body: ${responseText}`);
    
    if (registerResponse.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('\n✅ User created successfully!');
        console.log('   User ID:', data.user?.id);
        console.log('   Email:', data.user?.email);
        console.log('   Has token:', !!data.token);
        
        // Try to test the create-missing endpoint with this user
        if (data.token) {
          console.log('\n\n🔍 Testing create-missing endpoint with new user...');
          const createMissingResponse = await fetch(`${RENDER_URL}/api/subscription/create-missing`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.token}`
            }
          });
          
          console.log(`\n📋 Create-missing response:`);
          console.log(`   Status: ${createMissingResponse.status} ${createMissingResponse.statusText}`);
          const createMissingText = await createMissingResponse.text();
          console.log(`   Body: ${createMissingText}`);
        }
      } catch (parseError) {
        console.log('   Could not parse response as JSON');
      }
    } else {
      console.log('\n❌ Registration failed');
      
      // Check if it's a database error
      if (responseText.includes('SequelizeConnectionRefusedError') || 
          responseText.includes('ECONNREFUSED') ||
          responseText.includes('Database connection error')) {
        console.log('\n⚠️  DATABASE CONNECTION ISSUE DETECTED!');
        console.log('   The backend cannot connect to the database.');
        console.log('   This suggests the DATABASE_URL environment variable might be incorrect on Render.');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Request error:', error.message);
  }
  
  console.log('\n\n📊 Summary:');
  console.log('===========');
  console.log('The issue appears to be related to database connectivity on the Render deployment.');
  console.log('The backend API is running, but it cannot connect to the database.');
  console.log('\nPossible causes:');
  console.log('1. DATABASE_URL environment variable is not set correctly on Render');
  console.log('2. Database server is not accessible from Render');
  console.log('3. Database credentials are incorrect');
  console.log('4. SSL/TLS configuration issues with the database connection');
  console.log('\nRecommended actions:');
  console.log('1. Check Render dashboard for environment variables');
  console.log('2. Verify DATABASE_URL is set correctly');
  console.log('3. Check if the database (likely Neon/PostgreSQL) is accessible');
  console.log('4. Review Render logs in the dashboard for more detailed error messages');
}

testRenderLogs();