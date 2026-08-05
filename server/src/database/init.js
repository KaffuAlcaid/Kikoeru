"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = void 0;
const fs_1 = __importDefault(require("fs"));
const utils_1 = require("../auth/utils");
const knex_migrate_1 = require("./knex-migrate");
const db_1 = require("./db");
const package_json_1 = __importDefault(require("../../package.json"));
const compare_versions_1 = __importDefault(require("compare-versions"));
const config_1 = require("../config");
const upgrade_1 = require("../upgrade");
const schema_1 = require("./schema");
function ensureDir(dirPath) {
    if (!fs_1.default.existsSync(dirPath)) {
        try {
            fs_1.default.mkdirSync(dirPath, { recursive: true });
        }
        catch (err) {
            console.error("ensureDir failed: ", err);
            return false;
        }
    }
    return true;
}
const initDatabase = async () => {
    let configVersion = config_1.config.version;
    let currentVersion = package_json_1.default.version;
    async function runMigrations() {
        await (0, knex_migrate_1.knexMigrate)('up', undefined, ({ action, migration }) => {
            console.log('Doing ' + action + ' on ' + migration);
        });
    }
    async function skipMigrations() {
        await (0, knex_migrate_1.knexMigrate)('skipAll', undefined);
    }
    async function fixMigrations() {
        if (compare_versions_1.default.compare(configVersion, 'v0.5.1', '>=') && compare_versions_1.default.compare(configVersion, 'v0.5.3', '<')) {
            await (0, knex_migrate_1.knexMigrate)('skipAll', '20210108093032');
        }
    }
    function initDatabaseDir() {
        if (!ensureDir(config_1.config.databaseFolderDir)) {
            console.error(` ! 在创建存放数据库文件的文件夹时出错`);
        }
    }
    function ensureTranscodeDir() {
        if (!ensureDir(config_1.config.transcodeFolderDir)) {
            console.error(` ! 在创建存放转码文件的文件夹时出错`);
        }
        if (!ensureDir(config_1.config.transcodeTempFolderDir)) {
            console.error(` ! 在创建存放临时转码文件的文件夹时出错`);
        }
    }
    const databaseExist = await (0, db_1.checkDatabaseExists)();
    if (databaseExist) {
        try {
            if (compare_versions_1.default.compare(currentVersion, configVersion, '>')) {
                console.log('升级中');
                const oldVersion = config_1.config.version;
                await (0, upgrade_1.applyFix)(oldVersion);
                await fixMigrations();
            }
            // Always apply pending schema migrations. Maintenance releases can
            // add migrations without changing the legacy config version.
            await runMigrations();
            if (compare_versions_1.default.compare(currentVersion, configVersion, '>')) {
                (0, config_1.migrateConfigVersion)();
            }
        }
        catch (error) {
            console.log('升级迁移过程中出错，请在GitHub issues中报告作者');
            console.error(error);
            throw error;
        }
    }
    else if (!databaseExist) {
        initDatabaseDir();
        await (0, schema_1.createSchema)();
        try {
            await (0, db_1.createUser)({
                name: 'admin',
                password: (0, utils_1.md5)('admin'),
                group: 'administrator'
            });
        }
        catch (err) {
            console.error(err.message);
            throw err;
        }
        try {
            await skipMigrations();
        }
        catch (err) {
            console.error(` ! 在构建数据库结构过程中出错: ${err.message}`, err.stack);
            throw err;
        }
        if (compare_versions_1.default.compare(currentVersion, configVersion, '>')) {
            (0, config_1.migrateConfigVersion)();
        }
    }
    ensureTranscodeDir();
    await (0, db_1.fixDatabase)();
};
exports.initDatabase = initDatabase;
