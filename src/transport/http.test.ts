import { describe, expect, test } from "bun:test";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LATEST_PROTOCOL_VERSION } from "@modelcontextprotocol/sdk/types.js";
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
			headers: { "content-type": "application/json" },
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
			headers: { "content-type": "application/json", "mcp-session-id": sid },
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
});
