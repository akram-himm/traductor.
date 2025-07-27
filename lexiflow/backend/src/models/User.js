const { sequelize, DataTypes } = require('../config/database');
const bcrypt = require('bcrypt');

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
    allowNull: true // null pour les connexions Google OAuth
  },
  googleId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  facebookId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  stripeCustomerId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING,
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
  // Free Trial
  trialStartedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  trialEndsAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Email Verification
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailVerificationToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emailVerificationExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  flashcardCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {
      targetLanguage: 'fr',
      buttonColor: '#3b82f6',
      animationsEnabled: true
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

// Méthodes d'instance
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

User.prototype.checkPremiumStatus = function() {
  // Vérifier d'abord le free trial
  if (this.trialEndsAt && new Date() < new Date(this.trialEndsAt)) {
    return true; // Trial actif = accès Premium
  }
  
  // Ensuite vérifier le statut Premium normal
  if (!this.isPremium) return false;
  if (!this.premiumUntil) return true;
  return new Date() < new Date(this.premiumUntil);
};

User.prototype.getFlashcardLimit = function() {
  return this.checkPremiumStatus() ? Infinity : 100;
};

User.prototype.isTrialActive = function() {
  return this.trialEndsAt && new Date() < new Date(this.trialEndsAt);
};

User.prototype.isEmailVerified = function() {
  return this.emailVerified === true;
};

module.exports = User;
