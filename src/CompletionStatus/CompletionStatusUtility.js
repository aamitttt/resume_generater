const { QueryTypes } = require("sequelize");
const {
	getEmailFromToken,
	isNOTNULLEMPTYORUNDEFINED,
	isResStatusSubscribed,
	isUserOnTrial,
} = require("../Common/Utility");
const models = require("../Models/Index");
const sequelizeInstance = models.sequelizeInstance;
const { getTopicProgressSummaryFromDB } = require("./DBAccessor");
const { apiGet } = require("../WebApiManager");
const {
	CONTENT_TYPE,
	DIFFICULTY_LEVELS,
	MODULE_ID,
	TOPIC_ID,
	VIDEOS,
	TOTAL_VIDEO_AND_QUESTION_COUNT,
	TOTAL_EASY_QUESTIONS,
	TOTAL_MEDIUM_QUESTIONS,
	TOTAL_HARD_QUESTIONS,
	COMPLETED_EASY_QUESTIONS,
	COMPLETED_MEDIUM_QUESTIONS,
	COMPLETED_HARD_QUESTIONS,
	COMPLETED_VIDEOS,
	COMPLETED_QUESTIONS,
	TOTAL_VIDEOS,
	HOMEWORK_QUESTIONS,
	TOTAL_HOMEWORK_QUESTIONS,
	ASSIGNMENT_QUESTIONS,
	TOTAL_ASSIGNMENT_QUESTIONS,
	DIFFICULTY_LEVEL_AND_MODULEDETAILS_ATTRIBUTE_MAP,
} = require("./CompletionStatusConstant");
const {
	getModuleWiseContentCountFromDB,
	getModuleWiseCompletionDetailsFromDB,
	getModuleAndTopicCompletionDetailsFromDB,
	getTopicwiseTotalContentFromDB,
	getTotalQuestionCountWithLevelsFromDB,
} = require("./DBAccessor");
// ---------------------------- START OF FLOW FOR AGGREGATED PERCENTAGE COMPLETION OF ALL MODULES ------------------------------------------
/**
 * @author Lakshyajit Laxmikant <lakshyajit165@gmail.com>
 * returns the total content count (videos + assignments + homeworks) per module
 */
const getModuleWiseContentCount = async () => {
	return new Promise(async (resolve, reject) => {
		try {
			let moduleWiseContentCount = await getModuleWiseContentCountFromDB();
			return resolve(moduleWiseContentCount);
		} catch (err) {
			return reject(err);
		}
	});
};

/**
 * @author Lakshyajit Laxmikant <lakshyajit165@gmail.com>
 * @param { string } email
 * returns the module-wise completion details of a user(videos + assignments + homweworks).
 */
const getModuleWiseCompletionDetails = async (email) => {
	return new Promise(async (resolve, reject) => {
		try {
			let moduleWiseCompletionDetails = await getModuleWiseCompletionDetailsFromDB(email);
			return resolve(moduleWiseCompletionDetails);
		} catch (err) {
			return reject(err);
		}
	});
};

/**
 * @author Lakshyajit Laxmikant <lakshyajit165@gmail.com>
 * @param { array } moduleWiseContentCount (computed by getModuleWiseContentCount())
 * @param { array } moduleCompletionDetails (computed by getModuleWiseCompletionDetails)
 *  return as the response, the module-wise completion percentage for a user.
 */
