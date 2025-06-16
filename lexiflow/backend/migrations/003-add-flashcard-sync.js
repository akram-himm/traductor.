'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ajouter des colonnes pour la synchronisation
    await queryInterface.addColumn('Flashcards', 'syncId', {
      type: Sequelize.UUID,
      unique: true,
      allowNull: true
    });
    
    await queryInterface.addColumn('Flashcards', 'lastSynced', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    await queryInterface.addColumn('Flashcards', 'syncVersion', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });
    
    // Index pour performance
    await queryInterface.addIndex('Flashcards', ['syncId']);
    await queryInterface.addIndex('Flashcards', ['lastSynced']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Flashcards', 'syncId');
    await queryInterface.removeColumn('Flashcards', 'lastSynced');
    await queryInterface.removeColumn('Flashcards', 'syncVersion');
  }
};
