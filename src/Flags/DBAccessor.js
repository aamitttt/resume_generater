const models = require("../Models/Index");
models.sequelizeInstance.sync();
const { QueryTypes, Op } = require("sequelize");
const flag_details = models.flag_details;
const sequelizeInstance = models.sequelizeInstance;

const findAllFlags = async (data, email) => {
	return flag_details.findAll({
		where: {
			[Op.and]: [
				{ email: { [Op.eq]: email } },
				{ subtopicorquestionid: { [Op.eq]: data.subtopicOrQuestionId } },
				{ type: { [Op.eq]: data.type } },
				{ is_present: { [Op.eq]: true } },
			],
		},
	});
};

const upsertFlag = async (requestBody, email) => {
	let date = new Date().toUTCString();
	return sequelizeInstance.query(
		`
        INSERT INTO FLAG_DETAILS
        (EMAIL,FLAG_ID,SUBTOPICORQUESTIONID,TYPE,DATE,IS_PRESENT)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (EMAIL, FLAG_ID,SUBTOPICORQUESTIONID,TYPE)
        DO UPDATE SET IS_PRESENT = NOT FLAG_DETAILS.IS_PRESENT , DATE = $5
    `,
		{
			bind: [
				email,
				requestBody.data.flag_id,
				requestBody.data.subtopicOrQuestionId,
				requestBody.data.type,
				date,
				true,
			],
		}
	);
};

module.exports = {
	findAllFlags,
	upsertFlag,
};
