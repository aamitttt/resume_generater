const models = require("../Models/Index");
const sequelizeInstance = models.sequelizeInstance;
const { FLAG_TYPE } = require("../Flags/FlagConstant");
const upsertVideoGoal = async (email, goalVideos) => {
	let date = new Date().toUTCString();
	return sequelizeInstance.query(
		`
    INSERT INTO USER_VIDEO_GOALS_TRACKER 
    (EMAIL,DATE,GOAL_VIDEOS) 
    VALUES($1,$2,$3)
    ON CONFLICT(EMAIL,DATE)
    DO UPDATE SET GOAL_VIDEOS=$3
    `,
		{ bind: [email, date, goalVideos] }
	);
};

const upsertProblemGoal = async (email, goalProblems) => {
	let date = new Date().toUTCString();
	return sequelizeInstance.query(
		`
    INSERT INTO USER_PROBLEM_GOALS_TRACKER
    (EMAIL,DATE,GOAL_PROBLEMS) 
    VALUES($1,$2,$3)  
    ON CONFLICT(EMAIL,DATE) 
    DO UPDATE SET GOAL_PROBLEMS=$3
    `,
		{ bind: [email, date, goalProblems] }
	);
};

const getProblemsSolvedOrVideosWatchedForGivenInterval = async (
	email,
	startDate,
	endDate,
	flagType
) => {
	return sequelizeInstance.query(
		`
    SELECT TO_CHAR(DATE,'YYYY-MM-DD') AS DATE ,COUNT(*) AS TOTAL_WORK 
    FROM FLAG_DETAILS 
    WHERE EMAIL=$1 AND DATE>=$2 AND DATE<$3 AND FLAG_ID=$4 AND IS_PRESENT=$5 AND TYPE= $6 
    GROUP BY TO_CHAR(DATE,'YYYY-MM-DD') 
    ORDER BY TO_CHAR(DATE,'YYYY-MM-DD')
    `,
		{ bind: [email, startDate, endDate, 1, true, flagType] }
	);
};

const getProblemGoalsForGivenInterval = async (email, startDate, endDate) => {
	return sequelizeInstance.query(
		`
    SELECT TO_CHAR(DATE,'YYYY-MM-DD') AS DATE, GOAL_PROBLEMS AS GOAL 
    FROM USER_PROBLEM_GOALS_TRACKER 
    WHERE EMAIL = $1 
    AND (DATE = (SELECT MAX(DATE) FROM USER_PROBLEM_GOALS_TRACKER WHERE EMAIL = $1 AND DATE<=$2) 
    OR (DATE > $2 AND DATE<=$3)) 
    ORDER BY DATE
    `,
		{ bind: [email, startDate, endDate] }
	);
};

const getVideoGoalsForGivenInterval = async (email, startDate, endDate) => {
	return sequelizeInstance.query(
		`
    SELECT TO_CHAR(DATE,'YYYY-MM-DD') AS DATE, GOAL_VIDEOS AS GOAL 
    FROM USER_VIDEO_GOALS_TRACKER 
    WHERE EMAIL = $1 
    AND (DATE = (SELECT MAX(DATE) FROM USER_VIDEO_GOALS_TRACKER WHERE EMAIL = $1 AND DATE<=$2) 
    OR (DATE > $2 AND DATE<=$3)) 
    ORDER BY DATE
    `,
		{ bind: [email, startDate, endDate] }
	);
};

module.exports = {
	upsertVideoGoal,
	upsertProblemGoal,
	getProblemsSolvedOrVideosWatchedForGivenInterval,
	getProblemGoalsForGivenInterval,
	getVideoGoalsForGivenInterval,
};
