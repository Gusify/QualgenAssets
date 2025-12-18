import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';
import AssetModel from './AssetModel';
import Location from './Location';
import Owner from './Owner';

export interface AssetAttributes {
  id: number;
  number: string;
  name: string;
  assetModelId: number;
  locationId: number;
  ownerId: number;
  expressServiceTag: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type AssetCreationAttributes = Optional<AssetAttributes, 'id' | 'expressServiceTag'>;

class Asset
  extends Model<AssetAttributes, AssetCreationAttributes>
  implements AssetAttributes
{
  public id!: number;
  public number!: string;
  public name!: string;
  public assetModelId!: number;
  public locationId!: number;
  public ownerId!: number;
  public expressServiceTag!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Asset.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    number: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    assetModelId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    locationId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    ownerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    expressServiceTag: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: null
    }
  },
  {
    sequelize,
    modelName: 'Asset',
    tableName: 'assets'
  }
);

Asset.belongsTo(AssetModel, {
  as: 'model',
  foreignKey: 'assetModelId',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT'
});

Asset.belongsTo(Location, {
  as: 'location',
  foreignKey: 'locationId',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT'
});

Asset.belongsTo(Owner, {
  as: 'owner',
  foreignKey: 'ownerId',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT'
});

export default Asset;
