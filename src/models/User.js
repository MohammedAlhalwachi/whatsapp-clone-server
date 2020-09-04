import sequelize from "./sequelize";
import hash from "../services/hash";
import Room from '../models/Room'
import {Op} from "sequelize";

const { Sequelize, DataTypes, Model } = require('sequelize');

class User extends Model {
	async validPassword(password){
		return hash.compare(password, this.password);
	}
	
	async getRooms(){
		const rooms = await Room.findAll({
			include: [
				{
					model: User,
					as: 'user1'
				},
				{
					model: User,
					as: 'user2'
				}
			],
			where: {
				[Op.or]: [
					{
						'$user1.id$': this.id,
					},
					{
						'$user2.id$': this.id,
					},
				]
			}
		});
		
		const resRooms = rooms.map(room => {
			let name = '';
			
			if(room.user1Id === this.id)
				name = room.user2.username;
			else
				name = room.user1.username;

			room.name = name;
			
			return room;
		});
		
		return resRooms;
	}

	static associate(models){
		// User.belongsToMany(models.room, { through: models.room_user });

		// User.hasMany(models.room, { foreignKey: 'user1Id'});
		// User.hasMany(models.room, { foreignKey: 'user2Id'});
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
