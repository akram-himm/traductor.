require('dotenv').config();
const chalk = require('chalk');
const { Sequelize } = require('sequelize');
const Stripe = require('stripe');
const nodemailer = require('nodemailer');

console.log('Current working directory:', process.cwd());

(async () => {
  console.log(chalk.blue('🔍 ENVIRONMENT VALIDATION'));
  console.log('=======================');

  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'EMAIL_HOST',
    'EMAIL_PORT',
    'EMAIL_USER',
    'EMAIL_PASS' // Updated from EMAIL_PASSWORD
  ];

  let allValid = true;

  // Check required environment variables
  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      console.log(chalk.red(`❌ Missing environment variable: ${varName}`));
      allValid = false;
    } else {
      console.log(chalk.green(`✅ ${varName} is set.`));
    }
  });

  if (!allValid) {
    console.log(chalk.red('❌ Missing required environment variables. Exiting.'));
    process.exit(1);
  }

  // Validate database connection
  try {
    console.log(chalk.blue('🔧 Testing database connection...'));
    const sequelize = new Sequelize(process.env.DATABASE_URL, { logging: false });
    await sequelize.authenticate();
    console.log(chalk.green('✅ Database connection successful.'));
  } catch (error) {
    console.log(chalk.red('❌ Database connection failed:'), error.message);
    allValid = false;
  }

  // Validate Stripe API
  try {
    console.log(chalk.blue('🔧 Testing Stripe API...'));
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    await stripe.products.list();
    console.log(chalk.green('✅ Stripe API connection successful.'));
  } catch (error) {
    console.log(chalk.red('❌ Stripe API connection failed:'), error.message);
    allValid = false;
  }

  // Validate email server
  try {
    console.log(chalk.blue('🔧 Testing email server...'));
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Updated from EMAIL_PASSWORD
      }
    });
    await transporter.verify();
    console.log(chalk.green('✅ Email server configuration valid.'));
  } catch (error) {
    console.log(chalk.red('❌ Email server configuration failed:'), error.message);
    allValid = false;
  }

  if (allValid) {
    console.log(chalk.green('🎉 All environment variables and services are properly configured.'));
  } else {
    console.log(chalk.red('❌ Some validations failed. Please fix the issues above.'));
    process.exit(1);
  }
})();
