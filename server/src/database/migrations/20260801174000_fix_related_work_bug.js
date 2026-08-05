const { dbSpecifiedFunctionName } = require('../knexfile');
exports.up = async function (knex) {
    await knex.raw(`DROP VIEW IF EXISTS staticMetadata;`);
    await knex.raw(`
    CREATE VIEW staticMetadata AS
    WITH
    workWithVa AS (
      SELECT
        r_va_work.work_id AS va_work_id,
        ${dbSpecifiedFunctionName.jsonArrayAgg}(t_va.name) AS vaNames,
        ${dbSpecifiedFunctionName.jsonArrayAgg}(t_va.id) AS vaIds
      from r_va_work
      JOIN t_va ON r_va_work.va_id = t_va.id
      GROUP BY r_va_work.work_id
    ),
    workWithTag AS (
      SELECT
        r_tag_work.work_id AS tag_work_id,
        ${dbSpecifiedFunctionName.jsonArrayAgg}(t_tag.name) AS tagNames,
        ${dbSpecifiedFunctionName.jsonArrayAgg}(t_tag.id) AS tagIds
      from r_tag_work
      JOIN t_tag ON r_tag_work.tag_id = t_tag.id
      GROUP BY r_tag_work.work_id
    ),
    relatedWorks AS (
      SELECT
        stw.original_work_id AS source_original_work_id,
        ${dbSpecifiedFunctionName.jsonArrayAgg}(stw.id) AS related_work_ids,
        ${dbSpecifiedFunctionName.jsonArrayAgg}(stw.title) AS related_work_titles
      FROM t_work AS stw
      WHERE stw.original_work_id IS NOT NULL
      GROUP BY stw.original_work_id
    )

    SELECT
      t_work.id,
      t_work.created_at,
      t_work.updated_at,
      t_work.title,
      t_work.circle_id,
      t_circle.name,
      t_work.nsfw,
      t_work.release,
      json_object('id', t_work.circle_id, 'name', t_circle.name) AS circleObj,
      t_work.dl_count,
      t_work.price,
      t_work.review_count,
      t_work.rate_count,
      t_work.rate_average_2dp,
      t_work.rate_count_detail,
      t_work.rank,
      t_work.lyric_status,
      t_work.original_work_id,
      t_work.memo,
      relatedWorks.related_work_ids,
      relatedWorks.related_work_titles,
		  workWithVa.vaNames,
		  workWithVa.vaIds,
		  workWithTag.tagNames,
		  workWithTag.tagIds
    FROM t_work
    LEFT JOIN workWithVa ON workWithVa.va_work_id = t_work.id
    LEFT JOIN workWithTag ON workWithTag.tag_work_id = t_work.id
    LEFT JOIN t_circle ON t_circle.id = t_work.circle_id
    LEFT JOIN relatedWorks ON relatedWorks.source_original_work_id = t_work.original_work_id
    ;
  `);
};
exports.down = async function (knex) {
    await knex.raw(`DROP VIEW IF EXISTS staticMetadata;`);
    await knex.raw(`
        CREATE VIEW staticMetadata AS
    WITH 
    workWithVa AS (
      SELECT
        r_va_work.work_id AS va_work_id,
        ${dbSpecifiedFunctionName.jsonArrayAgg}(t_va.name) AS vaNames,
        ${dbSpecifiedFunctionName.jsonArrayAgg}(t_va.id) AS vaIds
      from r_va_work
      JOIN t_va ON r_va_work.va_id = t_va.id 
      GROUP BY r_va_work.work_id
    ),
    workWithTag AS (
      SELECT 
        r_tag_work.work_id AS tag_work_id,
        ${dbSpecifiedFunctionName.jsonArrayAgg}(t_tag.name) AS tagNames,
        ${dbSpecifiedFunctionName.jsonArrayAgg}(t_tag.id) AS tagIds 
      from r_tag_work
      JOIN t_tag ON r_tag_work.tag_id = t_tag.id
      GROUP BY r_tag_work.work_id
    ),
    relatedWorks AS (
      SELECT 
        tw.id AS source_work_id,
        ${dbSpecifiedFunctionName.jsonArrayAgg}(stw.id) AS related_work_ids,
        ${dbSpecifiedFunctionName.jsonArrayAgg}(stw.title) AS related_work_titles
      from t_work AS tw
      JOIN t_work AS stw ON stw.original_work_id = tw.original_work_id
      GROUP BY source_work_id
    )

    SELECT 
      t_work.id,
      t_work.created_at,
      t_work.updated_at,
      t_work.title,
      t_work.circle_id,
      t_circle.name,
      t_work.nsfw,
      t_work.release,
      json_object('id', t_work.circle_id, 'name', t_circle.name) AS circleObj,
      t_work.dl_count,
      t_work.price,
      t_work.review_count,
      t_work.rate_count,
      t_work.rate_average_2dp,
      t_work.rate_count_detail,
      t_work.rank,
      t_work.lyric_status,
      t_work.original_work_id,
      t_work.memo,
      relatedWorks.related_work_ids,
      relatedWorks.related_work_titles,
		  workWithVa.vaNames,
		  workWithVa.vaIds,
		  workWithTag.tagNames,
		  workWithTag.tagIds
    FROM t_work
    LEFT JOIN workWithVa ON workWithVa.va_work_id = t_work.id
    LEFT JOIN workWithTag ON workWithTag.tag_work_id = t_work.id
    LEFT JOIN t_circle ON t_circle.id = t_work.circle_id
    LEFT JOIN relatedWorks ON relatedWorks.source_work_id = t_work.original_work_id;
  `);
};
