const axios = require('axios');
const chalk = require('chalk');

(async () => {
  console.log(chalk.blue('🧪 TESTING LEXIFLOW BACKEND'));
  console.log('========================');

  try {
    // Clear test data
    console.log(chalk.blue('🔄 Clearing test data...'));
    await axios.post('http://localhost:3000/api/test/clear');
    console.log(chalk.green('✅ Test data cleared.'));

    // Test Authentication Flow
    console.log(chalk.blue('🔑 Testing Authentication Flow...'));
    const registerResponse = await axios.post('http://localhost:3000/api/auth/register', {
      email: 'test@lexiflow.test',
      password: 'password123',
    });
    console.log(chalk.green('✅ User registration successful.'));

    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'test@lexiflow.test',
      password: 'password123',
    });
    console.log(chalk.green('✅ User login successful.'));

    const token = loginResponse.data.token;

    // Test Free User Limits
    console.log(chalk.blue('📋 Testing Free User Limits...'));
    for (let i = 1; i <= 50; i++) {
      await axios.post(
        'http://localhost:3000/api/flashcards',
        { question: `Question ${i}`, answer: `Answer ${i}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    console.log(chalk.green('✅ Created 50 flashcards.'));

    try {
      await axios.post(
        'http://localhost:3000/api/flashcards',
        { question: 'Question 51', answer: 'Answer 51' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(chalk.red('❌ Free user flashcard limit not enforced.'));
    } catch (error) {
      console.log(chalk.green('✅ Free user flashcard limit enforced.'));
    }

    // Test Stripe Integration
    console.log(chalk.blue('💳 Testing Stripe Integration...'));
    const checkoutResponse = await axios.post(
      'http://localhost:3000/api/subscription/create-checkout-session',
      { priceType: 'monthly' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(chalk.green('✅ Checkout session created.'));    

    console.log(chalk.blue('🎉 All tests completed.'));
  } catch (error) {
    console.error(chalk.red('❌ An error occurred during testing:'), error.message);
  }
})();
