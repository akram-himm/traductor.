const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

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
  fromLang: {
    type: DataTypes.STRING(5),
    allowNull: false
  },
  toLang: {
    type: DataTypes.STRING(5),
    allowNull: false
  },
  folder: {
    type: DataTypes.STRING,
    defaultValue: 'default'
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'normal', 'hard'),
    defaultValue: 'normal'
  },
  reviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastReview: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nextReview: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sourceUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  context: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Pour la synchronisation
  syncId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  lastSynced: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  syncVersion: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['folder']
    },
    {
      fields: ['syncId']
    }
  ]
});

// Méthodes d'instance
Flashcard.prototype.calculateNextReview = function() {
  const intervals = {
    easy: 7,    // 7 jours
    normal: 3,  // 3 jours
    hard: 1     // 1 jour
  };
  
  const days = intervals[this.difficulty] || 3;
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + days);
  
  this.nextReview = nextDate;
  return nextDate;
};

module.exports = Flashcard;