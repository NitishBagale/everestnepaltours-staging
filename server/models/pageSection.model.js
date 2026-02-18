const { Model, DataTypes } = require("sequelize");
const { postgres } = require("../config/db/postgres/connectPostgres");

class PageSection extends Model {}

PageSection.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    page_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "cms_contents",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    is_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    sequelize: postgres,
    modelName: "PageSection",
    tableName: "cms_sections",
    timestamps: true,
    indexes: [
      {
        fields: ["page_id", "sort_order"],
      },
      {
        fields: ["type"],
      },
    ],
  }
);

module.exports = PageSection;
