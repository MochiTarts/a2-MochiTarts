import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";
import { Comment } from "./comment.js";

export const Post = sequelize.define("Post", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  picture: {
    type: DataTypes.JSON,
    allowNull: false,
  },
});

// This is a one-to-many relationship, where a post can have many comments.
Post.hasMany(Comment, {
  onDelete: "CASCADE",
});
Comment.belongsTo(Post);