const processResponse = (moduleWiseContentCount, moduleWiseCompletionDetails) => {
	try {
		// iterate through the moduleCompletionDetails and store the completion details in a map
		let moduleWiseCompletionCount = {};
		let moduleWiseCompletionPercentage = {};
		moduleWiseCompletionDetails.forEach((completionDetail) => {
			if (moduleWiseCompletionCount[completionDetail[MODULE_ID]]) {
				moduleWiseCompletionCount[completionDetail[MODULE_ID]]++;
			} else {
				moduleWiseCompletionCount[completionDetail[MODULE_ID]] = 1;
			}
		});
		// iterate through the content count and for each module, calculate the percentage(if the user has completed anything in it, else perc. is 0)
		moduleWiseContentCount.forEach((contentCount) => {
			moduleWiseCompletionCount[contentCount[MODULE_ID]]
				? (moduleWiseCompletionPercentage[contentCount[MODULE_ID]] = (
						(moduleWiseCompletionCount[contentCount[MODULE_ID]] /
							contentCount[TOTAL_VIDEO_AND_QUESTION_COUNT]) *
						100
				  ).toFixed(0))
				: (moduleWiseCompletionPercentage[contentCount[MODULE_ID]] = 0);
		});
		return moduleWiseCompletionPercentage;
	} catch (err) {
		throw err;
	}
};

/**
 * @author Lakshyajit Laxmikant <lakshyajit165@gmail.com>
 * @param { object } req
 * @param { object } res
 * computes the module wise completion details by calling the above methods
 */
const getAggregatedCompletionPercentageForModules = async (req, res) => {
	// extract email from token
	let token = req.headers["authorization"];
	let email = getEmailFromToken(token);
	if (!isNOTNULLEMPTYORUNDEFINED(email)) {
		console.error("Error extraction email from token");
		return res.status(500).send({ errorMessage: "Error extracting email from token" });
	}
	try {
		apiGet("/isSubscribed", token)
			.then(async (Response) => {
				if (!isResStatusSubscribed(Response)) {
					return res.status(401).send({ errorMessage: "Unauthorized Request" });
				}
				let moduleWiseContentCountPromise = getModuleWiseContentCount();
				let moduleWiseCompletionDetailsPromise = getModuleWiseCompletionDetails(email);
				let [moduleWiseContentCount, moduleWiseCompletionDetails] = await Promise.all([
					moduleWiseContentCountPromise,
					moduleWiseCompletionDetailsPromise,
				]);
				return res.status(200).send({
					completionPercentages: processResponse(
						moduleWiseContentCount,
						moduleWiseCompletionDetails
					),
				});
			})
			.catch((err) => {
				console.error(`Error checking isSubscribed status: ${err}`);
				return res.status(500).send({
					errorMessage: err.message || "Error checking isSubscribed status",
				});
			});
	} catch (err) {
		console.error(`Error extracting module wise completion details: ${err}`);
		return res.status(500).send({
			errorMessage: "Error extracting module completion details",
		});
	}
};
// ----------------------------- END OF FLOW FOR AGGREGATED PERCENTAGE COMPLETION OF ALL MODULES -----------------------------------------------

// ----------------------------- START OF FLOW FOR COMPLETION DETAILS FOR A SPECIFIC MODULE ----------------------------------------------------
/**
 * @author Lakshyajit Laxmikant <lakshyajit165@gmail.com>
 * @param { string } email
 * @param { number } moduleId
 * Extracts module and topic wise completion data for a user
 */
const getModuleAndTopicCompletionDetails = async (email, moduleId) => {
	return new Promise(async (resolve, reject) => {
		try {
			let moduleAndTopicCompletionDetails = await getModuleAndTopicCompletionDetailsFromDB(
				email,
				moduleId
			);
			return resolve(moduleAndTopicCompletionDetails);
		} catch (err) {
			return reject(err);
		}
	});
};

/**
 * @author Lakshyajit Laxmikant <lakshyajit165@gmail.com>
 * @param { number } moduleId
 * extracts module and topicwise total content count(videos/assignment questions/homework questions)
 */
const getTopicwiseTotalContent = async (moduleId) => {
	return new Promise(async (resolve, reject) => {
		try {
			let topicwiseTotalContent = await getTopicwiseTotalContentFromDB(moduleId);
			return resolve(topicwiseTotalContent);
		} catch (err) {
			return reject(err);
		}
	});
};

/**
 * @author Lakshyajit Laxmikant <lakshyajit165@gmail.com>
 * @param { number } moduleId
 * extracts topic wise assignment+homeworks along with their respective question levels
 */
