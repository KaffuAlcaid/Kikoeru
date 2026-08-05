"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.assertCleanupSafe = assertCleanupSafe;
exports.evaluateCleanupSafety = evaluateCleanupSafety;

const fs = require("fs");
const path = require("path");
const { isPathInside } = require("./pathSafety");

function evaluateCleanupSafety(rootFolders, works, options = {}) {
    const fsApi = options.fs || fs;
    const allowEmptyRootCleanup = options.allowEmptyRootCleanup === true;
    const allowLargeCleanup = options.allowLargeCleanup === true;
    const configuredRatio = Number(options.maxMissingRatio);
    const maxMissingRatio = Number.isFinite(configuredRatio) && configuredRatio >= 0 && configuredRatio <= 1
        ? configuredRatio
        : 0.25;
    const configuredRoots = new Map((Array.isArray(rootFolders) ? rootFolders : [])
        .filter(root => root && typeof root.name === "string")
        .map(root => [root.name, root]));
    const workList = Array.isArray(works) ? works : [];
    const problems = [];
    const rootStats = new Map();

    if (workList.length === 0) {
        return { safe: true, problems, rootStats: [], missingWorks: [] };
    }

    for (const work of workList) {
        const root = configuredRoots.get(work.root_folder);
        if (!root || typeof root.path !== "string" || root.path.length === 0) {
            problems.push({ code: "ROOT_NOT_CONFIGURED", root: work.root_folder, workId: work.id });
            continue;
        }
        if (!rootStats.has(root.name)) {
            rootStats.set(root.name, { root, total: 0, visible: 0, missing: 0, missingWorks: [], usable: true });
        }
        rootStats.get(root.name).total += 1;
    }

    for (const stat of rootStats.values()) {
        try {
            const rootInfo = fsApi.statSync(stat.root.path);
            if (!rootInfo.isDirectory()) {
                throw new Error("configured root is not a directory");
            }
            fsApi.accessSync(stat.root.path, fs.constants.R_OK);
        }
        catch (error) {
            stat.usable = false;
            problems.push({ code: "ROOT_UNAVAILABLE", root: stat.root.name, message: error.message });
        }
    }

    for (const work of workList) {
        const stat = rootStats.get(work.root_folder);
        if (!stat || !stat.usable) {
            continue;
        }
        const rootPath = path.resolve(stat.root.path);
        const workPath = path.resolve(rootPath, work.dir);
        if (!isPathInside(rootPath, workPath)) {
            problems.push({ code: "WORK_PATH_ESCAPE", root: work.root_folder, workId: work.id });
            continue;
        }
        if (fsApi.existsSync(workPath)) {
            stat.visible += 1;
        }
        else {
            stat.missing += 1;
            stat.missingWorks.push(work);
        }
    }

    if (!allowLargeCleanup) {
        for (const stat of rootStats.values()) {
            if (!stat.usable || stat.total === 0) {
                continue;
            }
            if (!allowEmptyRootCleanup && stat.visible === 0) {
                problems.push({
                    code: "NO_RECORDED_WORKS_VISIBLE",
                    root: stat.root.name,
                    total: stat.total,
                });
            }
            else if (stat.missing / stat.total > maxMissingRatio) {
                problems.push({
                    code: "TOO_MANY_WORKS_MISSING",
                    root: stat.root.name,
                    total: stat.total,
                    missing: stat.missing,
                    maxMissingRatio,
                });
            }
        }
    }

    return {
        safe: problems.length === 0,
        problems,
        rootStats: Array.from(rootStats.values()),
        missingWorks: Array.from(rootStats.values()).flatMap(stat => stat.missingWorks),
    };
}

function assertCleanupSafe(rootFolders, works, options = {}) {
    const report = evaluateCleanupSafety(rootFolders, works, options);
    if (!report.safe) {
        const error = new Error(`Refusing unsafe cleanup: ${report.problems.map(problem => problem.code).join(", ")}`);
        error.code = "UNSAFE_CLEANUP";
        error.report = report;
        throw error;
    }
    return report;
}
