#!/usr/bin/env node
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const entrypoint = require.resolve("typescript-7");
const tsc = path.join(path.dirname(entrypoint), "..", "bin", "tsc");
const result = spawnSync(process.execPath, [tsc, ...process.argv.slice(2)], {
	stdio: "inherit",
});

process.exit(result.status ?? 1);
