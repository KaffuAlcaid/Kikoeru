"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasLetter = exports.nameToUUID = void 0;
exports.getKeyAndIV = getKeyAndIV;
exports.decryptDataIfNeed = decryptDataIfNeed;
const uuid_1 = require("uuid");
const crypto_1 = __importDefault(require("crypto"));
const nameToUUID = (name) => {
    const namespace = '699d9c07-b965-4399-bafd-18a3cacf073c';
    return (0, uuid_1.v5)(name, namespace);
};
exports.nameToUUID = nameToUUID;
const hasLetter = (str) => {
    for (let i = 0; i < str.length; i++) {
        let asc = str.charCodeAt(i);
        if ((asc >= 65 && asc <= 90 || asc >= 97 && asc <= 122)) {
            return true;
        }
    }
    return false;
};
exports.hasLetter = hasLetter;
function getKeyAndIV(base64String) {
    if (!base64String) {
        return {
            key: null,
            iv: null,
        };
    }
    const buffer = Buffer.from(base64String, "base64");
    if (buffer.length !== 48) {
        throw new Error("Base64 字符串解码后长度不为 48 字节");
    }
    const key = buffer.slice(0, 32);
    const iv = buffer.slice(32, 48);
    return {
        key,
        iv
    };
}
const cryptoKeyFlag = "cbhTTWyymp4juQYGI8YzMbtFs54HDEsCcYQ";
function decryptDataIfNeed(encryptedObj, keyAndIv) {
    if (encryptedObj[cryptoKeyFlag] && keyAndIv.key && keyAndIv.iv) {
        const encryptData = encryptedObj[cryptoKeyFlag];
        const decipher = crypto_1.default.createDecipheriv("aes-256-cbc", keyAndIv.key, keyAndIv.iv);
        let decrypted = decipher.update(encryptData, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return JSON.parse(decrypted);
    }
    else {
        return encryptedObj;
    }
}
