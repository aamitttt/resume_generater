const { isNOTNULLEMPTYORUNDEFINED, getEmailFromToken } = require("../Common/Utility");
const { GOAL_TYPE, MAX_GOAL_PROBLEMS, MAX_GOAL_VIDEOS } = require("../Goals/GoalConstant");
const { FLAG_TYPE } = require("../Flags/FlagConstant");
const { EMAIL_REGEX } = require("../../constant");

function getNumberOfDaysInGivenInterval(startDate, endDate) {
	var timeDifference = endDate.getTime() - startDate.getTime();
	if (timeDifference < 0) return 0;
	var numberOfDays = parseInt(timeDifference / (1000 * 3600 * 24) + 1);
	return numberOfDays;
}

const isEmailValid = (req, res, next) => {
	let token = req.headers["authorization"];
	if (isNOTNULLEMPTYORUNDEFINED(token)) {
		let email = getEmailFromToken(token);
		let isValid = EMAIL_REGEX.test(String(email).toLowerCase());
		if (isValid) next();
		else {
			console.log("Invalid Email", { email: email + " is invalid" });
			return res.status(400).send({ errorMessage: "Invalid Email" });
		}
	} else {
		console.log("Invalid Token", { token: token + " is invalid" });
		return res.status(400).send({ errorMessage: "Invalid Token" });
	}
};
const isValidToken = (req, res, next) => {
	let token = req.headers["authorization"];
	if (isNOTNULLEMPTYORUNDEFINED(token)) {
		next();
	} else {
		console.log("Invalid Token", { token: token + " is invalid" });
		return res.status(400).send({ errorMessage: "Invalid Token" });
	}
};

const isGoalTypeValid = (req, res, next) => {
	if (
		req.body &&
		isNOTNULLEMPTYORUNDEFINED(req.body.goalType) &&
		(req.body.goalType == GOAL_TYPE.VIDEO_GOAL || req.body.goalType == GOAL_TYPE.PROBLEM_GOAL)
	) {
		next();
	} else {
		console.log("Invalid goal type", { type: "Goal Type is invalid" });
		return res.status(400).send({ errorMessage: "Invalid Goal Type" });
	}
};

const isFlagTypeValid = (req, res, next) => {
	if (
		req.body &&
		isNOTNULLEMPTYORUNDEFINED(req.body.flagType) &&
		(req.body.flagType == FLAG_TYPE.QUESTION || req.body.flagType == FLAG_TYPE.VIDEO)
	) {
		next();
	} else {
		console.log("Invalid flag type", { type: "Flag Type is invalid" });
		return res.status(400).send({ errorMessage: "Invalid Flag Type" });
	}
};

const isIntervalValid = (req, res, next) => {
	if (
		!isNOTNULLEMPTYORUNDEFINED(req.body.startDate) ||
		!isNOTNULLEMPTYORUNDEFINED(req.body.endDate)
	) {
		console.log("Invalid time interval", {
			startDate: req.body.startDate,
			endDate: req.body.endDate,
		});
		return res.status(400).send({ errorMessage: "Invalid time interval" });
	}
	let date = new Date();
	let startDate = new Date(req.body.startDate);
	let endDate = new Date(req.body.endDate);
	var numberOfDays = getNumberOfDaysInGivenInterval(startDate, endDate);
	if (numberOfDays <= 0 || numberOfDays > 31 || endDate > date) {
		console.log("Invalid time interval", { startDate: startDate, endDate: endDate });
		return res.status(400).send({ errorMessage: "Invalid time interval" });
	} else {
		next();
	}
};

const isExtendedIntervalValid = (req, res, next) => {
	if (
		!isNOTNULLEMPTYORUNDEFINED(req.body.startDate) ||
		!isNOTNULLEMPTYORUNDEFINED(req.body.endDate)
	) {
		console.log("Invalid time interval", {
			startDate: req.body.startDate,
			endDate: req.body.endDate,
		});
		return res.status(400).send({ errorMessage: "Invalid time interval" });
	}
	let date = new Date();
	date.setDate(date.getDate() + 1);
	let startDate = new Date(req.body.startDate);
	let endDate = new Date(req.body.endDate);
	var numberOfDays = getNumberOfDaysInGivenInterval(startDate, endDate);
	if (numberOfDays <= 0 || numberOfDays > 32 || endDate > date) {
		console.log("Invalid time interval", { startDate: startDate, endDate: endDate });
		return res.status(400).send({ errorMessage: "Invalid time interval" });
	} else {
		next();
	}
};

const isGoalVideosAndProblemsValid = (req, res, next) => {
	let goalVideos = req.body.goalVideos;
	let goalProblems = req.body.goalProblems;
	if (
		!isNOTNULLEMPTYORUNDEFINED(goalVideos) ||
		goalVideos > MAX_GOAL_VIDEOS ||
		!isNOTNULLEMPTYORUNDEFINED(goalProblems) ||
		goalProblems > MAX_GOAL_PROBLEMS
	) {
		console.log("Invalid goalVideos or goalProblems", {
			goalVideos: goalVideos,
			goalProblems: goalProblems + " is invalid",
		});
		return res.status(400).send({ errorMessage: "Invalid goalVideos or goalProblems" });
	} else {
		next();
	}
};

const isSubtopicOrQuestionIdInBodyValid = (req, res, next) => {
	if (req.body.data && isNOTNULLEMPTYORUNDEFINED(req.body.data.subtopicOrQuestionId)) {
		next();
	} else {
		console.log("Invalid subtopic or question id", {
			subtopicOrQuestionId: "subtopic or question id is invalid",
		});
		return res.status(400).send({ errorMessage: "Invalid subtopic or question id" });
	}
};

const isFlagIdInBodyValid = (req, res, next) => {
	if (req.body.data && isNOTNULLEMPTYORUNDEFINED(req.body.data.flag_id)) {
		next();
	} else {
		console.log("Invalid flag type", { flag_id: "Flag Id is invalid" });
		return res.status(400).send({ errorMessage: "Invalid Flag Id" });
	}
};

const isTypeInBodyValid = (req, res, next) => {
	if (req.body.data && isNOTNULLEMPTYORUNDEFINED(req.body.data.type)) {
		next();
	} else {
		console.log("Invalid flag type", { type: "Flag Type is invalid" });
		return res.status(400).send({ errorMessage: "Invalid Flag Type" });
	}
};

const isQueryInBodyValid = (req, res, next) => {
	if (req.body && isNOTNULLEMPTYORUNDEFINED(req.body.query)) {
		next();
	} else {
		console.log("Invalid query In Body", { query: "Query is invalid" });
		return res.status(400).send({ errorMessage: "Invalid query" });
	}
};

const isValidTopicId = (req, res, next) => {
	if (!isNOTNULLEMPTYORUNDEFINED(req.params["topicId"]))
		return res.status(400).send({ errorMessage: "Invalid topic id!" });
	next();
};

const isValidModuleId = (req, res, next) => {
	if (!isNOTNULLEMPTYORUNDEFINED(req.params["moduleId"]))
		return res.status(400).send({ errorMessage: "Invalid module id!" });
	next();
};

module.exports = {
	isValidToken,
	isFlagIdInBodyValid,
	isTypeInBodyValid,
	isSubtopicOrQuestionIdInBodyValid,
	isQueryInBodyValid,
	isEmailValid,
	isGoalTypeValid,
	isFlagTypeValid,
	isIntervalValid,
	isGoalVideosAndProblemsValid,
	isExtendedIntervalValid,
	isValidTopicId,
	isValidModuleId,
};
