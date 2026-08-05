"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { getSmartAudioFolderPath } = require("../../src/filesystem/utils");

const audio = title => ({ type: "audio", title });
const folder = (title, children) => ({ type: "folder", title, children });

test("smart path follows the configured audio type priority", () => {
    const tree = [
        folder("MP3", [audio("01.mp3")]),
        folder("Lossless", [audio("01.flac"), audio("02.flac")]),
    ];

    assert.deepEqual(getSmartAudioFolderPath(tree, {
        enabled: true,
        preferEffect: false,
        audioTypes: "mp3,flac,wav,opus,m4a,aac",
    }), ["MP3"]);
    assert.deepEqual(getSmartAudioFolderPath(tree, {
        enabled: true,
        preferEffect: false,
        audioTypes: "flac,mp3,wav,opus,m4a,aac",
    }), ["Lossless"]);
});

test("effect folders take precedence when the preference is enabled", () => {
    const tree = [
        folder("Main", [audio("01.mp3"), audio("02.mp3")]),
        folder("01_効果音", [audio("door.wav")]),
    ];

    assert.deepEqual(getSmartAudioFolderPath(tree, {
        enabled: true,
        preferEffect: true,
        audioTypes: "mp3,flac,wav,opus,m4a,aac",
    }), ["01_効果音"]);
    assert.deepEqual(getSmartAudioFolderPath(tree, {
        enabled: true,
        preferEffect: false,
        audioTypes: "mp3,flac,wav,opus,m4a,aac",
    }), ["Main"]);
});

test("smart path chooses the most populated matching folder and can be disabled", () => {
    const tree = [
        folder("Part 1", [audio("01.mp3")]),
        folder("Part 2", [audio("01.mp3"), audio("02.mp3")]),
    ];

    assert.deepEqual(getSmartAudioFolderPath(tree, { enabled: true }), ["Part 2"]);
    assert.deepEqual(getSmartAudioFolderPath(tree, { enabled: false }), []);
});
