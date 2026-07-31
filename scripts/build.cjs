const { readFileSync } = require("node:fs");
const path = require("node:path");

const { build } = require("tsup");

const packageRoot = path.resolve(__dirname, "..");
const packageMetadata = JSON.parse(
	readFileSync(path.join(packageRoot, "package.json"), "utf8"),
);

build({
	clean: true,
	define: {
		__DYNAMOI_MCP_VERSION__: JSON.stringify(packageMetadata.version),
	},
	dts: true,
	entry: ["src/index.ts", "src/auth/protected-resource.ts", "src/consent.ts"],
	external: ["@modelcontextprotocol/sdk", "jose", "zod"],
	format: ["esm"],
	minify: false,
	outDir: "dist",
	sourcemap: true,
	target: "es2022",
	watch: process.argv.includes("--watch"),
}).catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
