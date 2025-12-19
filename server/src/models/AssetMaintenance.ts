import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';

export interface AssetMaintenanceAttributes {
  id: number;
  assetId: number;
  vendor: string;
  duration: string;
  scheduledAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type AssetMaintenanceCreationAttributes = Optional<AssetMaintenanceAttributes, 'id'>;

class AssetMaintenance
  extends Model<AssetMaintenanceAttributes, AssetMaintenanceCreationAttributes>
  implements AssetMaintenanceAttributes
{
  public id!: number;
  public assetId!: number;
  public vendor!: string;
  public duration!: string;
  public scheduledAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AssetMaintenance.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    assetId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    vendor: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    duration: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'AssetMaintenance',
    tableName: 'assetMaintenances'
  }
);

export default AssetMaintenance;
