
const { Model, DataTypes } = require("sequelize");
const { postgres } = require("../config/db/postgres/connectPostgres");

class Review extends Model {}

Review.init(
    {
       id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    guestName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    travelDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    tourTitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    reviewText: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    rating: {
      type: DataTypes.DECIMAL(2,1),
      allowNull: false,
      validate: { min: 1, max: 5 }
    },
    packageIds: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
      defaultValue: [],
    },
    image: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize: postgres,
    modelName: "Review",
    tableName: "Reviews",
    timestamps: true,
  }
);

module.exports = Review;
