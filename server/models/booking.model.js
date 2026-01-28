const { Model, DataTypes } = require("sequelize");
const { postgres } = require("../config/db/postgres/connectPostgres");

class Booking extends Model {}

Booking.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    bookingDate: {
      type: DataTypes.STRING,
      defaultValue: new Date().toLocaleDateString("en-GB"),
      allowNull: false,
    },
    pickupDate: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    returnDate: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    totalAmount: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending",
    },
    paymentStatus: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    trvellerInfo: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    packageName: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize: postgres,
    modelName: "Booking",
    tableName: "Bookings",
    timestamps: true,
  }
);

module.exports = Booking;
