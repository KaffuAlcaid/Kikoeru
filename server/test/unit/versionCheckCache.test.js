"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { VersionCheckCache } = require("../../src/utils/VersionCheckCache");
const { isUpstreamUpdateAvailable } = require("../../src/utils/versionComparison");

test("product versions compare directly with release tags", () => {
    assert.equal(isUpstreamUpdateAvailable("v0.7.0", "0.7.0"), false);
    assert.equal(isUpstreamUpdateAvailable("v0.7.1", "0.7.0"), true);
    assert.equal(isUpstreamUpdateAvailable("not-a-version", "0.7.0"), null);
    assert.equal(isUpstreamUpdateAvailable(null, "0.7.0"), null);
});

test("version checks share one in-flight request and cache by elapsed milliseconds", async () => {
    let now = 1000;
    let calls = 0;
    let resolveLoad;
    const cache = new VersionCheckCache(() => {
        calls++;
        return new Promise((resolve) => {
            resolveLoad = resolve;
        });
    }, { ttlMs: 300000, now: () => now, initialValue: { value: "initial" } });

    const first = cache.get();
    const second = cache.get();
    await Promise.resolve();
    assert.equal(calls, 1);
    resolveLoad({ value: "fresh" });
    assert.deepEqual(await first, { value: "fresh" });
    assert.deepEqual(await second, { value: "fresh" });

    now += 65 * 60 * 1000;
    const third = cache.get();
    await Promise.resolve();
    assert.equal(calls, 2);
    resolveLoad({ value: "newer" });
    assert.deepEqual(await third, { value: "newer" });
});

test("failed checks keep the last value and respect the retry interval", async () => {
    let now = 0;
    let calls = 0;
    const initialValue = { latest_stable: null };
    const cache = new VersionCheckCache(async () => {
        calls++;
        throw new Error("offline");
    }, { ttlMs: 300000, now: () => now, initialValue });

    assert.equal(await cache.get(), initialValue);
    assert.equal(await cache.get(), initialValue);
    assert.equal(calls, 1);

    now = 300000;
    assert.equal(await cache.get(), initialValue);
    assert.equal(calls, 2);
});
