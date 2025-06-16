'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Subscriptions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      stripeCustomerId: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      stripeSubscriptionId: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      stripePriceId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM(
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
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      currentPeriodStart: {
        type: Sequelize.DATE,
        allowNull: false
      },
      currentPeriodEnd: {
        type: Sequelize.DATE,
        allowNull: false
      },
      cancelAtPeriodEnd: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Index pour performance
    await queryInterface.addIndex('Subscriptions', ['userId']);
    await queryInterface.addIndex('Subscriptions', ['stripeSubscriptionId']);
    await queryInterface.addIndex('Subscriptions', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Subscriptions');
  }
};
