import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';

export interface AssetAttributes {
  id: number;
  number: string;
  name: string;
  location: string;
  owner: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type AssetCreationAttributes = Optional<AssetAttributes, 'id'>;

class Asset
  extends Model<AssetAttributes, AssetCreationAttributes>
  implements AssetAttributes
{
  public id!: number;
  public number!: string;
  public name!: string;
  public location!: string;
  public owner!: string;
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
    location: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    owner: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'Asset',
    tableName: 'assets'
  }
);

export default Asset;
