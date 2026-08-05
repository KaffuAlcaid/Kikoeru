"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.knexMigrate = knexMigrate;
const path_1 = require("path");
const fs_1 = require("fs");
const umzug_1 = __importDefault(require("@umonaca/umzug"));
const lodash_1 = require("lodash");
const bluebird_1 = __importDefault(require("bluebird"));
const knex_1 = __importDefault(require("knex"));
const knexfile_1 = require("./knexfile");
function knexInit(env = 'development') {
    let knexConnectConfig = knexfile_1.knexConnections[env];
    if (typeof knexConnectConfig !== 'object') {
        console.error(`Malformed knex config:`);
        console.error(JSON.stringify(knexConnectConfig, null, 2));
        process.exit(1);
    }
    if (knexConnectConfig.client === 'sqlite3' || knexConnectConfig.client === 'better-sqlite3') {
        knexConnectConfig.useNullAsDefault = true;
    }
    knexConnectConfig.pool.min = 0;
    knexConnectConfig.pool.max = 10;
    knexConnectConfig.pool.idleTimeoutMillis = 1000;
    return (0, knex_1.default)(knexConnectConfig);
}
function umzugKnex(flags, connection) {
    return new umzug_1.default({
        storage: (0, path_1.join)(__dirname, 'storage'),
        storageOptions: { connection },
        migrations: {
            params: [connection, bluebird_1.default],
            path: flags.migrations,
            pattern: /^\d+_.+\.js$/,
            wrap: (fn) => (knex, Promise) => {
                if (flags.skip) {
                    return Promise.resolve();
                }
                if (flags.raw) {
                    return Promise.resolve(fn(knex, Promise));
                }
                else {
                    return knex.transaction((tx) => Promise.resolve(fn(tx, Promise)));
                }
            }
        },
        skipTargetMigrationCheck: true
    });
}
async function umzugOptions(command, flags, umzug) {
    if ((0, lodash_1.isNil)(flags.to) && (0, lodash_1.isNil)(flags.from) && !(0, lodash_1.isNil)(flags.only)) {
        return flags.only;
    }
    const opts = {};
    if (!(0, lodash_1.isNil)(flags.to))
        opts.to = flags.to;
    if (!(0, lodash_1.isNil)(flags.from))
        opts.from = flags.from;
    if (!(0, lodash_1.isNil)(flags.step)) {
        await applyStepOption(command, umzug, opts, flags.step);
    }
    return opts;
}
async function applyStepOption(command, umzug, opts, steps) {
    if (steps === '') {
        steps = 1;
    }
    let migrations = command === 'up'
        ? await umzug.pending()
        : await umzug.executed().then((m) => m.reverse());
    if (opts.from) {
        const limit = migrations.find((m) => m.file.startsWith(opts.to));
        migrations = migrations.slice(Math.min(0, migrations.indexOf(limit)));
    }
    if (opts.to) {
        const limit = migrations.find((m) => m.file.startsWith(opts.to));
        migrations = migrations.slice(0, migrations.indexOf(limit) + 1);
    }
    steps = Math.min(migrations.length, steps);
    if (steps > 0) {
        opts.to = migrations[steps - 1].file;
    }
}
async function knexMigrate(command, to, progress = lodash_1.noop) {
    const flags = {
        to,
        env: 'upgrade',
        migrations: (0, path_1.join)(__dirname, 'migrations'),
    };
    if (!(0, fs_1.existsSync)(flags.migrations)) {
        console.error(`No migrations directory at '${flags.migrations}'`);
    }
    const knex = knexInit(flags.env);
    const umzug = umzugKnex(flags, knex);
    const genProgressFunc = (action) => (migration) => {
        progress({
            action,
            migration: (0, path_1.join)(flags.migrations, migration),
        });
    };
    umzug
        .on('migrating', genProgressFunc('migrate'))
        .on('reverting', genProgressFunc('revert'))
        .on('debug', genProgressFunc('debug'));
    const api = {
        up: async () => {
            const opts = await umzugOptions('up', flags, umzug);
            await umzug.storage.ensureTable();
            return umzug.up(opts);
        },
        skipAll: async () => {
            flags.skip = true;
            const opts = await umzugOptions('up', flags, umzug);
            await umzug.storage.ensureTable();
            return umzug.up(opts);
        }
    };
    if (!(command in api)) {
        throw new Error('Unknown command: ' + command);
    }
    try {
        return await api[command].apply(null, flags);
    }
    finally {
        umzug.storage.knex.destroy();
    }
}
