"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinFragments = void 0;
exports.sanitizeFileNameForWindows = sanitizeFileNameForWindows;
const path_1 = __importDefault(require("path"));
const url_join_1 = __importDefault(require("url-join"));
const encodeSplitFragments = (fragments) => {
    const expandedFragments = fragments.map((fragment) => fragment.replace(/\\/g, '/').split('/'));
    return expandedFragments.flat().map((fragment) => encodeURIComponent(fragment));
};
const joinFragments = (baseUrl, ...fragments) => {
    const pattern = new RegExp(/^https?:\/\//);
    const encodedFragments = encodeSplitFragments(fragments);
    if (pattern.test(baseUrl)) {
        return (0, url_join_1.default)(baseUrl, ...encodedFragments);
    }
    else {
        return path_1.default.join(baseUrl, ...fragments).replace(/\\/g, '/');
    }
};
exports.joinFragments = joinFragments;
function sanitizeFileNameForWindows(filePath) {
    if (process.platform !== 'win32') {
        return filePath;
    }
    const dir = path_1.default.dirname(filePath);
    const fileName = path_1.default.basename(filePath);
    const sanitizedFileName = fileName
        .replaceAll('?', '？')
        .replaceAll('"', '“')
        .replaceAll('<', '＜')
        .replaceAll('>', '＞')
        .replaceAll('|', '｜')
        .replace(/[?#"<>|]/g, '');
    return path_1.default.join(dir, sanitizedFileName);
}
