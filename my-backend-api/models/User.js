const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true // Null pour OAuth
  },
  googleId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  isPremium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  premiumUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  stripeCustomerId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {
      targetLanguage: 'fr',
      buttonColor: '#3b82f6',
      enableShortcut: true,
      autoSaveFlashcard: false,
      enableAnimations: true
    }
  },
  flashcardCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastLogin: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password') && user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

// Méthodes d'instance
User.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  delete values.stripeCustomerId;
  return values;
};

User.prototype.checkPremiumStatus = function() {
  if (!this.isPremium) return false;
  if (!this.premiumUntil) return true;
  return new Date() < new Date(this.premiumUntil);
};

module.exports = User;