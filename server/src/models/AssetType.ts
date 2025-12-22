import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';

export interface AssetTypeAttributes {
  id: number;
  name: string;
  description: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type AssetTypeCreationAttributes = Optional<AssetTypeAttributes, 'id' | 'description'>;

class AssetType
  extends Model<AssetTypeAttributes, AssetTypeCreationAttributes>
  implements AssetTypeAttributes
{
  public id!: number;
  public name!: string;
  public description!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AssetType.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    }
  },
  {
    sequelize,
    modelName: 'AssetType',
    tableName: 'assetTypes'
  }
);

export default AssetType;
