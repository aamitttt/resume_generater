const dotenv = require("dotenv");
dotenv.config();
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
module.exports = {
	port: process.env.PORT,
	accessKey: process.env.ACCESSKEY,
	secretKey: process.env.SECRETKEY,
	region: process.env.REGION,
	userPoolId: process.env.USER_POOL_ID,
	appClientId: process.env.APP_CLIENT_ID,
	dbUser: process.env.DB_USER,
	dbHost: process.env.DB_HOST,
	database: process.env.DATABASE,
	dbHmac: process.env.DB_HMAC,
	dbPort: process.env.DB_PORT,
	utilityEndpointBaseUrl: process.env.UTILITY_ENPOINT,
};
