exports.up = async function (knex) {
    await knex.schema.alterTable('t_work', function (table) {
        table.integer('is_custom_meta').defaultTo(0);
    });
};
exports.down = async function (knex) {
    await knex.schema.alterTable('t_work', function (table) {
        table.dropColumn('is_custom_meta');
    });
};
