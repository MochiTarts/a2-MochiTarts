import { sequelize } from "../datasource.js";
import { UserType } from "./user-types.js";

export const Guest = sequelize.define("Guest", {});

// Guest and UserType are in a one-to-one relationship
Guest.hasOne(UserType);
UserType.belongsTo(Guest, {
  onDelete: "CASCADE",
});