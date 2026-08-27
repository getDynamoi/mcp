import { readFile } from "node:fs/promises";
import path from "node:path";

const EXPECTED_PACKAGE_NAME = "@dynamoi/mcp";
const EXPECTED_REMOTE_URL = "https://dynamoi.com/mcp";
const REGISTRY_API_URL = "https://registry.modelcontextprotocol.io/v0/servers";

type JsonObject = Record<string, unknown>;

export type RegistryContract = {
	mcpName: string;
	packageName: string;
	server: JsonObject;
	version: string;
};

export type RegistryVersionPresence = "absent" | "current";

type RetryOptions = {
	attempts: number;
	check: () => Promise<void>;
	delayMs: number;
	sleep?: (delayMs: number) => Promise<void>;
};

function asObject(value: unknown, label: string): JsonObject {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${label} must be a JSON object.`);
	}
	return value as JsonObject;
}

function requiredString(
	object: JsonObject,
	key: string,
	label: string,
): string {
	const value = object[key];
	if (typeof value !== "string" || value.length === 0) {
		throw new Error(`${label}.${key} must be a non-empty string.`);
	}
	return value;
}

function stableJson(value: unknown): string {
	if (Array.isArray(value)) {
		return `[${value.map(stableJson).join(",")}]`;
	}
	if (value && typeof value === "object") {
		return `{${Object.entries(value as JsonObject)
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`)
			.join(",")}}`;
	}
	return JSON.stringify(value);
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
	if (stableJson(actual) !== stableJson(expected)) {
		throw new Error(
			`${label} does not match server.json. Expected ${stableJson(expected)}, received ${stableJson(actual)}.`,
		);
	}
}

export function validateLocalContract(
	packageValue: unknown,
	serverValue: unknown,
): RegistryContract {
	const packageJson = asObject(packageValue, "package.json");
	const server = asObject(serverValue, "server.json");
	const packageName = requiredString(packageJson, "name", "package.json");
	const version = requiredString(packageJson, "version", "package.json");
	const mcpName = requiredString(packageJson, "mcpName", "package.json");
	const description = requiredString(server, "description", "server.json");

	if (packageName !== EXPECTED_PACKAGE_NAME) {
		throw new Error(
			`package.json.name must remain ${EXPECTED_PACKAGE_NAME}; received ${packageName}.`,
		);
	}
	assertEqual(server.name, mcpName, "server.json.name");
	assertEqual(server.version, version, "server.json.version");
	const descriptionLength = Array.from(description).length;
	if (descriptionLength > 100) {
		throw new Error(
			`server.json.description must be at most 100 characters; received ${descriptionLength}.`,
		);
	}

	const packages = server.packages;
	if (!Array.isArray(packages) || packages.length !== 1) {
		throw new Error(
			"server.json.packages must contain exactly one npm package.",
		);
	}
	const registryPackage = asObject(packages[0], "server.json.packages[0]");
	assertEqual(registryPackage.registryType, "npm", "package registry type");
	assertEqual(registryPackage.identifier, packageName, "package identifier");
	assertEqual(registryPackage.version, version, "package version");
	assertEqual(
		registryPackage.transport,
		{ type: "streamable-http", url: EXPECTED_REMOTE_URL },
		"package transport",
	);
	assertEqual(
		server.remotes,
		[{ type: "streamable-http", url: EXPECTED_REMOTE_URL }],
		"server remotes",
	);

	return { mcpName, packageName, server, version };
}

export function validateNpmMetadata(
	contract: RegistryContract,
	metadataValue: unknown,
): void {
	const metadata = asObject(metadataValue, "npm metadata");
	assertEqual(metadata.name, contract.packageName, "npm package name");
	assertEqual(metadata.version, contract.version, "npm package version");
	assertEqual(metadata.mcpName, contract.mcpName, "npm MCP registry name");
}

export function validateRegistryResponse(
	contract: RegistryContract,
	responseValue: unknown,
): void {
	const response = asObject(responseValue, "MCP Registry response");
	if (!Array.isArray(response.servers)) {
		throw new Error("MCP Registry response.servers must be an array.");
	}

	const match = response.servers
		.map((entry, index) =>
			asObject(entry, `MCP Registry response.servers[${index}]`),
		)
		.map((entry) => asObject(entry.server, "MCP Registry server entry"))
		.find(
			(server) =>
				server.name === contract.mcpName && server.version === contract.version,
		);
	if (!match) {
		throw new Error(
			`MCP Registry does not expose ${contract.mcpName}@${contract.version}.`,
		);
	}

	validateRegistryServer(contract, match);
}

function validateRegistryServer(
	contract: RegistryContract,
	server: JsonObject,
): void {
	for (const key of [
		"$schema",
		"name",
		"title",
		"description",
		"version",
		"websiteUrl",
		"repository",
		"packages",
		"remotes",
	] as const) {
		assertEqual(server[key], contract.server[key], `MCP Registry ${key}`);
	}
}

export async function inspectRegistryVersionResponse(
	contract: RegistryContract,
	response: Response,
): Promise<RegistryVersionPresence> {
	if (response.status === 404) {
		return "absent";
	}
	if (!response.ok) {
		throw new Error(
			`MCP Registry version lookup returned HTTP ${response.status}.`,
		);
	}
	const body = asObject(await response.json(), "MCP Registry version response");
	const server = asObject(body.server, "MCP Registry version response.server");
	validateRegistryServer(contract, server);
	return "current";
}

export async function waitForContract({
	attempts,
	check,
	delayMs,
	sleep = (duration) =>
		new Promise((resolve) => {
			setTimeout(resolve, duration);
		}),
}: RetryOptions): Promise<void> {
	if (!Number.isInteger(attempts) || attempts < 1) {
		throw new Error("Retry attempts must be a positive integer.");
	}
	if (!Number.isFinite(delayMs) || delayMs < 0) {
		throw new Error("Retry delay must be a non-negative number.");
	}

	let lastError: unknown;
	for (let attempt = 1; attempt <= attempts; attempt += 1) {
		try {
			// biome-ignore lint/performance/noAwaitInLoops: propagation checks must remain ordered and bounded.
			await check();
			return;
		} catch (error) {
			lastError = error;
			if (attempt === attempts) {
				break;
			}
			const boundedDelay = Math.min(delayMs * 2 ** (attempt - 1), 20_000);
			process.stderr.write(
				`Contract check ${attempt}/${attempts} failed: ${error instanceof Error ? error.message : String(error)}. Retrying in ${boundedDelay}ms.\n`,
			);
			// biome-ignore lint/performance/noAwaitInLoops: retries must wait for provider propagation before the next check.
			await sleep(boundedDelay);
		}
	}
	if (lastError instanceof Error) {
		throw new Error(lastError.message, { cause: lastError });
	}
	throw new Error(`Contract check failed: ${String(lastError)}`);
}

async function readContract(packageRoot: string): Promise<RegistryContract> {
	const [packageText, serverText] = await Promise.all([
		readFile(path.join(packageRoot, "package.json"), "utf8"),
		readFile(path.join(packageRoot, "server.json"), "utf8"),
	]);
	return validateLocalContract(JSON.parse(packageText), JSON.parse(serverText));
}

async function fetchJson(url: URL | string): Promise<unknown> {
	const response = await fetch(url, {
		headers: { accept: "application/json" },
		redirect: "error",
	});
	if (!response.ok) {
		throw new Error(`GET ${url} returned HTTP ${response.status}.`);
	}
	return response.json();
}

function parsePositiveInteger(
	value: string | undefined,
	fallback: number,
): number {
	if (value === undefined) {
		return fallback;
	}
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 1) {
		throw new Error(`Expected a positive integer, received ${value}.`);
	}
	return parsed;
}

