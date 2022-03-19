const express = require("express");
const { filterResourcesByFlags, updateFlags, getFlags } = require("./FlagUtility");
const { URIS } = require("./FlagConstant");
const {
	isValidToken,
	isSubtopicOrQuestionIdInBodyValid,
	isFlagIdInBodyValid,
	isTypeInBodyValid,
	isQueryInBodyValid,
} = require("../MiddleWares/Validations");

const router = express.Router();

 

router.post(
	URIS.UPDATE_FLAGS,
	[isValidToken, isSubtopicOrQuestionIdInBodyValid, isFlagIdInBodyValid, isTypeInBodyValid],
	updateFlags
);
router.post(
	URIS.GET_FLAGS,
	[isValidToken, isSubtopicOrQuestionIdInBodyValid, isTypeInBodyValid],
	getFlags
);
router.post(
	URIS.FILTER_RESOURCES_BY_FLAGS,
	[isValidToken, isQueryInBodyValid],
	filterResourcesByFlags
);
module.exports = router;
