const { DataTypes } = require("sequelize");
module.exports = (sequelizeInstance) => {
	const flags = sequelizeInstance.define("flags", {
		flag_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},
		flag: {
			type: DataTypes.STRING,
		},
	});
	return flags;
};
