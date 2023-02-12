import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";
import { UserType } from "./user-types.js";

export const Account = sequelize.define("Account", {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Account and UserType are in a one-to-one relationship
Account.hasOne(UserType);
UserType.belongsTo(Account);
