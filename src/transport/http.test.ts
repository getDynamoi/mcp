import { describe, expect, test } from "bun:test";
import {
	Client,
	StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import {
	LATEST_PROTOCOL_VERSION,
	McpServer,
} from "@modelcontextprotocol/server";
import { z } from "zod/v4";
import { handleMcpHttpRequest } from "./http";

function makeInitializeBody(protocolVersion = LATEST_PROTOCOL_VERSION) {
	return {
		id: 1,
		jsonrpc: "2.0",
		method: "initialize",
		params: {
			capabilities: {},
			clientInfo: { name: "test-client", version: "0.0.0" },
			protocolVersion,
		},
	};
}

function makePostRequest(body: unknown, headers: HeadersInit = {}) {
	return new Request("http://example.com/mcp", {
		body: JSON.stringify(body),
		headers: {
			accept: "application/json, text/event-stream",
			"content-type": "application/json",
			...headers,
		},
		method: "POST",
	});
}

const MODERN_PROTOCOL_VERSION = "2026-07-28";

function makeModernRequest(
	method: string,
	params: Record<string, unknown> = {},
) {
	const body = {
		id: 7,
		jsonrpc: "2.0",
		method,
		params: {
			...params,
			_meta: {
				"io.modelcontextprotocol/clientCapabilities": {},
				"io.modelcontextprotocol/protocolVersion": MODERN_PROTOCOL_VERSION,
			},
		},
	};
	const name = params["name"];
	const headers = {
		accept: "application/json",
		"mcp-method": method,
		"mcp-protocol-version": MODERN_PROTOCOL_VERSION,
		...(typeof name === "string" ? { "mcp-name": name } : {}),
	};
	return { body, request: makePostRequest(body, headers) };
}

function createTestServer() {
	const server = new McpServer({ name: "test", version: "0.0.0" });
	server.registerTool(
		"ping",
		{ description: "Return pong.", inputSchema: z.object({}) },
		async () => ({ content: [{ text: "pong", type: "text" }] }),
	);
	return server;
}

describe("mcp/transport stateless HTTP", () => {
	test.each(["GET", "DELETE"])(
		"answers %s with 405 because there is no stream or session",
		async (method) => {
			const response = await handleMcpHttpRequest({
				createServer: createTestServer,
				parsedBody: null,
				request: new Request("http://example.com/mcp", {
					headers: { accept: "text/event-stream" },
					method,
				}),
			});

			expect(response.status).toBe(405);
			expect(response.headers.get("allow")).toBe("POST");
		},
	);

	test.each([
		["server/discover", {}],
		["tools/list", {}],
		["tools/call", { arguments: {}, name: "ping" }],
	] as const)(
		"serves a 2026-07-28 %s request instead of rejecting its protocol version",
		async (method, params) => {
			const { body, request } = makeModernRequest(method, params);
			const response = await handleMcpHttpRequest({
				createServer: createTestServer,
				parsedBody: body,
				request,
			});

			expect(response.status).toBe(200);
			expect(response.headers.get("content-type")).toContain(
				"application/json",
			);
			const json = (await response.json()) as {
				result: Record<string, unknown>;
			};
			expect(json.result["resultType"]).toBe("complete");
			expect(json.result["_meta"]).toMatchObject({
				"io.modelcontextprotocol/serverInfo": { name: "test" },
			});
			if (method === "server/discover") {
				expect(json.result["supportedVersions"]).toEqual([
					MODERN_PROTOCOL_VERSION,
				]);
			}
		},
	);

	test.each(["2024-11-05", "2025-06-18", LATEST_PROTOCOL_VERSION])(
		"initialize negotiates %s without advertising a reusable session",
		async (protocolVersion) => {
			const body = makeInitializeBody(protocolVersion);
			const response = await handleMcpHttpRequest({
				createServer: createTestServer,
				parsedBody: body,
				request: makePostRequest(body),
			});

			expect(response.status).toBe(200);
			expect(response.headers.get("mcp-session-id")).toBeNull();
			expect(response.headers.get("content-type")).toContain(
				"text/event-stream",
			);
			expect(await response.text()).toContain(
				`"protocolVersion":"${protocolVersion}"`,
			);
		},
	);

	test("tools/list responds with text/event-stream when client accepts event stream", async () => {
		const body = { id: 2, jsonrpc: "2.0", method: "tools/list" };
		const response = await handleMcpHttpRequest({
			createServer: createTestServer,
			parsedBody: body,
			request: makePostRequest(body),
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/event-stream");
		expect(await response.text()).toContain('"name":"ping"');
	});

	test("JSON-only probes (e.g. OpenAI ChatGPT) succeed in JSON response mode", async () => {
		const body = { id: 3, jsonrpc: "2.0", method: "tools/list" };
		const response = await handleMcpHttpRequest({
			createServer: createTestServer,
			parsedBody: body,
			request: makePostRequest(body, { accept: "application/json" }),
		});

		// The legacy interop shim keeps 2025-era JSON-only clients (ChatGPT)
		// from the SDK's 406 and answers them with JSON, not SSE.
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("application/json");
		await expect(response.json()).resolves.toMatchObject({
			result: { tools: [expect.objectContaining({ name: "ping" })] },
		});
	});

	test("wildcard or omitted Accept header defaults to JSON response mode", async () => {
		const body = { id: 4, jsonrpc: "2.0", method: "tools/list" };
		const response = await handleMcpHttpRequest({
			createServer: createTestServer,
			parsedBody: body,
			request: new Request("http://example.com/mcp", {
				body: JSON.stringify(body),
				headers: {
					"content-type": "application/json",
				},
				method: "POST",
			}),
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("application/json");
		await expect(response.json()).resolves.toMatchObject({
			result: { tools: [expect.objectContaining({ name: "ping" })] },
		});
	});

	test("independent requests do not depend on process-local session state", async () => {
		const body = { id: 2, jsonrpc: "2.0", method: "tools/list" };
		const response = await handleMcpHttpRequest({
			createServer: createTestServer,
			parsedBody: body,
			request: makePostRequest(body, {
				"mcp-session-id": "stale-session-from-another-instance",
			}),
		});

		expect(response.status).toBe(200);
		expect(await response.text()).toContain('"name":"ping"');
	});

	test.each([
		["legacy", "2025-11-25"],
		["auto", MODERN_PROTOCOL_VERSION],
	] as const)(
		"the official client in %s negotiation lists tools across fresh server instances",
		async (mode, negotiatedVersion) => {
			const requests: Array<{
				method: string;
				protocolVersion: string | null;
				sessionId: string | null;
			}> = [];
			let serverCount = 0;
			const transport = new StreamableHTTPClientTransport(
				new URL("http://example.com/mcp"),
				{
					fetch: async (input, init) => {
						const request = new Request(input, init);
						requests.push({
							method: request.method,
							protocolVersion: request.headers.get("mcp-protocol-version"),
							sessionId: request.headers.get("mcp-session-id"),
						});
						const parsedBody =
							request.method === "POST" ? await request.clone().json() : null;
						return handleMcpHttpRequest({
							createServer: () => {
								serverCount += 1;
								return createTestServer();
							},
							parsedBody,
							request,
						});
					},
				},
			);
			const client = new Client(
				{ name: "official-sdk-client", version: "1.0.0" },
				{ versionNegotiation: { mode } },
			);

			await client.connect(transport);
			await expect(client.listTools()).resolves.toMatchObject({
				tools: [expect.objectContaining({ name: "ping" })],
			});
			await client.close();

			expect(serverCount).toBeGreaterThanOrEqual(2);
			expect(requests.at(-1)).toMatchObject({
				method: "POST",
				protocolVersion: negotiatedVersion,
			});
			expect(requests.every((request) => request.sessionId === null)).toBe(
				true,
			);
			if (mode === "auto") {
				// The modern probe succeeds, so there is no initialize fallback.
				expect(
					requests.every(
						(request) => request.protocolVersion === MODERN_PROTOCOL_VERSION,
					),
				).toBe(true);
			}
		},
	);

	test.each([
		["JSON", "application/json"],
		["SSE", "application/json, text/event-stream"],
	])(
		"closes the legacy server once its %s response completes",
		async (_mode, accept) => {
			let closes = 0;
			const createServer = () => {
				const server = createTestServer();
				const close = server.close.bind(server);
				server.close = async () => {
					closes += 1;
					await close();
				};
				return server;
			};
			const body = { id: 11, jsonrpc: "2.0", method: "tools/list" };
			const response = await handleMcpHttpRequest({
				createServer,
				parsedBody: body,
				request: makePostRequest(body, { accept }),
			});

			expect(await response.text()).toContain('"name":"ping"');
			expect(closes).toBe(1);
		},
	);

	test("closes the legacy server when the client disconnects", async () => {
		let closes = 0;
		const controller = new AbortController();
		const createServer = () => {
			const server = createTestServer();
			const close = server.close.bind(server);
			server.close = async () => {
				closes += 1;
				await close();
			};
			return server;
		};
		const body = { id: 12, jsonrpc: "2.0", method: "tools/list" };
		const request = new Request("http://example.com/mcp", {
			body: JSON.stringify(body),
			headers: {
				accept: "application/json, text/event-stream",
				"content-type": "application/json",
			},
			method: "POST",
			signal: controller.signal,
		});
		const response = await handleMcpHttpRequest({
			createServer,
			parsedBody: body,
			request,
		});
		controller.abort();
		await response.body?.cancel().catch(() => undefined);

		expect(closes).toBe(1);
	});

	test("invalid protocol versions are rejected without session state", async () => {
		const body = { id: 3, jsonrpc: "2.0", method: "tools/list" };
		const response = await handleMcpHttpRequest({
			createServer: createTestServer,
			parsedBody: body,
			request: makePostRequest(body, {
				"mcp-protocol-version": "1900-01-01",
			}),
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toMatchObject({
			error: {
				message: expect.stringContaining("Unsupported protocol version"),
			},
		});
	});
});
