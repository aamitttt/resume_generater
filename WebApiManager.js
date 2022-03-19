const { utilityEndpointBaseUrl } = require("./config");
const Axios = require("axios");
function apiGet(url, jwttoken) {
	try {
		let headers = {
			Authorization: jwttoken,
			"Content-Type": "application/json",
		};
		return Axios.get(utilityEndpointBaseUrl + url, { headers });
	} catch (e) {
		console.error(`Failed to call the service: ${e}`);
		return Promise.reject(e);
	}
}

module.exports = { apiGet };
