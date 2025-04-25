import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model, sql } from "@sequelize/core";
import { Attribute, Default, NotNull, PrimaryKey, Table } from '@sequelize/core/decorators-legacy';

@Table
export default class Mission extends Model<InferAttributes<Mission>, InferCreationAttributes<Mission>> {
  @Attribute(DataTypes.UUIDV4)
  @PrimaryKey
  @Default(sql.uuidV4)
  declare _id: CreationOptional<string>;

  @Attribute(DataTypes.ARRAY(DataTypes.STRING))
  @NotNull
  @Default([])
  declare deliverables: CreationOptional<string[]>;

  @Attribute(DataTypes.ENUM("Upcoming", "Live", "Completed", "Review"))
  @NotNull
  declare status: "Upcoming" | "Live" | "Completed" | "Review"; // index

  @Attribute(DataTypes.UUIDV4)
  @NotNull
  declare user: string; // index

  @Attribute(DataTypes.STRING)
  declare pilotAssigned: string | null;

  @Attribute(DataTypes.UUIDV4)
  declare assetID: string | null;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare name: string;

  @Attribute(DataTypes.STRING)
  declare description: string | null;

  @Attribute(DataTypes.UUIDV4)
  @NotNull
  declare tenantId: string; // index

  @Attribute(DataTypes.ARRAY(DataTypes.UUIDV4))
  @NotNull
  @Default([])
  declare clientId: CreationOptional<string[]>; // index

  @Attribute(DataTypes.UUIDV4)
  @NotNull
  declare missionType: string;

  @Attribute(DataTypes.UUIDV4)
  @NotNull
  @Default([])
  declare invites: CreationOptional<string[]>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  @Attribute(DataTypes.DOUBLE)
  @NotNull
  @Default(0)
  declare size: CreationOptional<number>;

  @Attribute(DataTypes.BOOLEAN)
  @NotNull
  @Default(false)
  declare isPublic: CreationOptional<boolean>;
}

Mission.create
