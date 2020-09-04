import sequelize from "./sequelize";

// import Room_User from "./Room_User";
import User from "./User";
import Room from "./Room";
import Message from "./Message";

const models = sequelize.models;

Object.keys(models).forEach(modelKey => {
	const model = models[modelKey];
	if(model.associate)
		model.associate(models)
});

module.exports = {
	User: models.user,
	Room: models.room,
	// Room_User: models.room_user,
};
