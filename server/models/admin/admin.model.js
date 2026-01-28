const { Model, DataTypes } = require("sequelize");
const postgres = require("../../config/db/postgres/connectPostgres").postgres;

class Admin extends Model{}

Admin.init({
    id:{
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    name:{
        type: DataTypes.STRING,
        allowNull: false
    },
    email:{
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password:{
        type: DataTypes.STRING,
        allowNull: false
    },
    role:{
        type: DataTypes.STRING,
        allowNull: true,
        ENUM: [ 'admin', 'editor'],
        defaultValue: 'editor',

        // references: {
        //     model: "Roles",
        //     key: "id"
        // }
    },
    profileImage:{
        type: DataTypes.STRING,
        allowNull: true
    },
},
{
    sequelize:postgres,
    modelName: "Admin",
    tableName: "Admins",
    timestamps: true,
})

module.exports = Admin;