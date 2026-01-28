const { Model, DataTypes } = require("sequelize");
const { postgres } = require("../../config/db/postgres/connectPostgres");

class Role extends Model{}

Role.init({
    id:{
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    name:{
        type: DataTypes.STRING,
        allowNull: false,
        unique: [true, "Role already exists"]
    },
  
},
{
    sequelize:postgres,
    modelName: "Role",
    tableName: "Roles",
    timestamps: true,
}
)

module.exports = Role;