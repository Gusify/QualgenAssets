import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';

export interface AssetSpecAttributes {
  id: number;
  assetModelId: number;
  key: string;
  value: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type AssetSpecCreationAttributes = Optional<AssetSpecAttributes, 'id'>;

class AssetSpec
  extends Model<AssetSpecAttributes, AssetSpecCreationAttributes>
  implements AssetSpecAttributes
{
  public id!: number;
  public assetModelId!: number;
  public key!: string;
  public value!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AssetSpec.init(
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
    key: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    value: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'AssetSpec',
    tableName: 'assetSpecs'
  }
);

export default AssetSpec;
