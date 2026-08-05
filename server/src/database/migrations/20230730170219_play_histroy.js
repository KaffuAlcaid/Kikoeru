exports.up = async function (knex) {
    let exist = await knex.schema.hasTable('t_play_histroy');
    if (!exist) {
        await knex.schema.createTable("t_play_histroy", function (table) {
            table.string('user_name').notNullable();
            table.integer('work_id').notNullable();
            table.timestamps(true, true);
            table.string('state').notNullable();
            table.foreign('user_name').references('name').inTable('t_user').onDelete('CASCADE');
            table.foreign('work_id').references('id').inTable('t_work').onDelete('CASCADE');
            table.primary(['user_name', 'work_id']);
        });
    }
};
exports.down = async function (knex) {
    await knex.schema.dropTable("t_play_histroy");
};
