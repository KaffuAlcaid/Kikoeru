"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const sourceRoot = path.join(__dirname, "..", "src");
const files = [];

function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            if (fullPath === path.join(sourceRoot, "public")) {
                continue;
            }
            visit(fullPath);
        }
        else if (entry.isFile() && entry.name.endsWith(".js")) {
            files.push(fullPath);
        }
    }
}

visit(sourceRoot);
for (const file of files) {
    const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
    if (result.status !== 0) {
        process.exit(result.status || 1);
    }
}
console.log(`Syntax check passed for ${files.length} server files.`);

