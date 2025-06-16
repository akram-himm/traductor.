const axios = require('axios');
const chalk = require('chalk');
const os = require('os');

(async () => {
  console.log(chalk.blue('📊 LEXIFLOW BACKEND STATUS'));
  console.log('========================');

  try {
    const usersResponse = await axios.get('http://localhost:3000/api/users/stats');
    const flashcardsResponse = await axios.get('http://localhost:3000/api/flashcards/stats');

    console.log(chalk.green(`Users:`));
    console.log(`- Total: ${usersResponse.data.total}`);
    console.log(`- Free: ${usersResponse.data.free}`);
    console.log(`- Premium: ${usersResponse.data.premium}`);

    console.log(chalk.green(`Flashcards:`));
    console.log(`- Total: ${flashcardsResponse.data.total}`);
    console.log(`- Avg per user: ${flashcardsResponse.data.avg}`);

    console.log(chalk.green(`System:`));
    console.log(`- Uptime: ${os.uptime()} seconds`);
    console.log(`- Memory Usage: ${JSON.stringify(process.memoryUsage())}`);
  } catch (error) {
    console.error(chalk.red('❌ Error fetching dashboard data:'), error.message);
  }
})();
