import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';

export interface AssetMaintenanceAttributes {
  id: number;
  assetId: number;
  vendor: string;
  duration: string;
  scheduledAt: Date;
  completedAt?: Date | null;
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
  public completedAt!: Date | null;
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
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  },
  {
    sequelize,
    modelName: 'AssetMaintenance',
    tableName: 'assetMaintenances'
  }
);

export default AssetMaintenance;
