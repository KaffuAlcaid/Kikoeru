exports.up = async function (knex) {
    await knex.schema.alterTable('t_review', function (table) {
        table.string('progress');
    });
};
exports.down = async function (knex) {
    await knex.schema.alterTable('t_review', function (table) {
        table.dropColumn('progress');
    });
};
