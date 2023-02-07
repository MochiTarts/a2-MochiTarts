import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";
import { User } from "./user.js";

export const UserType = sequelize.define("UserType", {
  type: {
    type: DataTypes.INTEGER, // 1 = account, 2 = guest
    allowNull: false,
  },
});

// User and UserType are in a one-to-one relationship
User.hasOne(UserType, {
  onDelete: "CASCADE",
});
UserType.belongsTo(User);