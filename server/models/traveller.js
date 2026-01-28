
const { Model, DataTypes } = require("sequelize");
const { postgres } = require("../config/db/postgres/connectPostgres");

class Traveller extends Model {}

Traveller.init(
    {
        id:{
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        fullName:{
            type: DataTypes.STRING,
            allowNull: false

        },
        email:{
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password:{
            type: DataTypes.STRING,
            allowNull: false,
        },
        passport:{
            type: DataTypes.STRING,
            allowNull: true,
        },
        cantactNumber:{
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        trvelDate:{
            type: DataTypes.DATE,
            allowNull: true,
        },
        noOfTravellers:{
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        accomodation:{
            type: DataTypes.STRING,
            allowNull: true,
            Enum:['3 stars','4 stars','5 stars', 'Luxury/High-end']
        },
        description:{
            type: DataTypes.TEXT,
            allowNull: true,
        }
    },
     {
    sequelize: postgres,
    modelName: "Traveller",
    tableName: "travellers",
    timestamps: true,
  }

)

module.exports = Traveller ;