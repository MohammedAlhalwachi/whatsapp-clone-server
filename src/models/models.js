import sequelize from "./sequelize";
import User from "./User";

const models = sequelize.models;

Object.keys(models).forEach(modelKey => {
	const model = models[modelKey];
	if(model.associate)
		model.associate(models)
});

module.exports = {
	User: models.user,
};
