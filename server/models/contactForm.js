const { Model, DataTypes } = require("sequelize");
const { postgres } = require("../config/db/postgres/connectPostgres");

class ContactFrom extends Model {}

ContactFrom.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    qr: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },

  {
    sequelize: postgres,
    modelName: "ContactForm",
    tableName: "ContactForms",
    timestamps: true,
  }
);

module.exports = ContactFrom;
