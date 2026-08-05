"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const lodash_1 = __importDefault(require("lodash"));
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const config_1 = require("../config");
const dlsite_tag_map_1 = require("../scraper/dlsite-tag-map");
const db_1 = require("../database/db");
const accessControl_1 = require("../auth/accessControl");
const filterConfig = (_config, option = 'read') => {
    const currentConfig = config_1.config;
    const configClone = lodash_1.default.cloneDeep(_config);
    delete configClone.md5secret;
    delete configClone.jwtsecret;
    if (option === 'write') {
        delete configClone.production;
        if (process.env.NODE_ENV === 'production' || currentConfig.production) {
            delete configClone.auth;
        }
    }
    return configClone;
};
async function renameTagsToLanguage(tagLanguage) {
    const tags = await (0, db_1.knex)('t_tag').select('id', 'name');
    let updated = 0;
    for (const tag of tags) {
        const newName = (0, dlsite_tag_map_1.resolveTagName)(tag.id, tagLanguage);
        if (newName && newName !== tag.name) {
            await (0, db_1.knex)('t_tag').where({ id: tag.id }).update({ name: newName });
            updated += 1;
        }
    }
    return updated;
}
router.use('/admin', accessControl_1.requireAdministrator);
router.put('/admin', async (req, res, next) => {
    if (!config_1.config.auth || req.user.name === 'admin') {
        try {
            const newConfigValues = filterConfig(req.body.config, 'write');
            const oldTagLanguage = config_1.config.tagLanguage;
            const newTagLanguage = newConfigValues.tagLanguage;
            (0, config_1.setNewConfigValue)(newConfigValues);
            if (newTagLanguage && newTagLanguage !== oldTagLanguage) {
                const updated = await renameTagsToLanguage(newTagLanguage);
                res.send({ message: `保存成功，已根据 tagLanguage=${newTagLanguage} 更新 ${updated} 个标签名称.` });
            }
            else {
                res.send({ message: '保存成功.' });
            }
        }
        catch (err) {
            next(err);
        }
    }
    else {
        res.status(403).send({ error: '只有 admin 账号能修改配置文件.' });
    }
});
router.post('/admin/refresh-tags', async (req, res, next) => {
    if (!config_1.config.auth || req.user.name === 'admin') {
        try {
            const updated = await renameTagsToLanguage(config_1.config.tagLanguage);
            res.send({ message: `已根据 tagLanguage=${config_1.config.tagLanguage} 刷新 ${updated} 个标签名称.` });
        }
        catch (err) {
            next(err);
        }
    }
    else {
        res.status(403).send({ error: '只有 admin 账号能修改配置文件.' });
    }
});
router.get('/admin', (req, res, next) => {
    if (!config_1.config.auth || req.user.name === 'admin') {
        try {
            res.send({ config: filterConfig(config_1.config, 'read') });
        }
        catch (err) {
            next(err);
        }
    }
    else {
        res.status(403).send({ error: '只有 admin 账号能读取管理配置文件.' });
    }
});
router.get('/shared', (req, res, next) => {
    try {
        res.send({ sharedConfig: (0, config_1.getSharedConfig)() });
    }
    catch (err) {
        next(err);
    }
});
module.exports = router;
