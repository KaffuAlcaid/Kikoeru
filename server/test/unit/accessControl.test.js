"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { getRequestUsername, isAdministratorRequest, isAuthenticatedWriteRequest } = require("../../src/auth/accessControl");

test("authenticated administrator is accepted", () => {
    assert.equal(isAdministratorRequest({ user: { name: "admin", group: "administrator" } }, { auth: true }), true);
});

test("ordinary authenticated user is rejected", () => {
    assert.equal(isAdministratorRequest({ user: { name: "listener", group: "user" } }, { auth: true }), false);
});

test("unauthenticated writes require an explicit opt-in", () => {
    assert.equal(isAdministratorRequest({}, { auth: false, allowUnauthenticatedWriteOperations: false }), false);
    assert.equal(isAdministratorRequest({}, { auth: false, allowUnauthenticatedWriteOperations: true }), true);
});

test("ordinary users may change their own credentials only after authentication", () => {
    assert.equal(isAuthenticatedWriteRequest({ user: { name: "listener" } }, { auth: true }), true);
    assert.equal(isAuthenticatedWriteRequest({}, { auth: true }), false);
    assert.equal(isAuthenticatedWriteRequest({}, { auth: false, allowUnauthenticatedWriteOperations: false }), false);
});

test("anonymous reads do not inherit the administrator account", () => {
    assert.equal(getRequestUsername({}, { auth: true }), null);
    assert.equal(getRequestUsername({ user: { name: "listener" } }, { auth: true }), "listener");
    assert.equal(getRequestUsername({}, { auth: false }), "admin");
});