const getTotalQuestionCountWithLevels = async (moduleId) => {
	return new Promise(async (resolve, reject) => {
		try {
			let totalQuestionCountWithLevels = await getTotalQuestionCountWithLevelsFromDB(
				moduleId
			);
			return resolve(totalQuestionCountWithLevels);
		} catch (err) {
			return reject(err);
		}
	});
};

/**
 * @author Lakshyajit Laxmikant <lakshyajit165@gmail.com>
 * @param { array } moduleAndTopicCompletionDetails
 * @param { array } topicwiseTotalContent
 * @param { array } totalQuestionCountWithLevels
 * processes the response(for a specific module) from the data collected to be displayed as metrics on the client side
 */
const processCompletionDetailsForSpecificModule = (
	moduleAndTopicCompletionDetails,
	topicwiseTotalContent,
	totalQuestionCountWithLevels
) => {
	let moduleDetails = initializeModuleDetailFields();
	let topicWiseDetails = [];
	let processedValuesForTotalContent = processTotalItemsInModuleAndTopic(
		topicwiseTotalContent,
		moduleDetails,
		topicWiseDetails
	);
	moduleDetails = processedValuesForTotalContent.moduleDetails;
	topicWiseDetails = processedValuesForTotalContent.topicWiseDetails;
	totalQuestionCountWithLevels.forEach((qCount) => {
		qCount["levels"].forEach((level) => {
			moduleDetails[DIFFICULTY_LEVEL_AND_MODULEDETAILS_ATTRIBUTE_MAP.get(level)]++;
		});
	});
	let processedValuesForCompletedItems = processCompletedItemsInModuleAndTopic(
		moduleAndTopicCompletionDetails,
		moduleDetails,
		topicWiseDetails
	);
	moduleDetails = processedValuesForCompletedItems.moduleDetails;
	topicWiseDetails = processedValuesForCompletedItems.topicWiseDetails;
	let processedResponse = {};
	processedResponse["moduleDetails"] = moduleDetails;
	processedResponse["topicWiseDetails"] = topicWiseDetails;
	return processedResponse;
};

/**
 * @author Lakshyajit Laxmikant <lakshyajit165@gmail.com>
 * @param { object } req
 * @param { object } res
 * This functions extracts the moduleWise details by calling the above functions
 * */
const getCompletionDetailsForSpecificModule = async (req, res) => {
	// extract email from token and moduleId from URL param
	let token = req.headers["authorization"];
	let moduleId = req.params["moduleId"];
	try {
		let email = getEmailFromToken(token);
		if (!isNOTNULLEMPTYORUNDEFINED(email)) {
			console.error("Error extraction email from token");
			return res.status(500).send({ errorMessage: "Error extracting email from token" });
		}
		apiGet("/isSubscribed", token)
			.then(async (Response) => {
				if (!isResStatusSubscribed(Response)) {
					return res.status(401).send({ errorMessage: "Unauthorized Request" });
				}
				let moduleAndTopicCompletionDetailsPromise = getModuleAndTopicCompletionDetails(
					email,
					moduleId
				);
				let topicwiseTotalContentPromise = getTopicwiseTotalContent(moduleId);
				let totalQuestionCountWithLevelsPromise = getTotalQuestionCountWithLevels(moduleId);
				let [
					moduleAndTopicCompletionDetails,
					topicwiseTotalContent,
					totalQuestionCountWithLevels,
				] = await Promise.all([
					moduleAndTopicCompletionDetailsPromise,
					topicwiseTotalContentPromise,
					totalQuestionCountWithLevelsPromise,
				]);
				return res.status(200).send({
					data: processCompletionDetailsForSpecificModule(
						moduleAndTopicCompletionDetails,
						topicwiseTotalContent,
						totalQuestionCountWithLevels
					),
				});
			})
			.catch((err) => {
				console.error(`Error checking isSubscribed status: ${err}`);
				return res.status(500).send({
					errorMessage: err.message || "Error checking isSubscribed status",
				});
			});
	} catch (err) {
		console.error(`Error extracting completion details for module ${moduleId}: ${err}`);
		return res.status(500).send({
			errorMessage: "Error extracting module completion details",
		});
	}
};

