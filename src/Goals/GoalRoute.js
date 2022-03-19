const express = require("express");
const {
	upsertGoal,
	getLearningActivityForGivenInterval,
	getGoalsForGivenInterval,
	getStreaks,
} = require("./GoalUtility");
const { URIS } = require("./GoalConstant");
const {
	isEmailValid,
	isGoalTypeValid,
	isExtendedIntervalValid,
	isIntervalValid,
	isGoalVideosAndProblemsValid,
	isFlagTypeValid,
} = require("../MiddleWares/Validations");
const router = express.Router();

router.post(URIS.UPSERT_GOAL, [isEmailValid, isGoalVideosAndProblemsValid], upsertGoal);
router.post(
	URIS.GET_LEARNING_ACTIVITY_FOR_GIVEN_INTERVAL,
	[isEmailValid, isExtendedIntervalValid, isFlagTypeValid],
	getLearningActivityForGivenInterval
);
router.post(
	URIS.GET_GOALS_FOR_GIVEN_INTERVAL,
	[isEmailValid, isIntervalValid, isGoalTypeValid],
	getGoalsForGivenInterval
);
router.get(URIS.GET_STREAKS, [isEmailValid], getStreaks);
module.exports = router;
