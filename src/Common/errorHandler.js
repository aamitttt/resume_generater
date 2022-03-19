const CustomError = require("custom-error-instance");
const { ERROR_TYPE } = require("../../constant");

var UnauthorizedError = CustomError(ERROR_TYPE.UNAUTHORIZED_ERROR);
var RequestError = CustomError(ERROR_TYPE.REQUEST_ERROR);

module.exports = {
	UnauthorizedError,
	RequestError,
};