/**
 * @author Lakshyajit Laxmikant <lakshyajit165@gmail.com>
 * initializes the module details fields
 */
const initializeModuleDetailFields = () => {
	let moduleDetails = {};
	moduleDetails[TOTAL_EASY_QUESTIONS] = 0;
	moduleDetails[TOTAL_MEDIUM_QUESTIONS] = 0;
	moduleDetails[TOTAL_HARD_QUESTIONS] = 0;
	moduleDetails[COMPLETED_EASY_QUESTIONS] = 0;
	moduleDetails[COMPLETED_MEDIUM_QUESTIONS] = 0;
	moduleDetails[COMPLETED_HARD_QUESTIONS] = 0;
	moduleDetails[COMPLETED_VIDEOS] = 0;
	moduleDetails[COMPLETED_QUESTIONS] = 0;
	return moduleDetails;
};

/**
 * @author Lakshyajit Laxmikant <lakshyajit165@gmail.com>
 * @param { array } topicwiseTotalContent
 * @param { object } moduleDetails
 * @param { array } topicWiseDetails
 * processes the total items in a module and topic
 */
const processTotalItemsInModuleAndTopic = (
	topicwiseTotalContent,
	moduleDetails,
	topicWiseDetails
) => {
	topicwiseTotalContent.forEach((topicContent) => {
		let topicDetail = {};
		topicDetail["completed_items"] = 0;
		moduleDetails[MODULE_ID] = topicContent[MODULE_ID];
		moduleDetails[TOTAL_VIDEOS] = moduleDetails[TOTAL_VIDEOS]
			? moduleDetails[TOTAL_VIDEOS] + parseInt(topicContent[VIDEOS], 10)
			: parseInt(topicContent[VIDEOS], 10);
		moduleDetails[TOTAL_ASSIGNMENT_QUESTIONS] = moduleDetails[TOTAL_ASSIGNMENT_QUESTIONS]
			? moduleDetails[TOTAL_ASSIGNMENT_QUESTIONS] +
			  parseInt(topicContent[ASSIGNMENT_QUESTIONS], 10)
			: parseInt(topicContent[ASSIGNMENT_QUESTIONS], 10);
		moduleDetails[TOTAL_HOMEWORK_QUESTIONS] = moduleDetails[TOTAL_HOMEWORK_QUESTIONS]
			? moduleDetails[TOTAL_HOMEWORK_QUESTIONS] +
			  parseInt(topicContent[HOMEWORK_QUESTIONS], 10)
			: parseInt(topicContent[HOMEWORK_QUESTIONS], 10);

		topicDetail[TOPIC_ID] = topicContent[TOPIC_ID];
		topicDetail[TOTAL_VIDEOS] = parseInt(topicContent[VIDEOS], 10);
		topicDetail[TOTAL_ASSIGNMENT_QUESTIONS] = parseInt(topicContent[ASSIGNMENT_QUESTIONS], 10);
		topicDetail[TOTAL_HOMEWORK_QUESTIONS] = parseInt(topicContent[HOMEWORK_QUESTIONS], 10);
		topicWiseDetails.push(topicDetail);
	});
	return { moduleDetails, topicWiseDetails };
};

/**
 * @author Lakshyajit Laxmikant <lakshyajit165@gmail.com>
 * @param { array } moduleAndTopicCompletionDetails
 * @param { object } moduleDetails
 * @param { array } topicWiseDetails
 * processes the completed items in a module and topic
 */
