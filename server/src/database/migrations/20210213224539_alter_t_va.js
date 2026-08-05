exports.up = async function (knex) {
    try {
        await knex.raw('DROP VIEW IF EXISTS userMetadata;');
        await knex.raw(`
      CREATE TABLE t_va_new (
        id	TEXT,
        name	TEXT NOT NULL,
        PRIMARY KEY(id)
      );
    `);
        await knex.raw('INSERT INTO t_va_new SELECT * FROM t_va;');
        await knex.raw('DROP TABLE t_va;');
        await knex.raw('ALTER TABLE t_va_new RENAME TO t_va;');
        await knex.raw(`
      CREATE TABLE r_va_work_new (
        va_id TEXT,
        work_id INTEGER,
        FOREIGN KEY(va_id) REFERENCES t_va(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY(work_id) REFERENCES t_work(id) ON DELETE CASCADE ON UPDATE CASCADE,
        PRIMARY KEY(va_id, work_id)
      );
    `);
        await knex.raw('INSERT INTO r_va_work_new(va_id, work_id) SELECT va_id, work_id FROM r_va_work;');
        await knex.raw('DROP TABLE r_va_work;');
        await knex.raw('ALTER TABLE r_va_work_new RENAME TO r_va_work;');
    }
    catch (err) {
        console.error(err);
        throw err;
    }
};
exports.down = async function (knex) {
    try {
        await knex.raw('DROP VIEW IF EXISTS userMetadata;');
        await knex.raw(`
      CREATE TABLE t_va_new (
        id	INTEGER,
        name	TEXT NOT NULL,
        PRIMARY KEY(id)
      );
    `);
        await knex.raw('INSERT INTO t_va_new SELECT * FROM t_va;');
        await knex.raw('DROP TABLE t_va;');
        await knex.raw('ALTER TABLE t_va_new RENAME TO t_va;');
        await knex.raw(`
      CREATE TABLE r_va_work_new (
        va_id INTEGER,
        work_id INTEGER,
        FOREIGN KEY(va_id) REFERENCES t_va(id),
        FOREIGN KEY(work_id) REFERENCES t_work(id),
        PRIMARY KEY(va_id, work_id)
      );
    `);
        await knex.raw('INSERT INTO r_va_work_new(va_id, work_id) SELECT va_id, work_id FROM r_va_work;');
        await knex.raw('DROP TABLE r_va_work;');
        await knex.raw('ALTER TABLE r_va_work_new RENAME TO r_va_work;');
    }
    catch (err) {
        console.error(err);
        throw err;
    }
};
