import sequelize from "./sequelize";
const { Sequelize, DataTypes, Model } = require('sequelize');

class Message extends Model {
	static associate(models){
		Message.belongsTo(models.user);
		Message.belongsTo(models.room);
	}
}

Message.init({
	body: {
		type: DataTypes.STRING,
		allowNull: false,
	},
}, {
	sequelize,
	modelName: 'message'
});


export default Message;
