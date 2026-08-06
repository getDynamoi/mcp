const { readFileSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const { build } = require("tsup");

const packageRoot = path.resolve(__dirname, "..");
const typescriptPackagePath = require.resolve("typescript/package.json", {
	paths: [packageRoot],
});
const typescriptPackage = JSON.parse(
	readFileSync(typescriptPackagePath, "utf8"),
);
const typescriptCli = path.resolve(
	path.dirname(typescriptPackagePath),
	typescriptPackage.bin.tsc,
);
const packageMetadata = JSON.parse(
	readFileSync(path.join(packageRoot, "package.json"), "utf8"),
);

const watch = process.argv.includes("--watch");

function emitDeclarations() {
	const result = spawnSync(typescriptCli, ["--emitDeclarationOnly"], {
		cwd: packageRoot,
		stdio: "inherit",
	});
	if (result.status !== 0) {
		throw new Error("TypeScript declaration generation failed");
	}
}

build({
	clean: true,
	define: {
		__DYNAMOI_MCP_VERSION__: JSON.stringify(packageMetadata.version),
	},
	dts: false,
	entry: ["src/index.ts", "src/auth/protected-resource.ts", "src/consent.ts"],
	external: ["@modelcontextprotocol/sdk", "jose", "zod"],
	format: ["esm"],
	minify: false,
	onSuccess: watch
		? `${JSON.stringify(typescriptCli)} --emitDeclarationOnly`
		: undefined,
	outDir: "dist",
	sourcemap: true,
	target: "es2022",
	watch,
})
	.then(() => {
		if (!watch) {
			emitDeclarations();
		}
		return undefined;
	})
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	});
