exports.up = async function (knex) {
    let exist = await knex.schema.hasTable('t_review');
    if (!exist) {
        await knex.schema.createTable("t_review", function (table) {
            table.string('user_name').notNullable();
            table.string('work_id').notNullable();
            table.integer('rating');
            table.string('review_text');
            table.timestamps(true, true);
            table.foreign('user_name').references('name').inTable('t_user');
            table.foreign('work_id').references('id').inTable('t_work');
            table.primary(['user_name', 'work_id']);
        });
    }
};
exports.down = async function (knex) {
    await knex.schema.dropTable("t_review");
};
