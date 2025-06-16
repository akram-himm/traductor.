const { execSync } = require('child_process');
const { Sequelize } = require('sequelize');
const chalk = require('chalk');
const User = require('../src/models/User');

(async () => {
  try {
    console.log(chalk.blue('🔍 Checking PostgreSQL status...'));
    execSync('pg_isready');
    console.log(chalk.green('✅ PostgreSQL is running.'));
  } catch (error) {
    console.error(chalk.red('❌ PostgreSQL is not running. Please start the service.'));
    process.exit(1);
  }

  try {
    console.log(chalk.blue('🔧 Connecting to the database...'));
    const sequelize = new Sequelize(process.env.DATABASE_URL, {
      logging: false,
    });

    await sequelize.authenticate();
    console.log(chalk.green('✅ Database connection successful.'));

    console.log(chalk.blue('📦 Running migrations...'));
    execSync('npx sequelize-cli db:migrate');
    console.log(chalk.green('✅ Migrations completed.'));

    console.log(chalk.blue('👤 Creating test users...'));
    await User.findOrCreate({
      where: { email: 'free.user@test.com' },
      defaults: {
        password: 'password123',
        isPremium: false,
      },
    });

    await User.findOrCreate({
      where: { email: 'premium.user@test.com' },
      defaults: {
        password: 'password123',
        isPremium: true,
      },
    });

    console.log(chalk.green('✅ Test users created.'));
    console.log(chalk.green('🎉 Setup completed successfully.'));
    process.exit(0);
  } catch (error) {
    console.error(chalk.red('❌ An error occurred during setup:'), error.message);
    process.exit(1);
  }
})();
