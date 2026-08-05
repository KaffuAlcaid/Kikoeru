async function dropLegacyTrigger(knex) {
    const client = knex.client.config.client;
    if (client === 'sqlite3' || client === 'better-sqlite3') {
        await knex.raw('DROP TRIGGER IF EXISTS t_translate_task_trigger_update;');
    }
}

exports.up = async function (knex) {
    await dropLegacyTrigger(knex);

    if (await knex.schema.hasTable('t_work')) {
        await knex('t_work')
            .where('lyric_status', 'like', '%ai%')
            .update({
                lyric_status: knex.raw("CASE WHEN lyric_status LIKE '%local%' THEN 'local' ELSE '' END"),
            });
    }

    await knex.schema.dropTableIfExists('t_translate_task');
    // Deliberately keep sqlite/lyrics and any legacy .lrc files. They may be
    // useful for manual recovery and must not be deleted by a schema migration.
};

exports.down = async function (knex) {
    if (!(await knex.schema.hasTable('t_translate_task'))) {
        await knex.schema.createTable('t_translate_task', (table) => {
            table.increments();
            table.timestamps(true, true);
            table.bigInteger('work_id').unsigned().notNullable().defaultTo(0);
            table.string('audio_path').notNullable().defaultTo('');
            table.integer('status').notNullable().defaultTo(0);
            table.string('worker_name').notNullable().defaultTo('');
            table.string('worker_status').notNullable().defaultTo('');
            table.string('secret').notNullable().defaultTo('');
            table.foreign('work_id').references('id').inTable('t_work');
        });
    }
};
