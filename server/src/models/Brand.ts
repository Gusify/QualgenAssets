import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';

export interface BrandAttributes {
  id: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type BrandCreationAttributes = Optional<BrandAttributes, 'id'>;

class Brand extends Model<BrandAttributes, BrandCreationAttributes> implements BrandAttributes {
  public id!: number;
  public name!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Brand.init(
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
    }
  },
  {
    sequelize,
    modelName: 'Brand',
    tableName: 'brands'
  }
);

export default Brand;
