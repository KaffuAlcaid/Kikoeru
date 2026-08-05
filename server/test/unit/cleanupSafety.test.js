"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { assertCleanupSafe, evaluateCleanupSafety } = require("../../src/filesystem/cleanupSafety");

function makeRoot() {
    return fs.mkdtempSync(path.join(os.tmpdir(), "kikoeru-cleanup-"));
}

test("cleanup is safe when at least one recorded work remains visible", () => {
    const root = makeRoot();
    fs.mkdirSync(path.join(root, "RJ000001"));
    const works = [
        { id: 1, root_folder: "test", dir: "RJ000001" },
        { id: 2, root_folder: "test", dir: "RJ000002" },
        { id: 3, root_folder: "test", dir: "RJ000001" },
        { id: 4, root_folder: "test", dir: "RJ000001" },
        { id: 5, root_folder: "test", dir: "RJ000001" },
    ];
    const report = assertCleanupSafe([{ name: "test", path: root }], works);
    assert.equal(report.missingWorks.length, 1);
    fs.rmSync(root, { recursive: true, force: true });
});

test("cleanup is refused when a configured root is unavailable", () => {
    const missingRoot = path.join(os.tmpdir(), `missing-kikoeru-${Date.now()}`);
    const report = evaluateCleanupSafety([{ name: "test", path: missingRoot }], [
        { id: 1, root_folder: "test", dir: "RJ000001" },
    ]);
    assert.equal(report.safe, false);
    assert(report.problems.some(problem => problem.code === "ROOT_UNAVAILABLE"));
});

test("cleanup is refused when no recorded work is visible", () => {
    const root = makeRoot();
    assert.throws(() => assertCleanupSafe([{ name: "test", path: root }], [
        { id: 1, root_folder: "test", dir: "RJ000001" },
    ]), error => error.code === "UNSAFE_CLEANUP");
    fs.rmSync(root, { recursive: true, force: true });
});

test("cleanup is refused when the missing ratio exceeds the configured limit", () => {
    const root = makeRoot();
    fs.mkdirSync(path.join(root, "RJ000001"));
    const report = evaluateCleanupSafety([{ name: "test", path: root }], [
        { id: 1, root_folder: "test", dir: "RJ000001" },
        { id: 2, root_folder: "test", dir: "RJ000002" },
    ], { maxMissingRatio: 0.25 });
    assert(report.problems.some(problem => problem.code === "TOO_MANY_WORKS_MISSING"));
    fs.rmSync(root, { recursive: true, force: true });
});

test("cleanup is refused for a database path escaping its root", () => {
    const root = makeRoot();
    const report = evaluateCleanupSafety([{ name: "test", path: root }], [
        { id: 1, root_folder: "test", dir: path.join("..", "outside") },
    ], { allowEmptyRootCleanup: true });
    assert(report.problems.some(problem => problem.code === "WORK_PATH_ESCAPE"));
    fs.rmSync(root, { recursive: true, force: true });
});
