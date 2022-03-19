const URIS = {
	UPSERT_GOAL: "/upsertGoal",
	GET_LEARNING_ACTIVITY_FOR_GIVEN_INTERVAL: "/getLearningActivityForGivenInterval",
	GET_GOALS_FOR_GIVEN_INTERVAL: "/getGoalsForGivenInterval",
	GET_STREAKS: "/getStreaks",
};
Object.freeze(URIS);

const GOAL_TYPE = {
	VIDEO_GOAL: "video_goal",
	PROBLEM_GOAL: "problem_goal",
};
Object.freeze(GOAL_TYPE);

const MAX_GOAL_PROBLEMS = 20;
const MAX_GOAL_VIDEOS = 10;

module.exports = {
	URIS,
	GOAL_TYPE,
	MAX_GOAL_PROBLEMS,
	MAX_GOAL_VIDEOS,
};
