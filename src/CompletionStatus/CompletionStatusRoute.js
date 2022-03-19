const express = require("express");

const { URIS } = require("./CompletionStatusConstant");
const { isValidToken, isValidTopicId, isValidModuleId } = require("../MiddleWares/Validations");
const {
	getAggregatedCompletionPercentageForModules,
	getCompletionDetailsForSpecificModule,
	getTopicProgressDetails,
} = require("./CompletionStatusUtility");
const router = express.Router();

router.get(
	URIS.GET_MODULE_COMPLETION_DETAILS,
	[isValidToken],
	getAggregatedCompletionPercentageForModules
);

router.get(
	URIS.GET_COMPLETION_DETAILS_FOR_SPECIFIC_MODULE,
	[isValidToken, isValidModuleId],
	getCompletionDetailsForSpecificModule
);

router.get(
	URIS.GET_TOPIC_PROGRESS_DETAILS,
	[isValidToken, isValidTopicId],
	getTopicProgressDetails
);

module.exports = router;
