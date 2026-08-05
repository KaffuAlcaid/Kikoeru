"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.isUpstreamUpdateAvailable = isUpstreamUpdateAvailable;

const compareVersions = require("compare-versions");

function isUpstreamUpdateAvailable(latestVersion, currentVersion) {
    if (!latestVersion) {
        return null;
    }
    try {
        return compareVersions.compare(latestVersion, currentVersion, ">");
    }
    catch (_error) {
        return null;
    }
}
