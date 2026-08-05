"use strict";
const lodash_1 = require("lodash");
function tableDoesNotExist(err, table) {
    return (err.code === 'ER_NO_SUCH_TABLE' ||
        new RegExp(`relation "${table}" does not exist`).test(err.message) ||
        new RegExp(`no such table: ${table}`).test(err.message));
}
class KnexStorage {
    constructor(options) {
        this.knex = options.connection;
        this.tableName = (0, lodash_1.get)(this.knex, 'client.config.migrations.tableName', 'knex_migrations');
        if (!this.knex) {
            throw new Error("The option 'options.storageOptions.connection' is required.");
        }
    }
    ensureTable() {
        return this.knex(this.tableName)
            .count('id')
            .catch((err) => {
            if (tableDoesNotExist(err, this.tableName)) {
                return this.knex.schema.createTable(this.tableName, (table) => {
                    table.increments();
                    table.string('name');
                    table.integer('batch');
                    table.dateTime('migration_time');
                });
            }
            throw err;
        });
    }
    async logMigration(migrationName) {
        if (typeof this.currentBatch === 'undefined') {
            this.currentBatch = await this.getCurrentBatch();
        }
        const currentBatch = this.currentBatch;
        return this.knex(this.tableName).insert({
            name: migrationName,
            batch: currentBatch + 1,
            migration_time: new Date(),
        });
    }
    unlogMigration(migrationName) {
        return this.knex(this.tableName)
            .where('name', migrationName)
            .del();
    }
    migrations() {
        return this.knex(this.tableName)
            .select()
            .orderBy('id', 'asc');
    }
    executed() {
        return this.knex(this.tableName)
            .orderBy('id', 'asc')
            .pluck('name')
            .catch((err) => {
            if (tableDoesNotExist(err, this.tableName)) {
                return [];
            }
            throw err;
        });
    }
    getCurrentBatch() {
        return this.knex(this.tableName)
            .max('batch as max_batch')
            .then((obj) => obj[0].max_batch || 0);
    }
}
module.exports = KnexStorage;
