import sequelize from "./sequelize";
import hash from "../services/hash";

const { Sequelize, DataTypes, Model } = require('sequelize');

class User extends Model {
	async validPassword(password){
		return hash.compare(password, this.password);
	}
}

User.init({
	username: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true,
	},
	password: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	email: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true,
	},
	isVerified: {
		type: DataTypes.BOOLEAN,
		defaultValue: false,
	}
}, {
	sequelize,
	modelName: 'user'
});


export default User;
