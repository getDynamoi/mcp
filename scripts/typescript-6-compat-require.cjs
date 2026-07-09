const { createRequire } = require("node:module");

const localRequire = createRequire(__filename);
const typescriptCompatPath = localRequire.resolve("typescript");
const moduleApi = require("node:module");
const originalLoad = moduleApi._load;

if (!globalThis.__dynamoiMcpTypeScriptCompatRequireInstalled) {
	// Temporary TS6 quarantine for tsup DTS generation. See Brain: businesses/dynamoi/prds/typescript-7-upgrade-plan
	globalThis.__dynamoiMcpTypeScriptCompatRequireInstalled = true;
	moduleApi._load = function loadWithMcpTypescript(request, parent, isMain) {
		if (request === "typescript") {
			return originalLoad.call(this, typescriptCompatPath, parent, isMain);
		}
		return originalLoad.call(this, request, parent, isMain);
	};
}
