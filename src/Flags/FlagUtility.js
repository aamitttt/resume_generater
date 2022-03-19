const {
	isNOTNULLEMPTYORUNDEFINED,
	reviseError,
	isResStatusSubscribed,
	isUserOnTrial,
	getEmailFromToken,
} = require("../Common/Utility");
const { graphql, formatError } = require("graphql");
const { schema, root } = require("./GraphqlUtility");
const { apiGet } = require("../../WebApiManager");
const { upsertFlag, findAllFlags } = require("./DBAccessor");
const { EMAIL_REGEX } = require("../../constant");

/*  
    Method: update user flags on videos or questions
   * Request body contains all fields in data object:-
    @params {number} subtopicOrQuestionId 
    @params {String} type ---> only two types are valid 'video' and 'question'
    @params {number} flag_id ---> Id of particular flag
   * Header contains:-
    @params {string} authorization - authorization token of user
*/



const updateFlags = async (req, res) => {
	let token = req.headers["authorization"];
	let email = getEmailFromToken(token);
	let isValid = EMAIL_REGEX.test(String(email).toLowerCase());
	if (!isValid) {
		console.log("Invalid email", { email: email + " is invalid" });
		return res.status(401).send({ errorMessage: "Invalid Email" });
	}
	apiGet("/isSubscribed", token)
		.then(async (Response) => {
			if (!isResStatusSubscribed(Response)) {
				console.log("Response from /updateFlags API: User has not subscribed yet");
				return res.status(401).send({ errorMessage: "Unauthorized Request" });
			}
			await upsertFlag(req.body, email);
			return res.status(200).send({ message: "Successfully updated flag details" });
		})
		.catch((error) => {
			let [errorStatusCode, errorMessage] = reviseError(error);
			console.log(`Response from /updateFlags API: ${errorMessage}`);
			return res.status(errorStatusCode).send({ errorMessage: errorMessage });
		});
};
/*  
    Method: get user flags on videos or questions
    * Request query params contains all fields:-
    @params {number} subtopicOrQuestionId 
    @params {String} type ---> only two types are valid 'video' and 'question'
    * Header contains:-
    @params {string} authorization - authorization token of user
*/







const getFlags = async (req, res) => {
	let token = req.headers["authorization"];
	let flagDetails;
	let email = getEmailFromToken(token);
	let isValid = EMAIL_REGEX.test(String(email).toLowerCase());
	if (!isValid) {
		console.log("Invalid email", { email: email + " is invalid" });
		return res.status(401).send({ errorMessage: "Invalid Email" });
	}
	apiGet("/isSubscribed", token)
		.then(async (Response) => {
			if (!isResStatusSubscribed(Response)) {
				console.log("Response from /getFlags API: User has not subscribed yet");
				return res.status(401).send({ errorMessage: "Unauthorized Request" });
			}
			flagDetails = await findAllFlags(req.body.data, email);
			return res
				.status(200)
				.send({ message: "Successfully fetched user flag details", data: flagDetails });
		})
		.catch((error) => {
			let [errorStatusCode, errorMessage] = reviseError(error);
			console.log(`Response from /updateFlags API: ${errorMessage}`);
			return res.status(errorStatusCode).send({ errorMessage: errorMessage });
		});
};

/*  
    Method: This api is for learning library which filter resources based on flags, topics and modules
   * Request body contains all fields :-
    @params {String} query ---> Graphql Query
    @params {Object} variables ---> may be present in body if query required some variables
   * Header contains:-
    @params {string} authorization - authorization token of user
*/
const filterResourcesByFlags = async (req, res) => {
	let query = req.body.query;
	let token = req.headers["authorization"];
	let variables = {};
	let email = getEmailFromToken(token);
	let isValid = EMAIL_REGEX.test(String(email).toLowerCase());
	if (!isValid) {
		console.log("Invalid email", { email: email + " is invalid" });
		return res.status(401).send({ errorMessage: "Invalid Email" });
	}
	if (isNOTNULLEMPTYORUNDEFINED(req.body.variables)) {
		variables = req.body.variables;
	}
	apiGet("/isSubscribed", token)
		.then(async (Response) => {
			if (!isResStatusSubscribed(Response)) {
				console.log(
					"Response from /filterResourcesByFlags API: User has not subscribed yet"
				);
				return res.status(401).send({ errorMessage: "Unauthorized Request" });
			}
			variables.email = email;
			/*https://graphql.org/graphql-js/
        schema --> contain structure of queries and return format
        query --> request query
        root --> resolver functions for queries
        variables --> parameters for resolver functions*/
			result = await graphql(schema, query, root, null, variables);
			if (result.errors) {
				//https://graphql.org/graphql-js/error/#formaterror
				let error = formatError(result.errors[0]);
				console.log(`Response from /filterResourcesByFlags API: ${error}`);
				return res.status(400).send(error);
			}
			return res.status(200).send(result);
		})
		.catch((error) => {
			let [errorStatusCode, errorMessage] = reviseError(error);
			console.log(`Response from /filterResourcesByFlags API: ${errorMessage}`);
			return res.status(errorStatusCode).send({ errorMessage: errorMessage });
		});
};

module.exports = {
	updateFlags,
	filterResourcesByFlags,getFlags,
	
};
