const Sequelize = require("sequelize");


const sequelizeInstance = new Sequelize(
	process.env.DATABASE,
	process.env.DB_USER,
	process.env.DB_HMAC,
	{
		host: process.env.DB_HOST,
		port: process.env.DB_PORT,
		dialect: "postgres",
		pool: {
			max: 10,
			idle: 30000,
		},
		define: {
			timestamps: false,
		},
	}
);

const db = {};
db.sequelizeInstance = sequelizeInstance;
db.userProblemGoalsTracker = require("./UserProblemGoalsTracker.Model")(sequelizeInstance);
db.userVideoGoalsTracker = require("./UserVideoGoalsTracker.Model")(sequelizeInstance);
db.flag_details = require("./FlagDetails.Model")(sequelizeInstance);
db.flags = require("./Flags.model")(sequelizeInstance);

module.exports = db;
