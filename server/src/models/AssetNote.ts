import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';

export interface AssetNoteAttributes {
  id: number;
  assetId: number;
  key: string;
  value: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type AssetNoteCreationAttributes = Optional<AssetNoteAttributes, 'id'>;

class AssetNote
  extends Model<AssetNoteAttributes, AssetNoteCreationAttributes>
  implements AssetNoteAttributes
{
  public id!: number;
  public assetId!: number;
  public key!: string;
  public value!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AssetNote.init(
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
    key: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'AssetNote',
    tableName: 'assetNotes'
  }
);

export default AssetNote;
