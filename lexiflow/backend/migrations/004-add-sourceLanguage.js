'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ajouter la colonne sourceLanguage à la table Flashcards
    await queryInterface.addColumn('Flashcards', 'sourceLanguage', {
      type: Sequelize.STRING(5),
      allowNull: true,
      defaultValue: 'auto'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer la colonne sourceLanguage
    await queryInterface.removeColumn('Flashcards', 'sourceLanguage');
  }
};