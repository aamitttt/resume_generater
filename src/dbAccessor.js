const pool = require("./db");

async function runQuery(query, paramsArray) {
	try {
		let client = await pool.connect();
		let responseFromDB;
		try {
			responseFromDB = await client.query(query, paramsArray);
			client.release();
		} catch (error) {
			client.release();
			throw error;
		}
		return responseFromDB.rows;
	} catch (error) {
		throw error;
	}
}

module.exports = {
	runQuery,
};
