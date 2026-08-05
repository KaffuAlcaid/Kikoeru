"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { TaskQueue } = require("../../src/utils/TaskQueue");

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, reject, resolve };
}

test("TaskQueue exposes capacity and rejects overflow without poisoning later tasks", async () => {
    const queue = new TaskQueue({ name: "test-media", capacity: 2 });
    const firstGate = deferred();
    const executionOrder = [];
    const first = queue.add(async () => {
        executionOrder.push("first-start");
        await firstGate.promise;
        executionOrder.push("first-end");
        return 1;
    });
    const second = queue.add(async () => {
        executionOrder.push("second");
        return 2;
    });

    assert.deepEqual(queue.getStatus(), {
        name: "test-media",
        capacity: 2,
        running: true,
        pending: 1,
        size: 2,
    });
    await assert.rejects(queue.add(async () => 3), error => {
        assert.equal(error.code, "TASK_QUEUE_FULL");
        assert.equal(error.queueName, "test-media");
        assert.equal(error.capacity, 2);
        return true;
    });

    firstGate.resolve();
    assert.deepEqual(await Promise.all([first, second]), [1, 2]);
    assert.deepEqual(executionOrder, ["first-start", "first-end", "second"]);
    assert.equal(await queue.add(async () => 4), 4);
});

test("TaskQueue continues after a task fails", async () => {
    const queue = new TaskQueue({ name: "failure-test", capacity: 2 });
    const failed = queue.add(async () => {
        throw new Error("synthetic task failure");
    });
    const next = queue.add(async () => "next task completed");

    await assert.rejects(failed, /synthetic task failure/);
    assert.equal(await next, "next task completed");
    assert.equal(queue.getStatus().size, 0);
});

test("TaskQueue.clear rejects pending tasks and leaves the active task intact", async () => {
    const queue = new TaskQueue({ name: "clear-test", capacity: 3 });
    const activeGate = deferred();
    const active = queue.add(() => activeGate.promise);
    const pendingOne = queue.add(async () => 1);
    const pendingTwo = queue.add(async () => 2);

    assert.equal(queue.clear(), 2);
    await assert.rejects(pendingOne, error => error.code === "TASK_QUEUE_CLEARED");
    await assert.rejects(pendingTwo, error => error.code === "TASK_QUEUE_CLEARED");
    assert.deepEqual(queue.getStatus(), {
        name: "clear-test",
        capacity: 3,
        running: true,
        pending: 0,
        size: 1,
    });

    activeGate.resolve("active completed");
    assert.equal(await active, "active completed");
});
