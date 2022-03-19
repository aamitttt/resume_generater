const { DataTypes } = require("sequelize");
module.exports = (sequelizeInstance) => {
	const user_problem_goals_tracker = sequelizeInstance.define("user_problem_goals_tracker", {
		email: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		date: {
			type: DataTypes.DATE,
			primaryKey: true,
		},
		goal_minutes: {
			type: DataTypes.INTEGER,
		},
	});
	return user_problem_goals_tracker;
};
