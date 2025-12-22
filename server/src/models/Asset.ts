import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';
import AssetMaintenance from './AssetMaintenance';
import AssetModel from './AssetModel';
import Location from './Location';
import Owner from './Owner';

export type PurchaseType = 'purchase' | 'leased';

export interface AssetAttributes {
  id: number;
  assetModelId: number;
  locationId: number;
  ownerId: number;
  expressServiceTag: string | null;
  purchaseType: PurchaseType | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type AssetCreationAttributes = Optional<
  AssetAttributes,
  'id' | 'expressServiceTag' | 'purchaseType'
>;

class Asset
  extends Model<AssetAttributes, AssetCreationAttributes>
  implements AssetAttributes
{
  public id!: number;
  public assetModelId!: number;
  public locationId!: number;
  public ownerId!: number;
  public expressServiceTag!: string | null;
  public purchaseType!: PurchaseType | null;
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
    },
    purchaseType: {
      type: DataTypes.STRING(20),
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

Asset.hasMany(AssetMaintenance, {
  as: 'maintenanceRecords',
  foreignKey: 'assetId',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
});

AssetMaintenance.belongsTo(Asset, {
  as: 'asset',
  foreignKey: 'assetId',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
});

export default Asset;
