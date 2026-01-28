
const { Model, DataTypes } = require("sequelize");
const { postgres } = require("../config/db/postgres/connectPostgres");

class Trip extends Model {}

Trip.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // The requested Category field to group trips (e.g., Annapurna Region)
  category: {
    type: DataTypes.STRING, 
    allowNull: false,
    validate: {
      isIn: [[
        'Everest Region',
        'Annapurna Region',
        'Langtang Region',
        'Bhutan Cultural',
        'Tibet Overland',
        'Kathmandu Valley',
        'Pokhara & Leisure',
        'Nepal Bhutan Tibet Combo'
      ]]
    }
  },
  durationDays: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  priceUsd: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  difficulty: {
    type: DataTypes.ENUM('Easy', 'Moderate', 'Strenuous', 'Extreme'),
    defaultValue: 'Moderate'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  imageUrl: {
    type: DataTypes.STRING,
    defaultValue: 'https://picsum.photos/seed/default/800/600'
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Storing the itinerary as a JSON object since it's a complex structure
  itinerary: {
    type: DataTypes.JSONB,
    allowNull: true
  }
},
  {
    sequelize: postgres,
    modelName: "Trip",
    tableName: "Trips",
    timestamps: true,
  }
);

module.exports = Trip;
