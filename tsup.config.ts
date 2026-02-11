import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "tsup";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
	readFileSync(path.join(here, "package.json"), "utf8"),
) as {
	version: string;
};

export default defineConfig({
	clean: true,
	define: {
		__DYNAMOI_MCP_VERSION__: JSON.stringify(pkg.version),
	},
	dts: true,
	entry: ["src/index.ts"],
	external: ["@modelcontextprotocol/sdk", "jose", "zod"],
	format: ["esm"],
	minify: false,
	outDir: "dist",
	sourcemap: true,
	target: "es2022",
});
