const { Sequelize } = require('sequelize');
const User = require('../src/models/User');
const Flashcard = require('../src/models/Flashcard');
const Subscription = require('../src/models/Subscription');
const chalk = require('chalk');

(async () => {
  console.log(chalk.blue('🌱 Seeding test data...'));

  try {
    const sequelize = new Sequelize(process.env.DATABASE_URL, { logging: false });

    // Free user
    const freeUser = await User.create({
      email: 'free.user@test.com',
      password: 'password123',
      isPremium: false
    });

    // Almost limit user
    const almostLimitUser = await User.create({
      email: 'almost.limit@test.com',
      password: 'password123',
      isPremium: false
    });
    for (let i = 1; i <= 49; i++) {
      await Flashcard.create({
        userId: almostLimitUser.id,
        question: `Question ${i}`,
        answer: `Answer ${i}`
      });
    }

    // Premium user
    const premiumUser = await User.create({
      email: 'premium.user@test.com',
      password: 'password123',
      isPremium: true
    });
    for (let i = 1; i <= 150; i++) {
      await Flashcard.create({
        userId: premiumUser.id,
        question: `Premium Question ${i}`,
        answer: `Premium Answer ${i}`
      });
    }

    await Subscription.create({
      userId: premiumUser.id,
      stripeCustomerId: 'cus_test123',
      stripeSubscriptionId: 'sub_test123',
      stripePriceId: process.env.STRIPE_PRICE_ID_MONTHLY,
      status: 'active'
    });

    console.log(chalk.green('✅ Test data seeded successfully.'));
  } catch (error) {
    console.error(chalk.red('❌ Error seeding test data:'), error.message);
  }
})();
