const { Model, DataTypes } = require("sequelize");
const { postgres } = require("../config/db/postgres/connectPostgres");

class PackageTour extends Model {}

PackageTour.init(
    {
        id:{
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        package:{
            type: DataTypes.JSONB,
            allowNull: false,
        },
    },
    {
    sequelize: postgres,
    modelName: "PackageTour",
    tableName: "PackageTours",
    timestamps: true,
    }
)

module.exports = PackageTour;