const processCompletedItemsInModuleAndTopic = (
	moduleAndTopicCompletionDetails,
	moduleDetails,
	topicWiseDetails
) => {
	moduleAndTopicCompletionDetails.forEach((mtc) => {
		// inc topic completed items
		let topicDetailIndex = topicWiseDetails.findIndex((obj) => obj[TOPIC_ID] === mtc[TOPIC_ID]);
		topicWiseDetails[topicDetailIndex]["completed_items"]++;
		// inc. module attributes
		if (mtc["type"] === CONTENT_TYPE.VIDEO) {
			// inc. module completed videos
			moduleDetails[COMPLETED_VIDEOS]++;
		} else if (mtc["type"] === CONTENT_TYPE.QUESTION) {
			// inc module easy/med/hard completed questions
			moduleDetails[COMPLETED_QUESTIONS]++;
			if (mtc["level"] === DIFFICULTY_LEVELS.EASY) {
				moduleDetails[COMPLETED_EASY_QUESTIONS]++;
			} else if (mtc["level"] === DIFFICULTY_LEVELS.MEDIUM) {
				moduleDetails[COMPLETED_MEDIUM_QUESTIONS]++;
			} else if (mtc["level"] === DIFFICULTY_LEVELS.HARD) {
				moduleDetails[COMPLETED_HARD_QUESTIONS]++;
			}
		}
	});
	return {
		moduleDetails,
		topicWiseDetails,
	};
};

// ----------------------------- START OF FLOW FOR TOPIC PROGRESS SUMMARY ----------------------------------------------------

const filterDataToShowTopicProgressForFreeTrialUsers = (topicProgressData) => {
	let filteredTopicProgressData = topicProgressData.filter((subtopicData) => {
		if (subtopicData.subtopic_available_for_free_trial_user) {
			return subtopicData;
		}
	});
	return filteredTopicProgressData;
};

//there are 2 flag_Ids => marked as done and marked for revision (date => when user has updated the flags)
// one with no bookmark (flag_id = null) and date = null
// this function sorting the date =>  marked as done and marked as revision sorted by date in desc order and then no bookmark(null date) in the last
const sortingDateInDescOrder = (topicProgressData) => {
	topicProgressData.sort((subtopicDataOne, subtopicDataTwo) => {
		// if both date is null then it will not change
		if (!subtopicDataOne.date && !subtopicDataTwo.date) {
			return -1;
			// if first date is null then it should interchange with the second one(not null)
		} else if (!subtopicDataOne.date) {
			return 1;
			// if second date is null then it will not change
		} else if (!subtopicDataTwo.date) {
			return -1;
			// if both date is not null then it will sort in desc order
		} else return subtopicDataOne.date > subtopicDataTwo.date ? -1 : 1;
	});
	return topicProgressData;
};

/**
 * @author Namrata Pagare <namrata.pagare123@gmail.com>
 * @param { object } req
 * @param { object } res
 * This function extracts the details of user by calling the DBAccessor method
 */
const getTopicProgressDetails = async (req, res) => {
	let topicId = req.params["topicId"];
	let token = req.headers["authorization"];
	let email = getEmailFromToken(token);
	if (!isNOTNULLEMPTYORUNDEFINED(email)) {
		console.error("Error extraction email from token");
		return res.status(500).send({ errorMessage: "Error extracting email from token" });
	}
	apiGet("/isSubscribed", token)
		.then(async (Response) => {
			if (!isResStatusSubscribed(Response)) {
				return res.status(401).send({ errorMessage: "Unauthorized Request" });
			}
			try {
				let getTopicQueryRes = await getTopicProgressSummaryFromDB(topicId, email);
				getTopicQueryRes = sortingDateInDescOrder(getTopicQueryRes);
				if (isUserOnTrial(Response)) {
					getTopicQueryRes =
						filterDataToShowTopicProgressForFreeTrialUsers(getTopicQueryRes);
				}
				return res.status(200).send({
					message: "Successfully fetched user details",
					data: getTopicQueryRes,
				});
			} catch (err) {
				console.error(
					`Response from /getTopicProgressDetails API for topic ${topicId}: ${err}`
				);
				return res.status(500).send({
					errorMessage: "Error in extracting user details",
				});
			}
		})
		.catch((error) => {
			return res.status(500).send({
				errorMessage: error,
			});
		});
};

module.exports = {
	getAggregatedCompletionPercentageForModules,
	getCompletionDetailsForSpecificModule,
	getTopicProgressDetails,
};
