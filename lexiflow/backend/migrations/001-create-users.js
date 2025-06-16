'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true
      },
      googleId: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      stripeCustomerId: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true
      },
      isPremium: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      premiumUntil: {
        type: Sequelize.DATE,
        allowNull: true
      },
      flashcardCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      settings: {
        type: Sequelize.JSON,
        defaultValue: {}
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
    await queryInterface.addIndex('Users', ['email']);
    await queryInterface.addIndex('Users', ['stripeCustomerId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users');
  }
};
