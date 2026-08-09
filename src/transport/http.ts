import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { normalizeLegacySmartLinkInclude } from "../server/smart-link-tools";

type HandleOptions = {
	createServer: () => McpServer;
	request: Request;
	parsedBody: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeLegacyDynamoiToolCallArguments(parsedBody: unknown): unknown {
	if (Array.isArray(parsedBody)) {
		return parsedBody.map((message) =>
			normalizeLegacyDynamoiToolCallArguments(message),
		);
	}
	if (!isRecord(parsedBody) || parsedBody.method !== "tools/call") {
		return parsedBody;
	}
	const params = parsedBody.params;
	if (!isRecord(params) || params.name !== "dynamoi_get_smart_link") {
		return parsedBody;
	}
	const normalizedArguments = normalizeLegacySmartLinkInclude(params.arguments);
	if (normalizedArguments === params.arguments) {
		return parsedBody;
	}
	return {
		...parsedBody,
		params: {
			...params,
			arguments: normalizedArguments,
		},
	};
}

export async function handleMcpHttpRequest(
	options: HandleOptions,
): Promise<Response> {
	if (options.request.method.toUpperCase() !== "POST") {
		return new Response(
			JSON.stringify({
				error: { code: -32_000, message: "Method not allowed." },
				id: null,
				jsonrpc: "2.0",
			}),
			{
				headers: {
					Allow: "POST",
					"content-type": "application/json",
				},
				status: 405,
			},
		);
	}

	const parsedBody = normalizeLegacyDynamoiToolCallArguments(
		options.parsedBody,
	);

	// Each request owns its transport. MCP sessions are optional, and this helper
	// deliberately does not advertise a reusable session that serverless routing
	// cannot guarantee will reach the same process.
	const transport = new WebStandardStreamableHTTPServerTransport();

	const server = options.createServer();
	await server.connect(transport);

	return transport.handleRequest(options.request, {
		parsedBody,
	});
}
