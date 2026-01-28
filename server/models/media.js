const { Model, DataTypes } = require("sequelize");
const { postgres } = require("../config/db/postgres/connectPostgres");

class Media extends Model {}

Media.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        url: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        originalName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        mimeType: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        size: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        altText: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        category: {
            type: DataTypes.ENUM('package', 'destination', 'banner', 'gallery', 'other'),
            defaultValue: 'other',
        },
        width: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        height: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        variants: {
            type: DataTypes.JSONB,
            defaultValue: {},
        },
        hash: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        uploadedBy: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        metaData:{
            type: DataTypes.JSONB,
            defaultValue: {},
        }
    },
    {
        sequelize: postgres,
        modelName: "Media",
        tableName: "media",
        timestamps: true,
        paranoid: true
    }
);

module.exports = Media;
