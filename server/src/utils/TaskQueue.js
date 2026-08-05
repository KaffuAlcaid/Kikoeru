"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanTaskQueue = exports.transcodeTaskQueue = exports.lightTaskQueue = exports.heavyTaskQueue = exports.TaskQueue = exports.TaskQueueClearedError = exports.TaskQueueFullError = void 0;
class TaskQueueFullError extends Error {
    constructor(queueName, capacity) {
        super(`Task queue "${queueName}" is full (capacity: ${capacity})`);
        this.name = "TaskQueueFullError";
        this.code = "TASK_QUEUE_FULL";
        this.queueName = queueName;
        this.capacity = capacity;
    }
}
exports.TaskQueueFullError = TaskQueueFullError;
class TaskQueueClearedError extends Error {
    constructor(queueName) {
        super(`Task queue "${queueName}" was cleared`);
        this.name = "TaskQueueClearedError";
        this.code = "TASK_QUEUE_CLEARED";
        this.queueName = queueName;
    }
}
exports.TaskQueueClearedError = TaskQueueClearedError;
class TaskQueue {
    constructor(options = {}) {
        const normalizedOptions = typeof options === "number"
            ? { capacity: options }
            : options;
        const { name = "task", capacity = Number.POSITIVE_INFINITY } = normalizedOptions;
        if (capacity !== Number.POSITIVE_INFINITY && (!Number.isInteger(capacity) || capacity < 1)) {
            throw new RangeError("Task queue capacity must be a positive integer or Infinity");
        }
        this.name = name;
        this.capacity = capacity;
        this.queue = [];
        this.running = false;
        this.addedTaskCount = 0;
    }
    add(task) {
        if (typeof task !== "function") {
            return Promise.reject(new TypeError("Task must be a function"));
        }
        if (this.isFull()) {
            return Promise.reject(new TaskQueueFullError(this.name, this.capacity));
        }
        this.addedTaskCount++;
        const result = new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
        });
        this.runNext();
        return result;
    }
    runNext() {
        if (this.running) {
            return;
        }
        const nextTask = this.queue.shift();
        if (!nextTask) {
            return;
        }
        this.running = true;
        Promise.resolve()
            .then(() => nextTask.task())
            .then((result) => {
            this.running = false;
            nextTask.resolve(result);
            this.runNext();
        }, (error) => {
            this.running = false;
            nextTask.reject(error);
            this.runNext();
        });
    }
    getLength() {
        return this.queue.length;
    }
    getSize() {
        return this.queue.length + (this.running ? 1 : 0);
    }
    isRunning() {
        return this.running;
    }
    isFull() {
        return this.getSize() >= this.capacity;
    }
    getStatus() {
        return {
            name: this.name,
            capacity: this.capacity,
            running: this.running,
            pending: this.queue.length,
            size: this.getSize(),
        };
    }
    clear() {
        const pendingTasks = this.queue.splice(0);
        const error = new TaskQueueClearedError(this.name);
        for (const pendingTask of pendingTasks) {
            pendingTask.reject(error);
        }
        return pendingTasks.length;
    }
}
exports.TaskQueue = TaskQueue;
exports.heavyTaskQueue = new TaskQueue({ name: "heavy-media", capacity: 16 });
exports.lightTaskQueue = new TaskQueue({ name: "light-media", capacity: 32 });
exports.transcodeTaskQueue = new TaskQueue({ name: "transcode", capacity: 8 });
exports.scanTaskQueue = new TaskQueue({ name: "scan", capacity: 1024 });
