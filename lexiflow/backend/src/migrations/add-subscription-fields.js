'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ajouter subscriptionPlan
    await queryInterface.addColumn('Users', 'subscriptionPlan', {
      type: Sequelize.ENUM('monthly', 'yearly', 'trial'),
      allowNull: true
    });
    
    // Ajouter subscriptionStatus
    await queryInterface.addColumn('Users', 'subscriptionStatus', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'free'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'subscriptionPlan');
    await queryInterface.removeColumn('Users', 'subscriptionStatus');
  }
};