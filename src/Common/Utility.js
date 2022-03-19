const { ERROR_TYPE } = require("../../constant");

function isNOTNULLEMPTYORUNDEFINED(value) {
	return !(value === null || value === undefined || value === "");
}

function isResStatusSubscribed(Response) {
	return (
		Response &&
		Response.data &&
		Response.data.Response &&
		Response.data.Response.Subscription &&
		Response.data.Response.Subscription.status
	);
}

function isUserOnTrial(Response) {
	return (
		Response &&
		Response.data &&
		Response.data.Response &&
		Response.data.Response.Subscription &&
		Response.data.Response.Subscription.onTrial
	);
}

const getEmailFromToken = (token) => {
	if (!isNOTNULLEMPTYORUNDEFINED(token)) {
		return "";
	}
	let base64Payload = token.split(".")[1];
	if (!isNOTNULLEMPTYORUNDEFINED(base64Payload)) {
		return "";
	}
	var payload = Buffer.from(base64Payload, "base64");
	let decodedPayload = JSON.parse(payload.toString());
	let username = decodedPayload && decodedPayload.email;
	return username;
};

const reviseError = (error) => {
	let statusCode, errorMessage;
	if (error.name === ERROR_TYPE.REQUEST_ERROR) {
		statusCode = 400;
		errorMessage = error.message;
	} else if (error.name === ERROR_TYPE.UNAUTHORIZED_ERROR) {
		statusCode = 401;
		errorMessage = error.message;
	} else if (error.response && error.response.data) {
		statusCode = 400;
		errorMessage = error.response.data;
	} else {
		statusCode = 500;
		errorMessage = "Internal Server Error";
	}
	return [statusCode, errorMessage];
};

module.exports = {
	getEmailFromToken,
	isResStatusSubscribed,
	isNOTNULLEMPTYORUNDEFINED,
	reviseError,
	isUserOnTrial,
};
