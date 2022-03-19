const { buildSchema } = require("graphql");
const { QueryTypes } = require("sequelize");
const models = require("../Models/Index");
const { LIMIT, UNWATCHED_FLAG, QUES_LEVELS } = require("./FlagConstant");
const sequelizeInstance = models.sequelizeInstance;

const schema = buildSchema(`
    type videoFlag {
        subtopic_id: Int
        name: String
        flags: [Int]
        topic_id : Int
        total_records: Int
    } 
    type questionFlag {
        question_id: Int
        name: String
        type_id: Int
        type: String
        subtopic_id : Int
        flags : [Int]
        topic_id : Int
        level: String
        total_records: String
    }
    type FullInfoByTopicId {
        videos: [Int]
        homeworks: [Int]
        assignments: [Int]
    }
    type RootQuery {
        findVideoInfoByTopicId(email: String,topic_ids: [Int],page: Int): [videoFlag]
        findVideoInfoByModuleId(email: String,module_ids:[Int],page: Int): [videoFlag]
        findVideoInfoByTopicAndFlagId(email:String,topic_ids:[Int],flag_ids:[Int],page:Int): [videoFlag]
        findVideoInfoByModuleAndFlagId(email:String,module_ids:[Int],flag_ids:[Int],page:Int): [videoFlag]
        findVideoInfoByFlags(email:String,flag_ids:[Int],page:Int): [videoFlag]
        findQuestionInfoByTopicId(email:String,topic_ids:[Int],page:Int,ques_levels:[String]): [questionFlag]
        findQuestionInfoByModuleId(email:String,module_ids:[Int],page:Int,ques_levels:[String]): [questionFlag]
        findQuestionInfoByTopicAndFlagId(email:String,topic_ids:[Int],page:Int,ques_levels:[String],flag_ids:[Int]): [questionFlag]
        findQuestionInfoByModuleAndFlagId(email:String,module_ids:[Int],page:Int,ques_levels:[String],flag_ids:[Int]): [questionFlag]
        findQuestionInfoByFlags(email:String,flag_ids:[Int],ques_levels:[String],page:Int): [questionFlag]
        findQuestionInfoByLevels(email:String,ques_levels:[String],page:Int): [questionFlag]
        findAllMarkedAsDoneByTopicId(email:String,topic_id:Int): FullInfoByTopicId
    }
    schema {
        query: RootQuery
    }
`);

