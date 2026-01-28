
const { Model, DataTypes } = require("sequelize");
const { postgres } = require("../config/db/postgres/connectPostgres");


class Blog extends Model{}

Blog.init(
  {
    id:{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    mainTitle:{
      type: DataTypes.STRING,
      allowNull: false,
  },
  slug:{
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description:{
    type: DataTypes.TEXT,
    allowNull: false,
  },
  coverImage:{
    type: DataTypes.STRING,
    allowNull: false,
  },
  date :{
    type: DataTypes.STRING,
    allowNull: false,
  },
  blogContant:{
    type: DataTypes.TEXT,
    allowNull: false,
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
  },
  meta_title: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  meta_description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  meta_keywords: {
    type: DataTypes.STRING,
    allowNull: true,
  },
},
{
  sequelize: postgres,
  modelName: "Blog",
  tableName: "Blogs",
  timestamps: true,
}
)
module.exports = Blog;
