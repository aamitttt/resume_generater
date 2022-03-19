const ERROR_TYPE = {
	UNAUTHORIZED_ERROR: "UNAUTHORIZED_ERROR",
	REQUEST_ERROR: "REQUEST_ERROR",
};
Object.freeze(ERROR_TYPE);

const EMAIL_REGEX =
	/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

module.exports = {
	ERROR_TYPE,
	EMAIL_REGEX,
};
