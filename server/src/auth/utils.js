"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.audience = exports.issuer = exports.md5 = exports.signToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const md5_1 = __importDefault(require("md5"));
const config_1 = require("../config");
const issuer = 'http://kikoeru';
exports.issuer = issuer;
const audience = 'http://kikoeru/api';
exports.audience = audience;
const signPayload = (payload) => jsonwebtoken_1.default.sign(payload, config_1.config.jwtsecret, { expiresIn: config_1.config.expiresIn });
const signToken = (user) => {
    const payload = {
        iss: issuer,
        sub: user.name,
        aud: audience,
        name: user.name,
        group: user.group
    };
    return signPayload(payload);
};
exports.signToken = signToken;
const cmd5 = (str) => (0, md5_1.default)(str + config_1.config.md5secret);
exports.md5 = cmd5;
