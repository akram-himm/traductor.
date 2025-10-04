const { sequelize, DataTypes } = require('../config/database');

const Subscription = sequelize.define('Subscription', {
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
  stripeCustomerId: {
    type: DataTypes.STRING,
    allowNull: false
    // Retiré unique: true car un client peut avoir plusieurs souscriptions
  },
  stripeSubscriptionId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  stripePriceId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(
      'active',
      'canceled',
      'incomplete',
      'incomplete_expired',
      'past_due',
      'trialing',
      'unpaid'
    ),
    allowNull: false
  },
  isEarlyBird: {
    type: DataTypes.BOOLEAN,
    defaultValue: true // Pour l'instant tout le monde a le prix early bird
  },
  currentPeriodStart: {
    type: DataTypes.DATE,
    allowNull: false
  },
  currentPeriodEnd: {
    type: DataTypes.DATE,
    allowNull: false
  },
  cancelAtPeriodEnd: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = Subscription;
