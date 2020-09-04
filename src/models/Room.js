import sequelize from "./sequelize";
const { Sequelize, DataTypes, Model } = require('sequelize');

class Room extends Model {
	static associate(models){
		// Room.belongsToMany(models.user, { through: models.room_user });
		Room.belongsTo(models.user, { as: 'user1' });
		Room.belongsTo(models.user, { as: 'user2' });
		Room.hasMany(models.message);
	}
}

Room.init({
	name: {
		type: DataTypes.STRING,
		allowNull: true,
	},
}, {
	sequelize,
	modelName: 'room'
});


export default Room;
