const { DataTypes } = require("sequelize");
module.exports = (sequelizeInstance) => {
	const user_video_goals_tracker = sequelizeInstance.define("user_video_goals_tracker", {
		email: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		date: {
			type: DataTypes.DATE,
			primaryKey: true,
		},
		goal_problems: {
			type: DataTypes.INTEGER,
		},
	});
	return user_video_goals_tracker;
};
