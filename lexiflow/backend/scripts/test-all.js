const { execSync } = require('child_process');
const chalk = require('chalk');

process.chdir(__dirname + '/..');

(async () => {
  try {
    console.log(chalk.blue('🔍 Validating environment...'));
    execSync('node scripts/validate-env.js', { stdio: 'inherit' });

    console.log(chalk.blue('🔧 Setting up database...'));
    execSync('node scripts/setup.js', { stdio: 'inherit' });

    console.log(chalk.blue('🌱 Seeding test data...'));
    execSync('node scripts/seed-test-data.js', { stdio: 'inherit' });

    console.log(chalk.blue('🧪 Running API tests...'));
    execSync('node scripts/test-api.js', { stdio: 'inherit' });

    console.log(chalk.blue('💳 Testing Stripe webhooks...'));
    execSync('node scripts/test-stripe-webhooks.js', { stdio: 'inherit' });

    console.log(chalk.blue('📊 Generating dashboard summary...'));
    execSync('node ./dashboard.js', { stdio: 'inherit' });

    console.log(chalk.green('🎉 All tests completed successfully.'));
  } catch (error) {
    console.error(chalk.red('❌ An error occurred during testing:'), error.message);
    process.exit(1);
  }
})();