function optionValue(args: string[], name: string): string | undefined {
	const index = args.indexOf(name);
	return index === -1 ? undefined : args[index + 1];
}

function exactRegistryVersionUrl(contract: RegistryContract): URL {
	return new URL(
		`${REGISTRY_API_URL}/${encodeURIComponent(contract.mcpName)}/versions/${encodeURIComponent(contract.version)}`,
	);
}

async function main(): Promise<void> {
	const [command = "local", ...args] = process.argv.slice(2);
	const packageRoot = process.cwd();
	const contract = await readContract(packageRoot);
	if (command === "local") {
		process.stdout.write(
			`Local MCP Registry contract is aligned at ${contract.mcpName}@${contract.version}.\n`,
		);
		return;
	}

	const attempts = parsePositiveInteger(optionValue(args, "--attempts"), 1);
	const delayMs = parsePositiveInteger(optionValue(args, "--delay-ms"), 5000);
	if (command === "npm") {
		const packagePath = encodeURIComponent(contract.packageName);
		const versionPath = encodeURIComponent(contract.version);
		await waitForContract({
			attempts,
			check: async () => {
				const metadata = await fetchJson(
					`https://registry.npmjs.org/${packagePath}/${versionPath}`,
				);
				validateNpmMetadata(contract, metadata);
			},
			delayMs,
		});
		process.stdout.write(
			`npm exposes ${contract.packageName}@${contract.version} with the expected MCP name.\n`,
		);
		return;
	}
	if (command === "registry-presence") {
		const presence = await inspectRegistryVersionResponse(
			contract,
			await fetch(exactRegistryVersionUrl(contract), {
				headers: { accept: "application/json" },
				redirect: "error",
			}),
		);
		process.stdout.write(`${presence}\n`);
		return;
	}
	if (command === "registry") {
		const registryUrl = new URL(REGISTRY_API_URL);
		registryUrl.searchParams.set("search", contract.mcpName);
		await waitForContract({
			attempts,
			check: async () => {
				validateRegistryResponse(contract, await fetchJson(registryUrl));
			},
			delayMs,
		});
		process.stdout.write(
			`Official MCP Registry exposes ${contract.mcpName}@${contract.version} with exact release metadata.\n`,
		);
		return;
	}
	throw new Error(
		`Unknown command ${command}. Use local, npm, registry-presence, or registry.`,
	);
}

if (import.meta.main) {
	await main();
}
