"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionCheckCache = void 0;

class VersionCheckCache {
    constructor(loader, options = {}) {
        if (typeof loader !== "function") {
            throw new TypeError("loader must be a function");
        }
        this.loader = loader;
        this.ttlMs = options.ttlMs ?? 5 * 60 * 1000;
        this.now = options.now || Date.now;
        this.value = options.initialValue ?? null;
        this.lastAttemptAt = null;
        this.inFlight = null;
    }

    isFresh() {
        return this.lastAttemptAt !== null
            && this.now() - this.lastAttemptAt < this.ttlMs;
    }

    getCached() {
        return this.value;
    }

    async get() {
        if (this.inFlight) {
            return this.inFlight;
        }
        if (this.isFresh()) {
            return this.value;
        }

        this.lastAttemptAt = this.now();
        this.inFlight = Promise.resolve()
            .then(() => this.loader())
            .then((value) => {
                this.value = value;
                return value;
            })
            .catch(() => this.value)
            .finally(() => {
                this.inFlight = null;
            });
        return this.inFlight;
    }
}

exports.VersionCheckCache = VersionCheckCache;
