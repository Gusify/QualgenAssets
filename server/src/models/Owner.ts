import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';

export interface OwnerAttributes {
  id: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type OwnerCreationAttributes = Optional<OwnerAttributes, 'id'>;

class Owner extends Model<OwnerAttributes, OwnerCreationAttributes> implements OwnerAttributes {
  public id!: number;
  public name!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Owner.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    }
  },
  {
    sequelize,
    modelName: 'Owner',
    tableName: 'owners'
  }
);

export default Owner;

