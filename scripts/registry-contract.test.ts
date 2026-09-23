import { describe, expect, test } from "bun:test";
import {
	type RegistryContract,
	inspectRegistryVersionResponse,
	validateLocalContract,
	validateNpmMetadata,
	validateRegistryResponse,
	waitForContract,
} from "./registry-contract";

const packageJson = {
	mcpName: "io.github.getDynamoi/dynamoi",
	name: "@dynamoi/mcp",
	version: "0.7.1",
};

const serverJson = {
	$schema:
		"https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
	description: "Dynamoi MCP",
	name: "io.github.getDynamoi/dynamoi",
	remotes: [{ type: "streamable-http", url: "https://dynamoi.com/mcp" }],
	repository: {
		source: "github",
		url: "https://github.com/getDynamoi/mcp",
	},
	title: "Dynamoi",
	version: "0.7.1",
	websiteUrl: "https://dynamoi.com",
};

function contract(): RegistryContract {
	return validateLocalContract(packageJson, serverJson);
}

describe("MCP Registry release contract", () => {
	test("accepts aligned package, npm, and official registry metadata", () => {
		const expected = contract();
		validateNpmMetadata(expected, {
			mcpName: expected.mcpName,
			name: expected.packageName,
			version: expected.version,
		});
		validateRegistryResponse(expected, {
			servers: [{ server: serverJson }],
		});
	});

	test("rejects a server.json that lists packages instead of remote-only", () => {
		expect(() =>
			validateLocalContract(packageJson, {
				...serverJson,
				packages: [
					{
						identifier: "@dynamoi/mcp",
						registryType: "npm",
						transport: {
							type: "streamable-http",
							url: "https://dynamoi.com/mcp",
						},
						version: "0.7.1",
					},
				],
			}),
		).toThrow("server.json must be remote-only; remove the packages array.");
	});

	test("rejects a registry entry that still lists packages", () => {
		expect(() =>
			validateRegistryResponse(contract(), {
				servers: [
					{
						server: {
							...serverJson,
							packages: [{ identifier: "@dynamoi/mcp", registryType: "npm" }],
						},
					},
				],
			}),
		).toThrow("MCP Registry entry must be remote-only (no packages).");
		expect(() =>
			validateRegistryResponse(contract(), {
				servers: [{ server: { ...serverJson, packages: [] } }],
			}),
		).not.toThrow();
	});

	test("rejects a registry name other than io.github.getDynamoi/dynamoi", () => {
		expect(() =>
			validateLocalContract(
				{ ...packageJson, mcpName: "io.github.someone/dynamoi" },
				{ ...serverJson, name: "io.github.someone/dynamoi" },
			),
		).toThrow("package.json.mcpName must remain io.github.getDynamoi/dynamoi");
	});

	test("rejects a remote URL other than the hosted endpoint", () => {
		expect(() =>
			validateLocalContract(packageJson, {
				...serverJson,
				remotes: [{ type: "streamable-http", url: "https://example.com/mcp" }],
			}),
		).toThrow("server remotes does not match server.json");
	});

	test("rejects a package version that is not synchronized to server.json", () => {
		expect(() =>
			validateLocalContract({ ...packageJson, version: "0.6.6" }, serverJson),
		).toThrow("server.json.version does not match server.json");
	});

	test("rejects descriptions above the official registry limit", () => {
		expect(() =>
			validateLocalContract(packageJson, {
				...serverJson,
				description: "x".repeat(101),
			}),
		).toThrow(
			"server.json.description must be at most 100 characters; received 101.",
		);
		expect(() =>
			validateLocalContract(packageJson, {
				...serverJson,
				description: "🎵".repeat(51),
			}),
		).not.toThrow();
	});

	test("rejects a stale official registry version", () => {
		expect(() =>
			validateRegistryResponse(contract(), {
				servers: [
					{
						server: {
							...serverJson,
							version: "0.4.0",
						},
					},
				],
			}),
		).toThrow(
			"MCP Registry does not expose io.github.getDynamoi/dynamoi@0.7.1",
		);
	});

	test("rejects registry metadata drift at the current version", () => {
		expect(() =>
			validateRegistryResponse(contract(), {
				servers: [
					{
						server: {
							...serverJson,
							description: "Stale description",
						},
					},
				],
			}),
		).toThrow("MCP Registry description does not match server.json");
	});

	test("distinguishes exact version absence from lookup failures", async () => {
		await expect(
			inspectRegistryVersionResponse(
				contract(),
				new Response('{"detail":"Server not found"}', { status: 404 }),
			),
		).resolves.toBe("absent");
		await expect(
			inspectRegistryVersionResponse(
				contract(),
				new Response("service unavailable", { status: 503 }),
			),
		).rejects.toThrow("version lookup returned HTTP 503");
		await expect(
			inspectRegistryVersionResponse(
				contract(),
				Response.json({ server: serverJson }),
			),
		).resolves.toBe("current");
	});

	test("retries bounded propagation failures and then succeeds", async () => {
		let checks = 0;
		const delays: number[] = [];
		await waitForContract({
			attempts: 3,
			check: async () => {
				checks += 1;
				if (checks < 3) {
					throw new Error("not propagated");
				}
			},
			delayMs: 100,
			sleep: async (delay) => {
				delays.push(delay);
			},
		});
		expect(checks).toBe(3);
		expect(delays).toEqual([100, 200]);
	});
});
