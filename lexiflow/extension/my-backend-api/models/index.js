const sequelize = require('../config/database');
const User = require('./User');
const Flashcard = require('./Flashcard');

// Define associations
User.hasMany(Flashcard, {
  foreignKey: 'userId',
  as: 'flashcards',
  onDelete: 'CASCADE'
});

Flashcard.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

module.exports = {
  sequelize,
  User,
  Flashcard
};