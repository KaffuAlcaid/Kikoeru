"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLock = exports.applyFix = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const compare_versions_1 = __importDefault(require("compare-versions"));
const config_1 = require("./config");
const knex_migrate_1 = require("./database/knex-migrate");
const db_1 = require("./database/db");
const versionVAHashCollisionFixed = '0.6.0-rc.2';
const versionKnexfilePathFixed = '0.6.0-rc.4';
const applyFix = async (oldVersion) => {
    if (compare_versions_1.default.compare(oldVersion, versionVAHashCollisionFixed, '<')) {
        console.log('\n');
        console.log(' ! 新版解决了旧版扫描时将かの仔和こっこ识别为同一个人的问题');
        console.log(' ! 建议进行扫描以自动修复这一问题');
        const lockConfig = { fixVA: true };
        exports.updateLock.createLockFile(lockConfig);
    }
    if (compare_versions_1.default.compare(oldVersion, versionKnexfilePathFixed, '<')) {
        if (process.platform === 'darwin') {
            await (0, knex_migrate_1.knexMigrate)('skipAll', '20210206141840');
            const results = await db_1.knex.raw('PRAGMA table_info(\'t_va\')');
            if (results[0]['type'] === 'integer') {
                const log = ({ action, migration }) => console.log('Doing ' + action + ' on ' + migration);
                await (0, knex_migrate_1.knexMigrate)('up', '20210213233544', log);
            }
            else {
                await (0, knex_migrate_1.knexMigrate)('skipAll', '20210213233544');
            }
        }
    }
};
exports.applyFix = applyFix;
class upgradeLock {
    constructor(fileName = 'update.lock') {
        this.lockFileConfig = {};
        this.lockFilePath = path_1.default.join(config_1.configFolderDir, fileName);
        this._init();
    }
    _init() {
        if (this.isLockFilePresent) {
            this.readLockFileConfig();
        }
    }
    get isLockFilePresent() {
        return fs_1.default.existsSync(this.lockFilePath);
    }
    readLockFileConfig() {
        this.lockFileConfig = JSON.parse(fs_1.default.readFileSync(this.lockFilePath, { encoding: 'utf-8' }));
    }
    createLockFile(lockConfig) {
        this.lockFileConfig = lockConfig;
        fs_1.default.writeFileSync(this.lockFilePath, JSON.stringify(this.lockFileConfig, null, "\t"));
    }
    updateLockFile(lockConfig) {
        this.createLockFile(lockConfig);
    }
    removeLockFile() {
        if (this.isLockFilePresent) {
            fs_1.default.unlinkSync(this.lockFilePath);
        }
        this.lockFileConfig = {};
    }
}
exports.updateLock = new upgradeLock();
