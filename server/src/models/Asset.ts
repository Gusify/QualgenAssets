import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';
import Location from './Location';

export interface AssetAttributes {
  id: number;
  number: string;
  expressServiceTag: string | null;
  name: string;
  locationId: number;
  owner: string;
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
  public expressServiceTag!: string | null;
  public name!: string;
  public locationId!: number;
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
    expressServiceTag: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    locationId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: Location,
        key: 'id'
      }
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

Asset.belongsTo(Location, {
  foreignKey: 'locationId',
  as: 'location'
});

export default Asset;
