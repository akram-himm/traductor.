const { sequelize, DataTypes } = require('../config/database');

const Flashcard = sequelize.define('Flashcard', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  front: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  back: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  language: {
    type: DataTypes.STRING(5),
    allowNull: false
  },
  sourceLanguage: {
    type: DataTypes.STRING(5),
    allowNull: true,
    defaultValue: 'auto'
  },
  folder: {
    type: DataTypes.STRING,
    defaultValue: 'default'
  },
  reviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastReview: {
    type: DataTypes.DATE,
    allowNull: true
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'normal', 'hard'),
    defaultValue: 'normal'
  },
  syncId: {
    type: DataTypes.UUID,
    unique: true,
    allowNull: true
  },
  lastSynced: {
    type: DataTypes.DATE,
    allowNull: true
  },
  syncVersion: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  }
});

module.exports = Flashcard;