// The root provides a resolver function for each API endpoint
const root = {
	findAllMarkedAsDoneByTopicId: async (args) => {
		let result = await sequelizeInstance.query(
			`
            with flagD as(
                SELECT *
                FROM flag_details
                WHERE email=$1 AND flag_id = 1 AND is_present
            ),
            subtopics as(
                SELECT *
                FROM subtopics
                WHERE topic_id = $2
            ),
            videos as (
                SELECT array_agg(DISTINCT subtopic_id) as videos
                FROM (SELECT DISTINCT subtopic_id as subtopic_id FROM subtopics)  as sub
                INNER JOIN  flagD
                ON flagD.type = 'video' AND flagD.subtopicorquestionid = sub.subtopic_id
            ),
            homeworks as (SELECT array_agg(DISTINCT homework_ques_done.homework_id) as homeworks
                FROM (
                    SELECT COUNT(*) as total_done,homework_question.homework_id
                    FROM homework_question
                    INNER JOIN (SELECT DISTINCT homework_id as homework_id FROM subtopics)  as arr
                    ON arr.homework_id=homework_question.homework_id
                    INNER JOIN flagD
                    ON flagD.type = 'question' AND flagD.subtopicorquestionid = homework_question.ques_id 
                    GROUP BY homework_question.homework_id ) as homework_ques_done
                    INNER JOIN  (
                        SELECT COUNT(*) as total_cnt,homework_question.homework_id
                        FROM homework_question
                        GROUP BY homework_question.homework_id) as homework_ques_total
                        ON homework_ques_total.homework_id = homework_ques_done.homework_id
                    WHERE homework_ques_total.total_cnt = homework_ques_done.total_done),
            assignments as (SELECT array_agg(DISTINCT assignment_ques_done.assignment_id) as assignments
                FROM (
                    SELECT COUNT(*) as total_done,assignment_question.assignment_id
                    FROM assignment_question
                    INNER JOIN (SELECT DISTINCT assignment_id as assignment_id FROM subtopics)  as arr
                    ON arr.assignment_id=assignment_question.assignment_id
                    INNER JOIN flagD
                    ON flagD.type = 'question' AND flagD.subtopicorquestionid = assignment_question.ques_id 
                    GROUP BY assignment_question.assignment_id ) as assignment_ques_done
                    INNER JOIN  (
                        SELECT COUNT(*) as total_cnt,assignment_question.assignment_id
                        FROM assignment_question
                        GROUP BY assignment_question.assignment_id) as assignment_ques_total
                        ON assignment_ques_total.assignment_id = assignment_ques_done.assignment_id
                    WHERE assignment_ques_total.total_cnt = assignment_ques_done.total_done)
            SELECT *
            FROM assignments,homeworks,videos`,
			{ bind: [args.email, args.topic_id], type: QueryTypes.SELECT }
		);
		return result[0];
	},
	findVideoInfoByModuleId: async (args) => {
		let skip = (args.page - 1) * LIMIT;
		let module_ids = args.module_ids.toString().split(",");
		let result = await sequelizeInstance.query(
			`SELECT subT.subtopic_id,subT.topic_id,(subT.subtopic_name) as name,array_agg(flagD.flag_id) as flags,COUNT(*) OVER() as total_records
            FROM  module_topics 
            INNER JOIN subtopics as subT
            ON module_topics.topic_id = subT.topic_id
            LEFT JOIN flag_details as flagD
            ON subT.subtopic_id = flagD.subtopicOrQuestionId AND flagD.email=:email AND flagD.Type='video' AND flagD.is_present
            WHERE  module_topics.module_id IN (:module_ids) AND (flagD.flag_id is NULL OR flagD.flag_id <> 1)
            GROUP BY subT.subtopic_id ,subT.topic_id 
            ORDER BY subT.subtopic_id LIMIT :limit OFFSET :skip;`,
			{
				replacements: {
					email: args.email,
					module_ids: module_ids,
					limit: LIMIT,
					skip: skip,
				},
				type: QueryTypes.SELECT,
			}
		);
		return result;
	},
	findVideoInfoByTopicId: async (args) => {
		let skip = (args.page - 1) * LIMIT;
		let topic_ids = args.topic_ids.toString().split(",");
		let result = await sequelizeInstance.query(
			`SELECT subT.subtopic_id,subT.topic_id,(subT.subtopic_name) as name,array_agg(flagD.flag_id) as flags, COUNT(*) OVER() as total_records
             FROM subtopics as subT
             LEFT JOIN flag_details as flagD
             ON subT.subtopic_id = flagD.subtopicOrQuestionId AND flagD.email=:email AND flagD.Type='video' AND flagD.is_present
             WHERE  subT.topic_id IN (:topic_ids) AND (flagD.flag_id is NULL OR flagD.flag_id <> 1 )
             GROUP BY subT.subtopic_id,subT.topic_id 
             ORDER BY subT.subtopic_id LIMIT :limit OFFSET :skip;`,
			{
				replacements: { email: args.email, topic_ids: topic_ids, limit: LIMIT, skip: skip },
				type: QueryTypes.SELECT,
			}
		);
		return result;
	},
	findVideoInfoByTopicAndFlagId: async (args) => {
		let skip = (args.page - 1) * LIMIT;
		let topic_ids = args.topic_ids.toString().split(",");
		let flag_ids = args.flag_ids.toString().split(",");
		let result;
		if (flag_ids.includes(UNWATCHED_FLAG)) {
			result = await sequelizeInstance.query(
				`SELECT subT.subtopic_id,subT.topic_id,(subT.subtopic_name) as name,array_agg(flagD.flag_id) as flags, COUNT(*) OVER() as total_records
                FROM subtopics as subT
                LEFT JOIN ( SELECT * FROM flag_details WHERE email=:email AND Type='video' AND flag_id IN ('1',:flag_ids) AND is_present) as flagD
                ON subT.subtopic_id = flagD.subtopicOrQuestionId  
                WHERE  subT.topic_id IN (:topic_ids) AND (flagD.flag_id IS NULL OR flagD.flag_id IN (:flag_ids)) 
                GROUP BY subT.subtopic_id,subT.topic_id 
                ORDER BY subT.subtopic_id LIMIT :limit OFFSET :skip;`,
				{
					replacements: {
						email: args.email,
						topic_ids: topic_ids,
						flag_ids: flag_ids,
						limit: LIMIT,
						skip: skip,
					},
					type: QueryTypes.SELECT,
				}
			);
		} else {
			result = await sequelizeInstance.query(
				`SELECT subT.subtopic_id,subT.topic_id,(subT.subtopic_name) as name,array_agg(flagD.flag_id) as flags, COUNT(*) OVER() as total_records
                FROM subtopics as subT
                INNER JOIN flag_details as flagD
                ON subT.subtopic_id = flagD.subtopicOrQuestionId AND flagD.email=:email AND flagD.Type='video' AND flagD.is_present
                WHERE  subT.topic_id IN (:topic_ids) AND flagD.flag_id IN (:flag_ids)
                GROUP BY subT.subtopic_id,subT.topic_id 
                ORDER BY subT.subtopic_id LIMIT :limit OFFSET :skip;`,
				{
					replacements: {
						email: args.email,
						topic_ids: topic_ids,
						flag_ids: flag_ids,
						limit: LIMIT,
						skip: skip,
					},
					type: QueryTypes.SELECT,
				}
			);
		}
		return result;
	},
	findVideoInfoByModuleAndFlagId: async (args) => {
		let skip = (args.page - 1) * LIMIT;
		let module_ids = args.module_ids.toString().split(",");
		let flag_ids = args.flag_ids.toString().split(",");
		let result;
		if (flag_ids.includes(UNWATCHED_FLAG)) {
			result = await sequelizeInstance.query(
				`SELECT subT.subtopic_id,subT.topic_id,(subT.subtopic_name) as name,array_agg(flagD.flag_id) as flags,COUNT(*) OVER() as total_records
                FROM module_topics 
                INNER JOIN subtopics as subT
                ON module_topics.topic_id = subT.topic_id
                LEFT JOIN ( SELECT * FROM flag_details WHERE email=:email AND Type='video' AND flag_id IN ('1',:flag_ids) AND is_present) as flagD
                ON subT.subtopic_id = flagD.subtopicOrQuestionId AND flagD.email=:email AND flagD.Type='video'
                WHERE  module_topics.module_id IN (:module_ids) AND (flagD.flag_id IS NULL OR flagD.flag_id IN (:flag_ids))
                GROUP BY subT.subtopic_id,subT.topic_id 
                ORDER BY subT.subtopic_id LIMIT :limit OFFSET :skip;`,
				{
					replacements: {
						email: args.email,
						module_ids: module_ids,
						flag_ids: flag_ids,
						limit: LIMIT,
						skip: skip,
					},
					type: QueryTypes.SELECT,
				}
			);
		} else {
			result = await sequelizeInstance.query(
				`SELECT subT.subtopic_id,subT.topic_id,(subT.subtopic_name) as name,array_agg(flagD.flag_id) as flags,COUNT(*) OVER() as total_records
                 FROM module_topics 
                 INNER JOIN subtopics as subT
                 ON module_topics.topic_id = subT.topic_id
                 INNER JOIN flag_details as flagD
                 ON subT.subtopic_id = flagD.subtopicOrQuestionId AND flagD.email=:email AND flagD.Type='video' AND flagD.is_present
                 WHERE  module_topics.module_id IN (:module_ids) AND (flagD.flag_id IN (:flag_ids))
                 GROUP BY subT.subtopic_id,subT.topic_id 
                 ORDER BY subT.subtopic_id LIMIT :limit OFFSET :skip;`,
				{
					replacements: {
						email: args.email,
						module_ids: module_ids,
						flag_ids: flag_ids,
						limit: LIMIT,
						skip: skip,
					},
					type: QueryTypes.SELECT,
				}
			);
		}
		return result;
	},
	findVideoInfoByFlags: async (args) => {
		let skip = (args.page - 1) * LIMIT;
		let flag_ids = args.flag_ids.toString().split(",");
		let result;
		if (flag_ids.includes(UNWATCHED_FLAG)) {
			result = await sequelizeInstance.query(
				`SELECT subT.subtopic_id,subT.topic_id,(subT.subtopic_name) as name,array_agg(flagD.flag_id) as flags, COUNT(*) OVER() as total_records
                FROM subtopics as subT
                LEFT JOIN ( SELECT * FROM flag_details WHERE email=:email AND Type='video' AND flag_id IN ('1',:flag_ids) AND is_present) as flagD
                ON subT.subtopic_id = flagD.subtopicOrQuestionId  
                WHERE flagD.flag_id IS NULL OR flagD.flag_id IN (:flag_ids)
                GROUP BY subT.subtopic_id,subT.topic_id 
                ORDER BY subT.subtopic_id LIMIT :limit OFFSET :skip;`,
				{
					replacements: {
						email: args.email,
						flag_ids: flag_ids,
						limit: LIMIT,
						skip: skip,
					},
					type: QueryTypes.SELECT,
				}
			);
		} else {
			result = await sequelizeInstance.query(
				`SELECT subT.subtopic_id,subT.topic_id,(subT.subtopic_name) as name,array_agg(flagD.flag_id) as flags, COUNT(*) OVER() as total_records
                FROM subtopics as subT
                INNER JOIN flag_details as flagD
                ON subT.subtopic_id = flagD.subtopicOrQuestionId AND flagD.email=:email AND flagD.Type='video' AND flagD.is_present
                WHERE  flagD.flag_id IN (:flag_ids) 
                GROUP BY subT.subtopic_id,subT.topic_id 
                ORDER BY subT.subtopic_id LIMIT :limit OFFSET :skip;`,
				{
					replacements: {
						email: args.email,
						flag_ids: flag_ids,
						limit: LIMIT,
						skip: skip,
					},
					type: QueryTypes.SELECT,
				}
			);
		}
		return result;
	},
	findQuestionInfoByTopicId: async (args) => {
		let ques_levels = args.ques_levels;
		if (ques_levels.length == 0) {
			ques_levels = QUES_LEVELS;
		}
		let skip = (args.page - 1) * LIMIT;
		let topic_ids = args.topic_ids.toString().split(",");
		let result;
		result = await sequelizeInstance.query(
			`
            SELECT * ,COUNT(*) OVER() as total_records
            FROM (SELECT  DISTINCT ON (topics_questions.question_id) topics_questions.question_id, questions.level,questions.name,topics_questions.type_id,topics_questions.type,topics_questions.subtopic_id,(question_flags.flag_id) as flags,topics_questions.topic_id
                FROM (SELECT assignment_question.ques_id as question_id,assignment_question.assignment_id as type_id, 'assignment' as type,subtopics.subtopic_id,subtopics.topic_id
                    FROM subtopics
                    INNER JOIN assignment_question ON assignment_question.assignment_id = subtopics.assignment_id
                    WHERE subtopics.topic_id IN (:topic_ids)
                    UNION ALL
                    SELECT homework_question.ques_id as question_id,homework_question.homework_id as type_id,'homework' as type,subtopics.subtopic_id,subtopics.topic_id
                    FROM subtopics
                    INNER JOIN homework_question ON homework_question.homework_id = subtopics.homework_id
                    WHERE subtopics.topic_id IN (:topic_ids)) as topics_questions
                LEFT JOIN (SELECT subtopicorquestionid,array_agg(flag_id) as flag_id 
                    FROM flag_details 
                    WHERE email=:email AND type='question' AND is_present
                    GROUP BY subtopicorquestionid ) as question_flags
                ON question_flags.subtopicorquestionid = topics_questions.question_id
                INNER JOIN questions ON questions.ques_id = topics_questions.question_id AND questions.level IN (:ques_levels)
                WHERE question_flags is NULL OR question_flags.flag_id<>ARRAY[1]
                ORDER BY topics_questions.question_id) as records
            ORDER BY records.subtopic_id,records.type
            LIMIT :limit OFFSET :skip;`,
			{
				replacements: {
					email: args.email,
					topic_ids: topic_ids,
					ques_levels: ques_levels,
					limit: LIMIT,
					skip: skip,
				},
			}
		);
		return result[0];
	},
	findQuestionInfoByModuleId: async (args) => {
		let ques_levels = args.ques_levels;
		if (ques_levels.length == 0) {
			ques_levels = QUES_LEVELS;
		}
		let skip = (args.page - 1) * LIMIT;
		let module_ids = args.module_ids.toString().split(",");
		let result;
		result = await sequelizeInstance.query(
			`
            with subtopics_agg as (SELECT subtopics.topic_id as topic_id,module_topics.module_id as module_id,subtopics.homework_id as homework_id,subtopics.assignment_id as assignment_id,subtopics.subtopic_id as subtopic_id
                FROM subtopics
                INNER JOIN module_topics 
                ON module_topics.topic_id = subtopics.topic_id
                WHERE module_topics.module_id IN (:module_ids))
            SELECT * ,COUNT(*) OVER() as total_records
            FROM (SELECT  DISTINCT ON (topics_questions.question_id) topics_questions.question_id, questions.level,questions.name,topics_questions.type_id,topics_questions.type,topics_questions.subtopic_id,(question_flags.flag_id) as flags,topics_questions.topic_id
                FROM (SELECT assignment_question.ques_id as question_id,assignment_question.assignment_id as type_id, 'assignment' as type,subtopics_agg.subtopic_id,subtopics_agg.topic_id
                    FROM subtopics_agg
                    INNER JOIN assignment_question ON assignment_question.assignment_id = subtopics_agg.assignment_id
                    UNION ALL
                    SELECT homework_question.ques_id as question_id,homework_question.homework_id as type_id,'homework' as type,subtopics_agg.subtopic_id,subtopics_agg.topic_id
                    FROM subtopics_agg
                    INNER JOIN homework_question ON homework_question.homework_id = subtopics_agg.homework_id) as topics_questions
                LEFT JOIN (SELECT subtopicorquestionid,array_agg(flag_id) as flag_id 
                    FROM flag_details 
                    WHERE email=:email AND type='question' AND is_present
                    GROUP BY subtopicorquestionid ) as question_flags
                ON question_flags.subtopicorquestionid = topics_questions.question_id
                INNER JOIN questions ON questions.ques_id = topics_questions.question_id AND questions.level IN (:ques_levels)
                WHERE question_flags is NULL OR question_flags.flag_id<>ARRAY[1] 
                ORDER BY topics_questions.question_id) as records
            ORDER BY records.subtopic_id,records.type
            LIMIT :limit OFFSET :skip;`,
			{
				replacements: {
					email: args.email,
					module_ids: module_ids,
					ques_levels: ques_levels,
					limit: LIMIT,
					skip: skip,
				},
			}
		);
		return result[0];
	},
	findQuestionInfoByTopicAndFlagId: async (args) => {
		let ques_levels = args.ques_levels;
		if (ques_levels.length == 0) {
			ques_levels = QUES_LEVELS;
		}
		let skip = (args.page - 1) * LIMIT;
		let topic_ids = args.topic_ids.toString().split(",");
		let flag_ids = args.flag_ids.toString().split(",");
		let result;
		if (flag_ids.includes(UNWATCHED_FLAG)) {
			result = await sequelizeInstance.query(
				`SELECT * ,COUNT(*) OVER() as total_records
                 FROM (SELECT  DISTINCT ON (topics_questions.question_id) topics_questions.question_id, questions.level,questions.name,topics_questions.type_id,topics_questions.type,topics_questions.subtopic_id,(question_flags.flag_id) as flags,topics_questions.topic_id
                  FROM (SELECT assignment_question.ques_id as question_id,assignment_question.assignment_id as type_id, 'assignment' as type,subtopics.subtopic_id,subtopics.topic_id
                    FROM subtopics
                    INNER JOIN assignment_question ON assignment_question.assignment_id = subtopics.assignment_id
                    WHERE subtopics.topic_id IN (:topic_ids)
                    UNION ALL
                    SELECT homework_question.ques_id as question_id,homework_question.homework_id as type_id,'homework' as type,subtopics.subtopic_id,subtopics.topic_id
                    FROM subtopics
                    INNER JOIN homework_question ON homework_question.homework_id = subtopics.homework_id
                    WHERE subtopics.topic_id IN (:topic_ids)) as topics_questions
                  LEFT JOIN (SELECT subtopicorquestionid,array_agg(flag_id) as flag_id 
                    FROM flag_details 
                    WHERE email=:email AND type='question' AND flag_id IN ('1',:flag_ids) AND is_present
                    GROUP BY subtopicorquestionid ) as question_flags
                  ON question_flags.subtopicorquestionid = topics_questions.question_id
                  INNER JOIN questions ON questions.ques_id = topics_questions.question_id AND questions.level IN (:ques_levels)
                  WHERE question_flags.flag_id is NULL OR ((question_flags.flag_id) && ARRAY[:flag_ids]::int[])
                  ORDER BY topics_questions.question_id) as records
                 ORDER BY records.subtopic_id,records.type
                LIMIT :limit OFFSET :skip;`,
				{
					replacements: {
						email: args.email,
						topic_ids: topic_ids,
						flag_ids: flag_ids,
						ques_levels: ques_levels,
						limit: LIMIT,
						skip: skip,
					},
				}
			);
		} else {
			result = await sequelizeInstance.query(
				`
                SELECT * ,COUNT(*) OVER() as total_records
                FROM (SELECT  DISTINCT ON (topics_questions.question_id) topics_questions.question_id, questions.level,questions.name,topics_questions.type_id,topics_questions.type,topics_questions.subtopic_id,(question_flags.flag_id) as flags,topics_questions.topic_id
                    FROM (SELECT assignment_question.ques_id as question_id,assignment_question.assignment_id as type_id, 'assignment' as type,subtopics.subtopic_id,subtopics.topic_id
                        FROM subtopics
                        INNER JOIN assignment_question ON assignment_question.assignment_id = subtopics.assignment_id
                        WHERE subtopics.topic_id IN (:topic_ids)
                        UNION ALL
                        SELECT homework_question.ques_id as question_id,homework_question.homework_id as type_id,'homework' as type,subtopics.subtopic_id,subtopics.topic_id
                        FROM subtopics
                        INNER JOIN homework_question ON homework_question.homework_id = subtopics.homework_id
                        WHERE subtopics.topic_id IN (:topic_ids)) as topics_questions
                    INNER JOIN (SELECT subtopicorquestionid,array_agg(flag_id) as flag_id 
                        FROM flag_details 
                        WHERE email=:email AND type='question' AND flag_id IN (:flag_ids) AND is_present
                        GROUP BY subtopicorquestionid ) as question_flags
                    ON question_flags.subtopicorquestionid = topics_questions.question_id
                    INNER JOIN questions ON questions.ques_id = topics_questions.question_id AND questions.level IN (:ques_levels)
                    ORDER BY topics_questions.question_id) as records
                ORDER BY records.subtopic_id,records.type
                LIMIT :limit OFFSET :skip;`,
				{
					replacements: {
						email: args.email,
						topic_ids: topic_ids,
						flag_ids: flag_ids,
						ques_levels: ques_levels,
						limit: LIMIT,
						skip: skip,
					},
				}
			);
		}
		return result[0];
	},
	findQuestionInfoByModuleAndFlagId: async (args) => {
		let ques_levels = args.ques_levels;
		if (ques_levels == 0) {
			ques_levels = QUES_LEVELS;
		}
		let skip = (args.page - 1) * LIMIT;
		let module_ids = args.module_ids.toString().split(",");
		let flag_ids = args.flag_ids.toString().split(",");
		let result;
		if (flag_ids.includes(UNWATCHED_FLAG)) {
			result = await sequelizeInstance.query(
				`
                with subtopics_agg as (SELECT subtopics.topic_id as topic_id,module_topics.module_id as module_id,subtopics.homework_id as homework_id,subtopics.assignment_id as assignment_id,subtopics.subtopic_id as subtopic_id
                    FROM subtopics
                    INNER JOIN module_topics 
                    ON module_topics.topic_id = subtopics.topic_id
                    WHERE module_topics.module_id IN (:module_ids))
                SELECT * ,COUNT(*) OVER() as total_records
                FROM (SELECT  DISTINCT ON (topics_questions.question_id) topics_questions.question_id, questions.level,questions.name,topics_questions.type_id,topics_questions.type,topics_questions.subtopic_id,(question_flags.flag_id) as flags,topics_questions.topic_id
                    FROM (SELECT assignment_question.ques_id as question_id,assignment_question.assignment_id as type_id, 'assignment' as type,subtopics_agg.subtopic_id,subtopics_agg.topic_id
                        FROM subtopics_agg
                        INNER JOIN assignment_question ON assignment_question.assignment_id = subtopics_agg.assignment_id
                        UNION ALL
                        SELECT homework_question.ques_id as question_id,homework_question.homework_id as type_id,'homework' as type,subtopics_agg.subtopic_id,subtopics_agg.topic_id
                        FROM subtopics_agg
                        INNER JOIN homework_question ON homework_question.homework_id = subtopics_agg.homework_id) as topics_questions
                    LEFT JOIN (SELECT subtopicorquestionid,array_agg(flag_id) as flag_id 
                        FROM flag_details 
                        WHERE email=:email AND type='question' AND flag_id IN ('1',:flag_ids) AND is_present
                        GROUP BY subtopicorquestionid ) as question_flags
                    ON question_flags.subtopicorquestionid = topics_questions.question_id
                    INNER JOIN questions ON questions.ques_id = topics_questions.question_id AND questions.level IN (:ques_levels)
                    WHERE question_flags.flag_id is NULL OR ((question_flags.flag_id) && ARRAY[:flag_ids]::int[])
                    ORDER BY topics_questions.question_id) as records
                ORDER BY records.subtopic_id,records.type
                LIMIT :limit OFFSET :skip;`,
				{
					replacements: {
						email: args.email,
						module_ids: module_ids,
						ques_levels: ques_levels,
						flag_ids: flag_ids,
						limit: LIMIT,
						skip: skip,
					},
				}
			);
		} else {
			result = await sequelizeInstance.query(
				`
                with subtopics_agg as (SELECT subtopics.topic_id as topic_id,module_topics.module_id as module_id,subtopics.homework_id as homework_id,subtopics.assignment_id as assignment_id,subtopics.subtopic_id as subtopic_id
                    FROM subtopics
                    INNER JOIN module_topics 
                    ON module_topics.topic_id = subtopics.topic_id
                    WHERE module_topics.module_id IN (:module_ids))
                SELECT * ,COUNT(*) OVER() as total_records
                FROM (SELECT  DISTINCT ON (topics_questions.question_id) topics_questions.question_id, questions.level,questions.name,topics_questions.type_id,topics_questions.type,topics_questions.subtopic_id,(question_flags.flag_id) as flags,topics_questions.topic_id
                    FROM (SELECT assignment_question.ques_id as question_id,assignment_question.assignment_id as type_id, 'assignment' as type,subtopics_agg.subtopic_id,subtopics_agg.topic_id
                        FROM subtopics_agg
                        INNER JOIN assignment_question ON assignment_question.assignment_id = subtopics_agg.assignment_id
                        UNION ALL
                        SELECT homework_question.ques_id as question_id,homework_question.homework_id as type_id,'homework' as type,subtopics_agg.subtopic_id,subtopics_agg.topic_id
                        FROM subtopics_agg
                        INNER JOIN homework_question ON homework_question.homework_id = subtopics_agg.homework_id) as topics_questions
                    INNER JOIN (SELECT subtopicorquestionid,array_agg(flag_id) as flag_id 
                        FROM flag_details 
                        WHERE email=:email AND type='question' AND flag_id IN (:flag_ids) AND is_present
                        GROUP BY subtopicorquestionid ) as question_flags
                    ON question_flags.subtopicorquestionid = topics_questions.question_id
                    INNER JOIN questions ON questions.ques_id = topics_questions.question_id AND questions.level IN (:ques_levels)
                    ORDER BY topics_questions.question_id) as records
                ORDER BY records.subtopic_id,records.type
                LIMIT :limit OFFSET :skip;`,
				{
					replacements: {
						email: args.email,
						module_ids: module_ids,
						ques_levels: ques_levels,
						flag_ids: flag_ids,
						limit: LIMIT,
						skip: skip,
					},
				}
			);
		}
		return result[0];
	},
	findQuestionInfoByFlags: async (args) => {
		let ques_levels = args.ques_levels;
		if (ques_levels.length == 0) {
			ques_levels = QUES_LEVELS;
		}
		let skip = (args.page - 1) * LIMIT;
		let flag_ids = args.flag_ids.toString().split(",");
		let result;
		if (flag_ids.includes(UNWATCHED_FLAG)) {
			result = await sequelizeInstance.query(
				`SELECT * ,COUNT(*) OVER() as total_records
                 FROM (SELECT  DISTINCT ON (topics_questions.question_id) topics_questions.question_id, questions.level,questions.name,topics_questions.type_id,topics_questions.type,topics_questions.subtopic_id,(question_flags.flag_id) as flags,topics_questions.topic_id
                  FROM (SELECT assignment_question.ques_id as question_id,assignment_question.assignment_id as type_id, 'assignment' as type,subtopics.subtopic_id,subtopics.topic_id
                    FROM subtopics
                    INNER JOIN assignment_question ON assignment_question.assignment_id = subtopics.assignment_id
                    UNION ALL
                    SELECT homework_question.ques_id as question_id,homework_question.homework_id as type_id,'homework' as type,subtopics.subtopic_id,subtopics.topic_id
                    FROM subtopics
                    INNER JOIN homework_question ON homework_question.homework_id = subtopics.homework_id) as topics_questions
                  LEFT JOIN (SELECT subtopicorquestionid,array_agg(flag_id) as flag_id 
                    FROM flag_details 
                    WHERE email=:email AND type='question' AND flag_id IN ('1',:flag_ids) AND is_present
                    GROUP BY subtopicorquestionid ) as question_flags
                  ON question_flags.subtopicorquestionid = topics_questions.question_id
                  INNER JOIN questions ON questions.ques_id = topics_questions.question_id AND questions.level IN (:ques_levels)
                  WHERE question_flags.flag_id is NULL OR ((question_flags.flag_id) && ARRAY[:flag_ids]::int[])
                  ORDER BY topics_questions.question_id) as records
                 ORDER BY records.subtopic_id,records.type
                LIMIT :limit OFFSET :skip;`,
				{
					replacements: {
						email: args.email,
						flag_ids: flag_ids,
						ques_levels: ques_levels,
						limit: LIMIT,
						skip: skip,
					},
				}
			);
		} else {
			result = await sequelizeInstance.query(
				`
                SELECT * ,COUNT(*) OVER() as total_records
                FROM (SELECT  DISTINCT ON (topics_questions.question_id) topics_questions.question_id, questions.level,questions.name,topics_questions.type_id,topics_questions.type,topics_questions.subtopic_id,(question_flags.flag_id) as flags,topics_questions.topic_id
                    FROM (SELECT assignment_question.ques_id as question_id,assignment_question.assignment_id as type_id, 'assignment' as type,subtopics.subtopic_id,subtopics.topic_id
                        FROM subtopics
                        INNER JOIN assignment_question ON assignment_question.assignment_id = subtopics.assignment_id
                        UNION ALL
                        SELECT homework_question.ques_id as question_id,homework_question.homework_id as type_id,'homework' as type,subtopics.subtopic_id,subtopics.topic_id
                        FROM subtopics
                        INNER JOIN homework_question ON homework_question.homework_id = subtopics.homework_id) as topics_questions
                    INNER JOIN (SELECT subtopicorquestionid,array_agg(flag_id) as flag_id 
                        FROM flag_details 
                        WHERE email=:email AND type='question' AND flag_id IN (:flag_ids) AND is_present
                        GROUP BY subtopicorquestionid ) as question_flags
                    ON question_flags.subtopicorquestionid = topics_questions.question_id
                    INNER JOIN questions ON questions.ques_id = topics_questions.question_id AND questions.level IN (:ques_levels)
                    ORDER BY topics_questions.question_id) as records
                ORDER BY records.subtopic_id,records.type
                LIMIT :limit OFFSET :skip;`,
				{
					replacements: {
						email: args.email,
						flag_ids: flag_ids,
						ques_levels: ques_levels,
						limit: LIMIT,
						skip: skip,
					},
				}
			);
		}
		return result[0];
	},
	findQuestionInfoByLevels: async (args) => {
		let ques_levels = args.ques_levels;
		let skip = (args.page - 1) * LIMIT;
		let result;
		result = await sequelizeInstance.query(
			`
                SELECT * ,COUNT(*) OVER() as total_records
                FROM (SELECT  DISTINCT ON (topics_questions.question_id) topics_questions.question_id, questions.level,questions.name,topics_questions.type_id,topics_questions.type,topics_questions.subtopic_id,(question_flags.flag_id) as flags,topics_questions.topic_id
                    FROM (SELECT assignment_question.ques_id as question_id,assignment_question.assignment_id as type_id, 'assignment' as type,subtopics.subtopic_id,subtopics.topic_id
                        FROM subtopics
                        INNER JOIN assignment_question ON assignment_question.assignment_id = subtopics.assignment_id
                        UNION ALL
                        SELECT homework_question.ques_id as question_id,homework_question.homework_id as type_id,'homework' as type,subtopics.subtopic_id,subtopics.topic_id
                        FROM subtopics
                        INNER JOIN homework_question ON homework_question.homework_id = subtopics.homework_id) as topics_questions
                    INNER JOIN (SELECT subtopicorquestionid,array_agg(flag_id) as flag_id 
                        FROM flag_details 
                        WHERE email=:email AND type='question'
                        GROUP BY subtopicorquestionid ) as question_flags
                    ON question_flags.subtopicorquestionid = topics_questions.question_id
                    INNER JOIN questions ON questions.ques_id = topics_questions.question_id AND questions.level IN (:ques_levels)
                    ORDER BY topics_questions.question_id) as records
                ORDER BY records.subtopic_id,records.type
                LIMIT :limit OFFSET :skip;`,
			{
				replacements: {
					email: args.email,
					ques_levels: ques_levels,
					limit: LIMIT,
					skip: skip,
				},
			}
		);
		return result[0];
	},
};

module.exports = {
	schema,
	root,
};
