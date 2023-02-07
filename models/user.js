import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";
import { Post } from "./post.js";
import { Comment } from "./comment.js";

export const User = sequelize.define("User", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2,
  },
});

// This is a one-to-many relationship, where a user can have many posts.
User.hasMany(Post, {
  onDelete: "CASCADE",
});
Post.belongsTo(User);

// This is a one-to-many relationship, where a user can have many comments.
User.hasMany(Comment, {
  onDelete: "CASCADE",
});
Comment.belongsTo(User);