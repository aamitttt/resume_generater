const moment = require("moment");
const { isResStatusSubscribed, isUserOnTrial, getEmailFromToken } = require("../Common/Utility");
const { apiGet } = require("./../WebApiManager");
const {
	upsertVideoGoal,
	upsertProblemGoal,
	getProblemsSolvedOrVideosWatchedForGivenInterval,
	getProblemGoalsForGivenInterval,
	getVideoGoalsForGivenInterval,
} = require("./DBAccessor");
const { GOAL_TYPE } = require("./GoalConstant");
const { FLAG_TYPE } = require("../Flags/FlagConstant");

getVideoOrProblemGoals = async (goalType, email, startDate, endDate) => {
	let goals;
	if (goalType == GOAL_TYPE.PROBLEM_GOAL) {
		goals = await getProblemGoalsForGivenInterval(email, startDate, endDate);
	} else {
		goals = await getVideoGoalsForGivenInterval(email, startDate, endDate);
	}
	return goals;
};

getDateWiseVideoOrProblemGoals = async (goalType, email, startDate, endDate) => {
	let goals = await getVideoOrProblemGoals(goalType, email, startDate, endDate);
	var dateWiseVideoOrProblemGoal = new Map();
	// setting the goals for all the dates in the interval between goal setting dates
	goals[0].forEach((videoOrProblemGoal, index) => {
		var currentGoalSettingDate = new Date(videoOrProblemGoal.date);
		var nextGoalSettingDate =
			index == goals[0].length - 1 ? endDate : new Date(goals[0][index + 1].date);
		for (
			let currentDate = new Date(
				Math.max(currentGoalSettingDate.getTime(), startDate.getTime())
			);
			currentDate <= nextGoalSettingDate;
			currentDate.setDate(currentDate.getDate() + 1)
		) {
			dateWiseVideoOrProblemGoal.set(
				moment(currentDate).format("YYYY-MM-DD"),
				videoOrProblemGoal.goal
			);
		}
	});
	return dateWiseVideoOrProblemGoal;
};

getDateWiseProblemsOrVideosMapping = async (email, startDate, endDate, flagType) => {
	let problemsSolvedOrVideosWatched = await getProblemsSolvedOrVideosWatchedForGivenInterval(
		email,
		startDate,
		endDate,
		flagType
	);
	let problemsSolvedOrVideosWatchedMapping = new Map();
	//mapping the date to no. of problems solved or videos watched
	problemsSolvedOrVideosWatched[0].forEach((currentProblemSolvedOrVideoWatched) => {
		problemsSolvedOrVideosWatchedMapping.set(
			currentProblemSolvedOrVideoWatched.date,
			parseInt(currentProblemSolvedOrVideoWatched.total_work)
		);
	});
	return problemsSolvedOrVideosWatchedMapping;
};

