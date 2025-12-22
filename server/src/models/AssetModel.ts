import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';
import AssetType from './AssetType';
import Brand from './Brand';
import AssetNote from './AssetNote';

export interface AssetModelAttributes {
  id: number;
  assetTypeId: number;
  brandId: number;
  title: string;
  specSummary: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type AssetModelCreationAttributes = Optional<AssetModelAttributes, 'id' | 'specSummary'>;

class AssetModel
  extends Model<AssetModelAttributes, AssetModelCreationAttributes>
  implements AssetModelAttributes
{
  public id!: number;
  public assetTypeId!: number;
  public brandId!: number;
  public title!: string;
  public specSummary!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AssetModel.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    assetTypeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    brandId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    specSummary: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    }
  },
  {
    sequelize,
    modelName: 'AssetModel',
    tableName: 'assetModels'
  }
);

AssetModel.belongsTo(AssetType, {
  as: 'assetType',
  foreignKey: 'assetTypeId',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT'
});

AssetModel.belongsTo(Brand, {
  as: 'brand',
  foreignKey: 'brandId',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT'
});

AssetModel.hasMany(AssetNote, {
  as: 'notes',
  foreignKey: 'assetModelId',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
});

AssetNote.belongsTo(
  AssetModel,
  {
    as: 'model',
    foreignKey: 'assetModelId',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  }
);

export default AssetModel;
