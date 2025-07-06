const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
  category: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'General'
  },
  difficulty: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  lastReviewed: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nextReview: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  reviewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  successRate: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 1
    }
  }
});

// Instance method to calculate next review date based on spaced repetition
Flashcard.prototype.calculateNextReview = function(performance) {
  const now = new Date();
  let daysToAdd = 1;
  
  // Simple spaced repetition algorithm
  if (performance === 'easy') {
    daysToAdd = Math.max(1, this.reviewCount * 2.5);
    this.difficulty = Math.max(0, this.difficulty - 1);
  } else if (performance === 'medium') {
    daysToAdd = Math.max(1, this.reviewCount * 1.5);
  } else if (performance === 'hard') {
    daysToAdd = 1;
    this.difficulty = Math.min(5, this.difficulty + 1);
  }
  
  this.lastReviewed = now;
  this.nextReview = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  this.reviewCount += 1;
  
  // Update success rate
  const currentSuccess = performance === 'easy' ? 1 : performance === 'medium' ? 0.5 : 0;
  this.successRate = (this.successRate * (this.reviewCount - 1) + currentSuccess) / this.reviewCount;
};

module.exports = Flashcard;