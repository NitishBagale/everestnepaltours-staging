const { Model, DataTypes } = require("sequelize");
const { postgres } = require("../config/db/postgres/connectPostgres");

class OnlineBooking extends Model {}

OnlineBooking.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    bookingRef: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
    },
    totalPax: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    tripName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tripDate: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    depositAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    termsAccepted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "hbl",
    },
    paymentStatus: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "initiated",
    },
    gatewayStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gatewayReference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paymentReceiptEmailSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize: postgres,
    modelName: "OnlineBooking",
    tableName: "online_bookings",
    timestamps: true,
  }
);

module.exports = OnlineBooking;
