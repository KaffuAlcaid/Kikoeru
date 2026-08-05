"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
    assertExistingParentInside,
    assertSafePathSegment,
    isPathInside,
    resolvePathInside,
} = require("../../src/filesystem/pathSafety");

test("resolvePathInside accepts a normal nested path", () => {
    const base = path.resolve("library", "RJ000001");
    const target = resolvePathInside(base, path.join("audio", "track.vtt"));
    assert.equal(target, path.join(base, "audio", "track.vtt"));
    assert.equal(isPathInside(base, target), true);
});

test("resolvePathInside rejects traversal and absolute paths", () => {
    const base = path.resolve("library", "RJ000001");
    assert.throws(() => resolvePathInside(base, path.join("..", "outside.vtt")), /escapes/);
    assert.throws(() => resolvePathInside(base, path.resolve("outside.vtt")), /safe relative/);
});

test("assertSafePathSegment rejects separators and dot segments", () => {
    assert.equal(assertSafePathSegment("RJ01355336"), "RJ01355336");
    for (const value of [".", "..", "a/b", "a\\b", ""]) {
        assert.throws(() => assertSafePathSegment(value));
    }
});

test("assertExistingParentInside rejects a parent symlink escaping the base", { skip: process.platform === "win32" }, () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "kikoeru-path-"));
    const base = path.join(temp, "base");
    const outside = path.join(temp, "outside");
    fs.mkdirSync(base);
    fs.mkdirSync(outside);
    fs.symlinkSync(outside, path.join(base, "link"), "dir");
    assert.throws(() => assertExistingParentInside(base, path.join(base, "link", "track.vtt")), /outside/);
    fs.rmSync(temp, { recursive: true, force: true });
});

