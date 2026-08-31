'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('teams', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      designation: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      imageUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      meta_title: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      meta_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      meta_keywords: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('teams');
  },
};