const URIS = {
	UPDATE_FLAGS: "/updateFlags",
	GET_FLAGS: "/getFlags",
	FILTER_RESOURCES_BY_FLAGS: "/filterResourcesByFlags",
};
Object.freeze(URIS);

const FLAG_TYPE = {
	VIDEO: "video",
	QUESTION: "question",
};
Object.freeze(FLAG_TYPE);

const LIMIT = 10;

const UNWATCHED_FLAG = "0";

const QUES_LEVELS = ["Easy", "Medium", "Hard"];

module.exports = {
	URIS,
	LIMIT,
	UNWATCHED_FLAG,
	QUES_LEVELS,
	FLAG_TYPE,
};
