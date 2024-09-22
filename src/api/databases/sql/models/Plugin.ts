import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sql';
import User from './User';

class Plugin extends Model {}

Plugin.init(
  {
    // unique identifier for the plugins
    id: {
      type: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // name of the plugin, a more human-readable friendly identifier but may not be unique
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // a brief description of the plugin
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // number of favorites given to the plugin
    favoritesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'favorites_count',
    },
    // image url of the plugin
    imageURL: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'image_url',
    },
    // date when the plugin is created
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()'),
      field: 'created_at',
    },
    // date when the plugin was last updated
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()'),
      field: 'updated_at',
    },
  },
  {
    sequelize,
    modelName: 'Plugin',
    timestamps: false,
  },
);

// a plugin belong to a user

Plugin.belongsTo(User, {
  foreignKey: 'userId',
});

export default Plugin;
