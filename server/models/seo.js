const { Model, DataTypes } = require("sequelize");
const { postgres } = require("../config/db/postgres/connectPostgres");
class SEO extends Model {}

SEO.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        metaTitle: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        page:{
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        metaDescription:{
            type: DataTypes.TEXT,
            allowNull: false,
        },
        tags:{
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
        },
        keywords: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        ogTitle: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        ogDescription: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        ogImage: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        canonicalUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        }
    },
    {
        sequelize : postgres,
        modelName: "SEO",
        tableName: "SEOs",
        timestamps: true,
    }
)

module.exports = SEO;
