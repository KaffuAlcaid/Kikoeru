exports.up = async function (knex) {
    try {
        await knex.raw('DROP INDEX IF EXISTS t_work_circle_id_release_dl_count_review_count_price_rate_average_2dp_index');
        await knex.raw('DROP INDEX IF EXISTS t_work_index');
        await knex.raw('DROP VIEW IF EXISTS userMetadata');
        await knex.schema.createTable('t_work_new', (table) => {
            table.increments();
            table.string('root_folder').notNullable();
            table.string('dir').notNullable();
            table.string('title').notNullable();
            table.integer('circle_id').notNullable();
            table.boolean('nsfw');
            table.string('release');
            table.integer('dl_count');
            table.integer('price');
            table.integer('review_count');
            table.integer('rate_count');
            table.float('rate_average_2dp');
            table.text('rate_count_detail');
            table.text('rank');
            table.foreign('circle_id').references('id').inTable('t_circle');
            table.index(['circle_id', 'release', 'dl_count', 'review_count', 'price', 'rate_average_2dp'], 't_work_index');
        });
        await knex.raw(`INSERT INTO t_work_new SELECT * FROM t_work;`);
        await knex.raw(`DROP TABLE t_work;`);
        await knex.raw(`ALTER TABLE t_work_new RENAME TO t_work;`);
    }
    catch (error) {
        console.error(error);
        throw error;
    }
};
exports.down = async function (knex) {
};
