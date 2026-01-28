
const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("./booking.model");

class Comment extends Model {}

Comment.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  response: {
    type: DataTypes.ENUM,
    values: ["sad", "love", "angry", "funny", "surprised", "Upvote"],
    allowNull: false,
  },
  comment :{
    type: DataTypes.TEXT,
    allowNull: false,
  },
  packageTourName: {
    type: DataTypes.STRING,
    allowNull: false,
  }
},
{
    sequelize: sequelize,
    modelName: "Comment",
    tableName: "Comments",
    timestamps: true,
});

module.exports = Comment;