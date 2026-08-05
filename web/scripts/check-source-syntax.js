"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const sourceRoot = path.join(__dirname, "..", "src");
const sources = [];

function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            visit(fullPath);
        }
        else if (entry.isFile() && entry.name.endsWith(".js")) {
            sources.push({ file: fullPath, source: fs.readFileSync(fullPath, "utf8") });
        }
        else if (entry.isFile() && entry.name.endsWith(".vue")) {
            const content = fs.readFileSync(fullPath, "utf8");
            const match = content.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i);
            if (match) {
                sources.push({ file: fullPath, source: match[1] });
            }
        }
    }
}

visit(sourceRoot);
for (const item of sources) {
    const result = spawnSync(process.execPath, ["--check", "--input-type=module"], {
        input: item.source,
        encoding: "utf8",
    });
    if (result.status !== 0) {
        console.error(`Syntax check failed: ${item.file}`);
        process.stderr.write(result.stderr || "");
        process.exit(result.status || 1);
    }
}
console.log(`Syntax check passed for ${sources.length} web source files.`);

