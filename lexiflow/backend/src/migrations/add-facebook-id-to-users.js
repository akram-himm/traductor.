'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'facebookId', {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true,
      after: 'googleId'
    });

    // Ajouter un index pour optimiser les recherches
    await queryInterface.addIndex('Users', ['facebookId'], {
      unique: true,
      where: {
        facebookId: {
          [Sequelize.Op.ne]: null
        }
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Users', ['facebookId']);
    await queryInterface.removeColumn('Users', 'facebookId');
  }
};