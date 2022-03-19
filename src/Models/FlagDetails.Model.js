const { DataTypes } = require("sequelize");
module.exports = (sequelizeInstance) => {
	const flag_details = sequelizeInstance.define("flag_details", {
		email: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		subtopicorquestionid: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		flag_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},
		type: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		date: {
			type: DataTypes.DATE,
		},
		is_present: {
			type: DataTypes.BOOLEAN,
		},
	});
	return flag_details;
};
