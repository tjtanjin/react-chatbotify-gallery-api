import { DataTypes, Model } from "sequelize";
import { sequelize } from "../sql";
import User from "./User";

/**
 * Stores the data of themes.
 */
class Theme extends Model { }

Theme.init({
	// unique identifier for the theme, matches github themes folder name (e.g. minimal_midnight)
	id: {
		type: DataTypes.STRING,
		primaryKey: true
	},
	// name of the theme, a more human-readable friendly identifier but may not be unique
	name: {
		type: DataTypes.STRING,
		allowNull: false
	},
	// a brief description of the theme
	description: {
		type: DataTypes.TEXT,
		allowNull: true
	},
	// number of favorites given to the theme
	favoritesCount: {
		type: DataTypes.INTEGER,
		defaultValue: 0,
		field: "favorites_count"
	},
	// date when the theme is created, based on when it was synced in from github
	createdAt: {
		type: DataTypes.DATE,
		defaultValue: sequelize.literal("NOW()"),
		field: "created_at"
	},
	// date when the theme was last updated, based on when sync detects a version upgrade
	updatedAt: {
		type: DataTypes.DATE,
		defaultValue: sequelize.literal("NOW()"),
		field: "updated_at"
	}
}, {
	sequelize,
	modelName: "Theme",
	timestamps: false
});

// theme belongs to a user, but permitted to be empty (for direct theme contributions to github repository)
// todo: perhaps the sync job can attempt to reconcile theme ownership each time it is run based on meta.json author?
Theme.belongsTo(User, { foreignKey: "userId" });

export default Theme;