function getCurrentAndBestStreak(
	dateWiseVideoGoals,
	dateWiseProblemGoals,
	dateWiseVideosWatched,
	dateWiseProblemsSolved
) {
	let currentStreak = 0,
		bestStreak = 0,
		presentStreak = 0,
		problemsGoal = 0,
		videosGoal = 0,
		videoGoalsIndex = -1,
		problemGoalsIndex = -1,
		problemsSolvedIndex = 0,
		previousGoalAchievedDate = new Date(0),
		currentDate = new Date(new Date().setUTCHours(0, 0, 0, 0));
	while (
		videoGoalsIndex < dateWiseVideoGoals.length &&
		problemGoalsIndex < dateWiseProblemGoals.length &&
		problemsSolvedIndex < dateWiseProblemsSolved.length
	) {
		//increment the position of problemgoal pointer if the next goal setting date is less than or equal to date of problem solving
		if (
			problemGoalsIndex < dateWiseProblemGoals.length - 1 &&
			new Date(dateWiseProblemGoals[problemGoalsIndex + 1]["date"]) <=
				new Date(dateWiseProblemsSolved[problemsSolvedIndex]["date"])
		) {
			problemsGoal = dateWiseProblemGoals[problemGoalsIndex + 1]["goal"];
			problemGoalsIndex += 1;
			continue;
		}
		//increment the position of videogoal pointer if the next goal setting date is less than or equal to date of problem solving
		if (
			videoGoalsIndex < dateWiseVideoGoals.length - 1 &&
			new Date(dateWiseVideoGoals[videoGoalsIndex + 1]["date"]) <=
				new Date(dateWiseProblemsSolved[problemsSolvedIndex]["date"])
		) {
			videosGoal = dateWiseVideoGoals[videoGoalsIndex + 1]["goal"];
			videoGoalsIndex += 1;
			continue;
		}
		//knowing the video and problem goal at the date of problem solving , check if goals are lesser or equal to their respective work done
		if (
			problemsGoal &&
			videosGoal &&
			parseInt(dateWiseProblemsSolved[problemsSolvedIndex]["total_work"]) >= problemsGoal &&
			videosGoal <=
				dateWiseVideosWatched.get(dateWiseProblemsSolved[problemsSolvedIndex]["date"])
		) {
			previousGoalAchievedDate.setDate(previousGoalAchievedDate.getDate() + 1);
			if (
				previousGoalAchievedDate.getTime() ==
				new Date(dateWiseProblemsSolved[problemsSolvedIndex]["date"]).getTime()
			) {
				currentStreak += 1;
				bestStreak = Math.max(currentStreak, bestStreak);
			} else {
				currentStreak = 1;
				bestStreak = Math.max(currentStreak, bestStreak);
				previousGoalAchievedDate = new Date(
					dateWiseProblemsSolved[problemsSolvedIndex]["date"]
				);
			}
		} else {
			currentStreak = 0;
		}
		problemsSolvedIndex += 1;
	}
	//present streak would be the last set current streak if the last date of problem solving (i.e  last date for evaluating streak ) is same as date of checking streak
	if (
		dateWiseProblemsSolved.length &&
		currentDate.getTime() ==
			new Date(dateWiseProblemsSolved[dateWiseProblemsSolved.length - 1]["date"]).getTime()
	) {
		presentStreak = currentStreak;
	}
	return { currentStreak: presentStreak, bestStreak: bestStreak };
}

/*  
    Method: update user videos and questions goal
   * Request body contains all fields in data object:-
    @params {number} goalVideos
    @params {number} goalProblems
   * Header contains:-
    @params {string} authorization - authorization token of user
*/
const upsertGoal = async (req, res) => {
	try {
		let token = req.headers["authorization"];
		let email = getEmailFromToken(token);
		apiGet("/isSubscribed", token)
			.then(async (Response) => {
				if (!isResStatusSubscribed(Response)) {
					console.log("Response from /upsertGoal API: Unauthorized Request");
					return res.status(401).send({ errorMessage: "Unauthorized Request" });
				}
				await Promise.all([
					upsertVideoGoal(email, req.body.goalVideos),
					upsertProblemGoal(email, req.body.goalProblems),
				]);
				return res
					.status(200)
					.send({ message: "User Video and Problem Goal Updated Successfully" });
			})
			.catch((Reserr) => {
				console.log("Error authorizing in /upsertGoal: ", Reserr);
				return res
					.status(500)
					.send({ errorMessage: "Internal Server Error. " + Reserr.message });
			});
	} catch (e) {
		console.log("Response from /upsertGoal API: ", {
			errorMessage: "Internal Server Error. " + e.message,
		});
		return res.status(500).send({ errorMessage: "Internal Server Error. " + e.message });
	}
};

