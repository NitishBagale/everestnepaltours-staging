const { Model, DataTypes } = require("sequelize");
const { postgres } = require("../config/db/postgres/connectPostgres");

class ContentBlock extends Model {}

ContentBlock.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        packageId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'PackageTours',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        type: {
            type: DataTypes.ENUM('after_description', 'before_faq', 'after_faq', 'custom'),
            allowNull: false,
            defaultValue: 'custom'
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        order: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        }
    },
    {
        sequelize: postgres,
        modelName: "ContentBlock",
        tableName: "content_blocks",
        timestamps: true,
        indexes: [
            {
                fields: ['packageId', 'type', 'order']
            }
        ]
    }
);

module.exports = ContentBlock;
