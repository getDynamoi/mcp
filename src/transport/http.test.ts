import { describe, expect, test } from "bun:test";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
	LATEST_PROTOCOL_VERSION,
	SUPPORTED_PROTOCOL_VERSIONS,
} from "@modelcontextprotocol/sdk/types.js";
import { handleMcpHttpRequest } from "./http";

function makeInitializeBody() {
	return {
		id: 1,
		jsonrpc: "2.0",
		method: "initialize",
		params: {
			capabilities: {},
			clientInfo: { name: "test-client", version: "0.0.0" },
			protocolVersion: LATEST_PROTOCOL_VERSION,
		},
	};
}

describe("mcp/transport session binding", () => {
	test("reusing a session across different auth contexts is rejected", async () => {
		const initReq = new Request("http://example.com/mcp", {
			body: JSON.stringify(makeInitializeBody()),
			headers: {
				accept: "application/json, text/event-stream",
				"content-type": "application/json",
			},
			method: "POST",
		});

		const initRes = await handleMcpHttpRequest({
			createServer: () => new McpServer({ name: "test", version: "0.0.0" }),
			parsedBody: makeInitializeBody(),
			request: initReq,
			sessionContextKey: "user-a:client-x",
		});

		const sid = initRes.headers.get("mcp-session-id");
		expect(sid).toBeTruthy();
		if (!sid) {
			throw new Error("Expected mcp-session-id header on initialize response");
		}

		const nextReq = new Request("http://example.com/mcp", {
			body: JSON.stringify({ id: 2, jsonrpc: "2.0", method: "tools/list" }),
			headers: {
				accept: "application/json, text/event-stream",
				"content-type": "application/json",
				"mcp-session-id": sid,
			},
			method: "POST",
		});

		const mismatchRes = await handleMcpHttpRequest({
			createServer: () => new McpServer({ name: "test", version: "0.0.0" }),
			parsedBody: { id: 2, jsonrpc: "2.0", method: "tools/list" },
			request: nextReq,
			sessionContextKey: "user-b:client-x",
		});

		expect(mismatchRes.status).toBe(404);
		const json = (await mismatchRes.json()) as {
			error?: { code?: number; message?: string };
		};
		expect(json.error?.code).toBe(-32_001);
		expect(json.error?.message).toBe("Session not found");
	});

	test("unknown session IDs are rejected instead of creating a new session", async () => {
		const requestBody = { id: 2, jsonrpc: "2.0", method: "tools/list" };
		const request = new Request("http://example.com/mcp", {
			body: JSON.stringify(requestBody),
			headers: {
				accept: "application/json, text/event-stream",
				"content-type": "application/json",
				"mcp-session-id": "missing-session",
			},
			method: "POST",
		});

		const response = await handleMcpHttpRequest({
			createServer: () => new McpServer({ name: "test", version: "0.0.0" }),
			parsedBody: requestBody,
			request,
			sessionContextKey: "user-a:client-x",
		});

		expect(response.status).toBe(404);
		const json = (await response.json()) as {
			error?: { code?: number; message?: string };
		};
		expect(json.error?.code).toBe(-32_001);
		expect(json.error?.message).toBe("Session not found");
	});

	test("invalid MCP protocol versions are rejected on session requests", async () => {
		const initReq = new Request("http://example.com/mcp", {
			body: JSON.stringify(makeInitializeBody()),
			headers: {
				accept: "application/json, text/event-stream",
				"content-type": "application/json",
			},
			method: "POST",
		});
		const initRes = await handleMcpHttpRequest({
			createServer: () => new McpServer({ name: "test", version: "0.0.0" }),
			parsedBody: makeInitializeBody(),
			request: initReq,
			sessionContextKey: "user-a:client-x",
		});
		const sid = initRes.headers.get("mcp-session-id");
		if (!sid) {
			throw new Error("Expected mcp-session-id header on initialize response");
		}

		const requestBody = { id: 2, jsonrpc: "2.0", method: "tools/list" };
		const request = new Request("http://example.com/mcp", {
			body: JSON.stringify(requestBody),
			headers: {
				accept: "application/json, text/event-stream",
				"content-type": "application/json",
				"mcp-protocol-version": "1900-01-01",
				"mcp-session-id": sid,
			},
			method: "POST",
		});

		const response = await handleMcpHttpRequest({
			createServer: () => new McpServer({ name: "test", version: "0.0.0" }),
			parsedBody: requestBody,
			request,
			sessionContextKey: "user-a:client-x",
		});

		expect(response.status).toBe(400);
		const json = (await response.json()) as {
			error?: { message?: string };
		};
		expect(json.error?.message).toContain("Unsupported protocol version");
	});

	test("supported and missing MCP protocol versions follow SDK compatibility behavior", async () => {
		const initReq = new Request("http://example.com/mcp", {
			body: JSON.stringify(makeInitializeBody()),
			headers: {
				accept: "application/json, text/event-stream",
				"content-type": "application/json",
			},
			method: "POST",
		});
		const server = new McpServer({ name: "test", version: "0.0.0" });
		const initRes = await handleMcpHttpRequest({
			createServer: () => server,
			parsedBody: makeInitializeBody(),
			request: initReq,
			sessionContextKey: "user-c:client-x",
		});
		const sid = initRes.headers.get("mcp-session-id");
		if (!sid) {
			throw new Error("Expected mcp-session-id header on initialize response");
		}

		const supportedRequestBody = {
			id: 3,
			jsonrpc: "2.0",
			method: "tools/list",
		};
		const supportedHeaders = new Headers({
			accept: "application/json, text/event-stream",
			"content-type": "application/json",
			"mcp-protocol-version": SUPPORTED_PROTOCOL_VERSIONS[0],
			"mcp-session-id": sid,
		});
		const supportedResponse = await handleMcpHttpRequest({
			createServer: () => server,
			parsedBody: supportedRequestBody,
			request: new Request("http://example.com/mcp", {
				body: JSON.stringify(supportedRequestBody),
				headers: supportedHeaders,
				method: "POST",
			}),
			sessionContextKey: "user-c:client-x",
		});
		expect(supportedResponse.status).not.toBe(400);

		const missingRequestBody = {
			id: 4,
			jsonrpc: "2.0",
			method: "tools/list",
		};
		const missingResponse = await handleMcpHttpRequest({
			createServer: () => server,
			parsedBody: missingRequestBody,
			request: new Request("http://example.com/mcp", {
				body: JSON.stringify(missingRequestBody),
				headers: {
					accept: "application/json, text/event-stream",
					"content-type": "application/json",
					"mcp-session-id": sid,
				},
				method: "POST",
			}),
			sessionContextKey: "user-c:client-x",
		});
		expect(missingResponse.status).not.toBe(400);
	});
});
