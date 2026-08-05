"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdministratorRequest = isAdministratorRequest;
exports.isAuthenticatedWriteRequest = isAuthenticatedWriteRequest;
exports.getRequestUsername = getRequestUsername;
exports.requireAdministrator = requireAdministrator;
exports.requireAuthenticatedWrite = requireAuthenticatedWrite;

function isAdministratorRequest(req, config) {
    if (!config.auth) {
        return config.allowUnauthenticatedWriteOperations === true;
    }
    const user = req && req.user;
    return Boolean(user && (user.name === "admin" || user.group === "administrator"));
}

function requireAdministrator(req, res, next) {
    const { config } = require("../config");
    if (isAdministratorRequest(req, config)) {
        next();
        return;
    }
    res.status(403).send({
        error: config.auth
            ? "只有管理员可以执行该操作."
            : "危险写操作已禁用；请启用鉴权，或显式允许未鉴权写操作.",
    });
}

function requireAuthenticatedWrite(req, res, next) {
    const { config } = require("../config");
    if (isAuthenticatedWriteRequest(req, config)) {
        next();
        return;
    }
    res.status(403).send({ error: "该写操作要求登录，或由管理员显式允许未鉴权写入." });
}

function isAuthenticatedWriteRequest(req, config) {
    return Boolean((config.auth && req && req.user) || (!config.auth && config.allowUnauthenticatedWriteOperations === true));
}

function getRequestUsername(req, config) {
    if (!config.auth) {
        return 'admin';
    }
    const user = req && req.user;
    return user && typeof user.name === 'string' ? user.name : null;
}
