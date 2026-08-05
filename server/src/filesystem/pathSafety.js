"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.assertExistingParentInside = assertExistingParentInside;
exports.assertSafePathSegment = assertSafePathSegment;
exports.isPathInside = isPathInside;
exports.resolvePathInside = resolvePathInside;

const fs = require("fs");
const path = require("path");

function isPathInside(basePath, targetPath) {
    const resolvedBase = path.resolve(basePath);
    const resolvedTarget = path.resolve(targetPath);
    const relative = path.relative(resolvedBase, resolvedTarget);
    return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function resolvePathInside(basePath, relativePath, label = "path") {
    if (typeof relativePath !== "string" || relativePath.length === 0) {
        throw new TypeError(`${label} must be a non-empty string`);
    }
    if (relativePath.includes("\0") || path.isAbsolute(relativePath)) {
        throw new Error(`${label} is not a safe relative path`);
    }
    const resolvedBase = path.resolve(basePath);
    const resolvedTarget = path.resolve(resolvedBase, relativePath);
    if (!isPathInside(resolvedBase, resolvedTarget)) {
        throw new Error(`${label} escapes the allowed directory`);
    }
    return resolvedTarget;
}

function assertSafePathSegment(segment, label = "path segment") {
    if (typeof segment !== "string" || segment.length === 0) {
        throw new TypeError(`${label} must be a non-empty string`);
    }
    if (segment === "." || segment === ".." || segment.includes("\0") || segment.includes("/") || segment.includes("\\") || path.isAbsolute(segment)) {
        throw new Error(`${label} must be a single safe file name`);
    }
    return segment;
}

function assertExistingParentInside(basePath, targetPath, fsApi = fs) {
    const realBase = fsApi.realpathSync(basePath);
    const realParent = fsApi.realpathSync(path.dirname(targetPath));
    if (!isPathInside(realBase, realParent)) {
        throw new Error("target parent resolves outside the allowed directory");
    }
    return targetPath;
}

