"use strict";

const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const {
    LOCAL_LISTEN_ADDRESS,
    getHttpListenAddress,
} = require("../../src/utils/listenAddress");

test("local mode always selects the IPv4 loopback address", () => {
    assert.equal(LOCAL_LISTEN_ADDRESS, "127.0.0.1");
    assert.equal(getHttpListenAddress(true, false), "127.0.0.1");
    assert.equal(getHttpListenAddress(true, true), "127.0.0.1");
});

test("remote mode keeps the configured address family", () => {
    assert.equal(getHttpListenAddress(false, false), "0.0.0.0");
    assert.equal(getHttpListenAddress(false, true), "::");
});

test("the local address accepts an explicit IPv4 connection", async (t) => {
    const server = http.createServer((_request, response) => response.end("ok"));
    t.after(() => new Promise((resolve) => server.close(resolve)));

    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, LOCAL_LISTEN_ADDRESS, resolve);
    });

    const { port } = server.address();
    const body = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${port}`, (response) => {
            let value = "";
            response.setEncoding("utf8");
            response.on("data", (chunk) => {
                value += chunk;
            });
            response.on("end", () => resolve(value));
        }).on("error", reject);
    });

    assert.equal(body, "ok");
});
