import { describe, expect, test } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LATEST_PROTOCOL_VERSION } from "@modelcontextprotocol/sdk/types.js";
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

function createTestServer() {
	const server = new McpServer({ name: "test", version: "0.0.0" });
	server.registerTool(
		"ping",
		{ description: "Return pong.", inputSchema: {} },
		async () => ({ content: [{ text: "pong", type: "text" }] }),
	);
	return server;
}

describe("mcp/transport stateless HTTP", () => {
	test("declines standalone SSE because there is no reusable session stream", async () => {
		const response = await handleMcpHttpRequest({
			createServer: createTestServer,
			parsedBody: null,
			request: new Request("http://example.com/mcp", {
				headers: { accept: "text/event-stream" },
				method: "GET",
			}),
		});

		expect(response.status).toBe(405);
		expect(response.headers.get("allow")).toBe("POST");
	});

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
			expect(await response.text()).toContain(
				`"protocolVersion":"${protocolVersion}"`,
			);
		},
	);

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

	test("the official client initializes and lists tools across fresh server instances", async () => {
		const requests: Array<{ method: string; sessionId: string | null }> = [];
		let serverCount = 0;
		const transport = new StreamableHTTPClientTransport(
			new URL("http://example.com/mcp"),
			{
				fetch: async (input, init) => {
					const request = new Request(input, init);
					requests.push({
						method: request.method,
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
		const client = new Client({
			name: "official-sdk-client",
			version: "1.0.0",
		});

		await client.connect(transport);
		await expect(client.listTools()).resolves.toMatchObject({
			tools: [expect.objectContaining({ name: "ping" })],
		});
		await client.close();

		expect(serverCount).toBeGreaterThanOrEqual(3);
		expect(requests.some((request) => request.method === "GET")).toBe(true);
		expect(requests.every((request) => request.sessionId === null)).toBe(true);
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
