import { defineConfig } from "tsup";

export default defineConfig({
	clean: true,
	dts: true,
	entry: ["src/index.ts"],
	external: ["@modelcontextprotocol/sdk", "jose", "zod"],
	format: ["esm"],
	minify: false,
	outDir: "dist",
	sourcemap: true,
	target: "es2022",
});