/*  
    Method: get total problems solved(non-zero) or total videos watched(non-zero) on days in a given interval
   * Request body contains all fields in data object:-
    @params {string} startDate
    @params {string} endDate
   * Header contains:-
    @params {string} authorization - authorization token of user
*/
const getLearningActivityForGivenInterval = async (req, res) => {
	try {
		let token = req.headers["authorization"];
		let email = getEmailFromToken(token);
		apiGet("/isSubscribed", token)
			.then(async (Response) => {
				if (!isResStatusSubscribed(Response)) {
					console.log(
						"Response from /getLearningActivityForGivenInterval API: Unauthorized Request"
					);
					return res.status(401).send({ errorMessage: "Unauthorized Request" });
				}
				let startDate = new Date(req.body.startDate);
				let endDate = new Date(req.body.endDate);
				var dateWiseProblemsOrVideosMapping = await getDateWiseProblemsOrVideosMapping(
					email,
					startDate,
					endDate,
					req.body.flagType
				);
				return res
					.status(200)
					.send({ Response: Object.fromEntries(dateWiseProblemsOrVideosMapping) });
			})
			.catch((Reserr) => {
				console.log("Error authorizing in /getLearningActivityForGivenInterval: ", Reserr);
				return res
					.status(500)
					.send({ errorMessage: "Internal Server Error. " + Reserr.message });
			});
	} catch (e) {
		console.log("Response from /getLearningActivityForGivenInterval API: ", {
			errorMessage: "Internal Server Error. " + e.message,
		});
		return res.status(500).send({ errorMessage: "Internal Server Error. " + e.message });
	}
};
/*  
    Method: get videos goal or problems goal for days in a given interval
   * Request body contains all fields in data object:-
    @params {string} startDate
    @params {string} endDate
    @params {string} goalType - two valid values : video_goal , problem_goal
   * Header contains:-
    @params {string} authorization - authorization token of user
*/
const getGoalsForGivenInterval = async (req, res) => {
	try {
		let token = req.headers["authorization"];
		let email = getEmailFromToken(token);
		apiGet("/isSubscribed", token)
			.then(async (Response) => {
				if (!isResStatusSubscribed(Response)) {
					console.log(
						"Response from /getGoalsForGivenInterval API: Unauthorized Request"
					);
					return res.status(401).send({ errorMessage: "Unauthorized Request" });
				}
				let startDate = new Date(req.body.startDate);
				let endDate = new Date(req.body.endDate);
				var dateWiseVideoOrProblemGoals = await getDateWiseVideoOrProblemGoals(
					req.body.goalType,
					email,
					startDate,
					endDate
				);
				return res
					.status(200)
					.send({ Response: Object.fromEntries(dateWiseVideoOrProblemGoals) });
			})
			.catch((Reserr) => {
				console.log("Error authorizing in /getGoalsForGivenInterval: ", Reserr);
				return res
					.status(500)
					.send({ errorMessage: "Internal Server Error. " + Reserr.message });
			});
	} catch (e) {
		console.log("Response from /getGoalsForGivenInterval API: ", {
			errorMessage: "Internal Server Error. " + e.message,
		});
		return res.status(500).send({ errorMessage: "Internal Server Error. " + e.message });
	}
};
/* 
    Method: get current and best streak of continuous problems and video goal achieved days
   * Header contains:-
    @params {string} authorization - authorization token of user
*/
const getStreaks = async (req, res) => {
	try {
		let token = req.headers["authorization"];
		let email = getEmailFromToken(token);
		apiGet("/isSubscribed", token)
			.then(async (Response) => {
				if (!isResStatusSubscribed(Response)) {
					console.log("Response from /getStreaks API: Unauthorized Request");
					return res.status(401).send({ errorMessage: "Unauthorized Request" });
				}
				let startDate = new Date(0);
				let endDate = new Date();
				endDate.setDate(endDate.getDate() + 1);
				let [videoGoals, problemGoals, problemsSolved, videosWatched] = await Promise.all([
					getVideoGoalsForGivenInterval(email, startDate, endDate),
					getProblemGoalsForGivenInterval(email, startDate, endDate),
					getProblemsSolvedOrVideosWatchedForGivenInterval(
						email,
						startDate,
						endDate,
						FLAG_TYPE.QUESTION
					),
					getDateWiseProblemsOrVideosMapping(email, startDate, endDate, FLAG_TYPE.VIDEO),
				]);
				var currentAndBestStreak = getCurrentAndBestStreak(
					videoGoals[0],
					problemGoals[0],
					videosWatched,
					problemsSolved[0]
				);
				return res.status(200).send({ Response: currentAndBestStreak });
			})
			.catch((Reserr) => {
				console.log("Error authorizing in /getStreaks: ", Reserr);
				return res
					.status(500)
					.send({ errorMessage: "Internal Server Error. " + Reserr.message });
			});
	} catch (e) {
		console.log("Response from /getStreaks API: ", {
			errorMessage: "Internal Server Error. " + e.message,
		});
		return res.status(500).send({ errorMessage: "Internal Server Error. " + e.message });
	}
};

module.exports = {
	upsertGoal,
	getLearningActivityForGivenInterval,
	getGoalsForGivenInterval,
	getStreaks,
};
