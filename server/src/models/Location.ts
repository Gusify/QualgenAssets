import { sequelize } from '../db';
import { DataTypes, Model, Optional } from 'sequelize';
export interface LocationAttributes {
  id: number;
  name: string;
  room: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type LocationCreationAttributes = Optional<LocationAttributes, 'id' | 'room'>;

class Location
  extends Model<LocationAttributes, LocationCreationAttributes>
  implements LocationAttributes
{
  public id!: number;
  public name!: string;
  public room!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Location.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: false
    },
    room: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
    }
  },
  {
    sequelize,
    modelName: 'Location',
    tableName: 'locations'
  }
);

export default Location;
