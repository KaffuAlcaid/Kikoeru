exports.up = async function (knex) {
    await knex.raw(`DROP TRIGGER IF EXISTS t_translate_task_trigger_update;`);
    await knex.raw(`
    CREATE TRIGGER t_translate_task_trigger_update
    AFTER UPDATE ON t_translate_task
    FOR EACH ROW
    BEGIN
        UPDATE t_translate_task SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
  `);
};
exports.down = async function (knex) {
    await knex.raw(`DROP TRIGGER IF EXISTS t_translate_task_trigger_update;`);
};
